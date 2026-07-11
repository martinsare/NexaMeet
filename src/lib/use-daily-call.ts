import { useCallback, useEffect, useRef, useState } from "react";
import Daily, {
  type DailyCall,
  type DailyEventObjectAppMessage,
  type DailyEventObjectParticipant,
} from "@daily-co/daily-js";

export type CallParticipant = {
  sessionId: string;
  userName: string;
  local: boolean;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  audioOn: boolean;
  videoOn: boolean;
  screenTrack: MediaStreamTrack | null;
};

export type ChatMessage = { id: number; from: string; text: string; mine: boolean };
export type ReactionMessage = { id: number; emoji: string };

export type NonVerbalFeedback = "yes" | "no" | "slow-down" | "speed-up";

type AppMessagePayload =
  | { kind: "chat"; from: string; text: string }
  | { kind: "reaction"; emoji: string }
  | { kind: "end-meeting" }
  | { kind: "host-mute"; sessionId: string }
  | { kind: "host-stop-video"; sessionId: string }
  | { kind: "non-verbal"; sessionId: string; feedback: NonVerbalFeedback | null }
  | { kind: "rename"; sessionId: string; newName: string }
  | { kind: "lock-mute"; targetSessionId: string; locked: boolean }
  | { kind: "chat-enabled"; enabled: boolean }
  | { kind: "reactions-enabled"; enabled: boolean }
  | { kind: "promote-cohost"; targetSessionId: string; promoted: boolean }
  | { kind: "spotlight"; targetSessionId: string | null };

function toParticipant(p: {
  session_id: string;
  user_name: string;
  local: boolean;
  audio: boolean;
  video: boolean;
  tracks: { video: { persistentTrack?: MediaStreamTrack }; audio: { persistentTrack?: MediaStreamTrack }; screenVideo?: { persistentTrack?: MediaStreamTrack } };
}): CallParticipant {
  return {
    sessionId: p.session_id,
    userName: p.user_name || "Guest",
    local: p.local,
    audioOn: p.audio,
    videoOn: p.video,
    videoTrack: p.tracks.video?.persistentTrack ?? null,
    audioTrack: p.tracks.audio?.persistentTrack ?? null,
    screenTrack: p.tracks.screenVideo?.persistentTrack ?? null,
  };
}

/**
 * Wraps the Daily.co call-object SDK so MeetingRoom can keep its own custom
 * UI (grid, chat panel, controls) while real WebRTC audio/video/chat flows
 * through Daily underneath.
 */
export type UseDailyCallOptions = {
  /** Records mixed call audio for the AI notes pipeline (host only). */
  recordForAiNotes?: boolean;
  /** Gate for a pre-join lobby: the call doesn't actually connect until this is true. */
  enabled?: boolean;
  /** Whether mic/camera should start on when the call connects (set from the lobby's toggles). */
  initialAudioOn?: boolean;
  initialVideoOn?: boolean;
  /**
   * The meeting host's user ID. When provided, all participants join the same
   * stable Daily room (the host's personal room) rather than a per-meeting room.
   * Only the short-lived token changes per session.
   */
  hostId?: string;
  /** Optional breakout-room ID for in-meeting rooms. */
  roomId?: string;
  /** Called on non-host participants when the host ends the meeting for everyone. */
  onMeetingEnded?: () => void;
  /**
   * When true the minted Daily token gets is_owner:true, which allows the
   * host to call updateParticipant (remote mute / stop video / eject).
   */
  isHost?: boolean;
};

export function useDailyCall(meetingId: string | undefined, userName: string, options: UseDailyCallOptions = {}) {
  const { recordForAiNotes = false, enabled = true, initialAudioOn = true, initialVideoOn = true, hostId, roomId, onMeetingEnded, isHost = false } = options;
  const onMeetingEndedRef = useRef(onMeetingEnded);
  onMeetingEndedRef.current = onMeetingEnded;
  // Keep the latest lobby choices in a ref so the join effect (keyed on `enabled`
  // flipping to true) always reads the value picked right before joining.
  const initialAVRef = useRef({ initialAudioOn, initialVideoOn });
  initialAVRef.current = { initialAudioOn, initialVideoOn };
  // Keep hostId in a ref — it's used inside the join effect but must not be
  // a dep (we don't want to restart the call just because hostId resolved).
  const hostIdRef = useRef(hostId);
  hostIdRef.current = hostId;
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;
  const callRef = useRef<DailyCall | null>(null);
  // Track objects stored directly from track-started events — more reliable than
  // reading persistentTrack from call.participants() which can lag or share refs.
  const trackCacheRef = useRef<Record<string, { video?: MediaStreamTrack; audio?: MediaStreamTrack }>>({});
  const [participants, setParticipants] = useState<Record<string, CallParticipant>>({});
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionMessage[]>([]);
  const [networkQuality, setNetworkQuality] = useState<"good" | "low" | "very-low">("good");
  // ── Host-signalled call state (synced to all via app-message) ───────────────
  const [nonVerbalFeedback, setNonVerbalFeedback] = useState<Record<string, NonVerbalFeedback>>({});
  const [participantRenames, setParticipantRenames] = useState<Record<string, string>>({});
  const [lockedMutes, setLockedMutes] = useState<Set<string>>(new Set());
  const [chatEnabled, setChatEnabledInner] = useState(true);
  const [reactionsEnabled, setReactionsEnabledInner] = useState(true);
  const [cohosts, setCohosts] = useState<Set<string>>(new Set());
  const [spotlightId, setSpotlightId] = useState<string | null>(null);

  // ── Audio recording for the AI notes pipeline (host only) ──────────────────
  // Mixes every participant's audio track into one stream via Web Audio API
  // so a single MediaRecorder captures the whole conversation, not just the
  // local mic. Groq Whisper only needs audio, so video is never touched.
  const audioContextRef = useRef<AudioContext | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const connectedTracksRef = useRef<Set<string>>(new Set());

  const ensureRecorder = useCallback(() => {
    if (!recordForAiNotes || recorderRef.current) return;
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return;
    const ctx = new AudioContext();
    const destination = ctx.createMediaStreamDestination();
    audioContextRef.current = ctx;
    destinationRef.current = destination;
    const recorder = new MediaRecorder(destination.stream, { mimeType: "audio/webm" });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.start(1000);
    recorderRef.current = recorder;
  }, [recordForAiNotes]);

  const connectAudioTrack = useCallback((sessionId: string, track: MediaStreamTrack | null) => {
    if (!recordForAiNotes || !track) return;
    ensureRecorder();
    const ctx = audioContextRef.current;
    const destination = destinationRef.current;
    if (!ctx || !destination || connectedTracksRef.current.has(track.id)) return;
    try {
      const source = ctx.createMediaStreamSource(new MediaStream([track]));
      source.connect(destination);
      connectedTracksRef.current.add(track.id);
      void sessionId;
    } catch {
      // A track can fail to connect if it's already ended; safe to ignore.
    }
  }, [recordForAiNotes, ensureRecorder]);

  /** Stops the recorder and resolves with the mixed-audio recording. */
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(recordedChunksRef.current.length ? new Blob(recordedChunksRef.current, { type: "audio/webm" }) : null);
        return;
      }
      recorder.onstop = () => {
        const blob = recordedChunksRef.current.length ? new Blob(recordedChunksRef.current, { type: "audio/webm" }) : null;
        resolve(blob);
      };
      recorder.stop();
      audioContextRef.current?.close().catch(() => {});
    });
  }, []);

  const syncParticipants = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    const raw = call.participants();
    const next: Record<string, CallParticipant> = {};
    for (const key of Object.keys(raw)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = raw[key] as any;
      const cached = trackCacheRef.current[p.session_id as string] ?? {};
      next[key] = {
        sessionId:  p.session_id,
        userName:   p.user_name || "Guest",
        local:      p.local,
        audioOn:    p.audio,
        videoOn:    p.video,
        // Prefer event-sourced tracks (precise, immediately available) over
        // persistentTrack (same stable ref regardless of on/off state).
        videoTrack: cached.video  ?? p.tracks.video?.persistentTrack  ?? null,
        audioTrack: cached.audio  ?? p.tracks.audio?.persistentTrack  ?? null,
        screenTrack: p.tracks.screenVideo?.persistentTrack ?? null,
      };
    }
    setParticipants(next);
  }, []);

  useEffect(() => {
    if (!meetingId || !enabled) return;
    let destroyed = false;

    async function start() {
      try {
        const res = await fetch("/api/daily-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meetingId, userName, hostId: hostIdRef.current, roomId: roomIdRef.current, isHost }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to start call");
        if (destroyed) return;

        const { initialAudioOn: audioOn, initialVideoOn: videoOn } = initialAVRef.current;
        const call = Daily.createCallObject({
          videoSource: true,
          audioSource: true,
          startAudioOff: !audioOn,
          startVideoOff: !videoOn,
        });
        callRef.current = call;

        call
          .on("joined-meeting", () => { setJoined(true); syncParticipants(); ensureRecorder(); })
          .on("participant-joined", (e?: DailyEventObjectParticipant) => { syncParticipants(); void e; })
          .on("participant-updated", () => syncParticipants())
          .on("participant-left", (e?: DailyEventObjectParticipant) => {
            const sid = (e?.participant as any)?.session_id as string | undefined;
            if (sid) {
              delete trackCacheRef.current[sid];
              setNonVerbalFeedback(prev => { const n = { ...prev }; delete n[sid]; return n; });
              setParticipantRenames(prev => { const n = { ...prev }; delete n[sid]; return n; });
              setLockedMutes(prev => { const n = new Set(prev); n.delete(sid); return n; });
              setCohosts(prev => { const n = new Set(prev); n.delete(sid); return n; });
            }
            syncParticipants();
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("track-started", (e?: any) => {
            const sid   = e?.participant?.session_id as string | undefined;
            const track = e?.track as MediaStreamTrack | undefined;
            if (sid && track) {
              if (!trackCacheRef.current[sid]) trackCacheRef.current[sid] = {};
              if (track.kind === "video") trackCacheRef.current[sid].video = track;
              if (track.kind === "audio") {
                trackCacheRef.current[sid].audio = track;
                connectAudioTrack(sid, track);
              }
            }
            // Defer so call.participants() audio/video flags are up-to-date.
            setTimeout(syncParticipants, 0);
          })
          .on("track-stopped", (e?: any) => {
            const sid   = e?.participant?.session_id as string | undefined;
            const track = e?.track as MediaStreamTrack | undefined;
            if (sid && track) {
              const cache = trackCacheRef.current[sid];
              if (cache) {
                if (track.kind === "video" && cache.video === track) delete cache.video;
                if (track.kind === "audio" && cache.audio === track) delete cache.audio;
              }
            }
            setTimeout(syncParticipants, 0);
          })
          .on("network-quality-change", (e) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const threshold = (e as any)?.threshold as "good" | "low" | "very-low" | undefined;
            if (threshold) setNetworkQuality(threshold);
          })
          .on("app-message", (e?: DailyEventObjectAppMessage) => {
            if (!e) return;
            const payload = e.data as AppMessagePayload;
            if (payload.kind === "chat") {
              setChat((c) => [...c, { id: Date.now() + Math.random(), from: payload.from, text: payload.text, mine: false }]);
            } else if (payload.kind === "reaction") {
              const r = { id: Date.now() + Math.random(), emoji: payload.emoji };
              setReactions((prev) => [...prev, r]);
              setTimeout(() => setReactions((prev) => prev.filter((x) => x.id !== r.id)), 2200);
            } else if (payload.kind === "end-meeting") {
              callRef.current?.leave();
              onMeetingEndedRef.current?.();
            } else if (payload.kind === "non-verbal") {
              const { sessionId: sid, feedback } = payload;
              if (feedback !== null) {
                setNonVerbalFeedback(prev => ({ ...prev, [sid]: feedback! }));
              } else {
                setNonVerbalFeedback(prev => { const n = { ...prev }; delete n[sid]; return n; });
              }
            } else if (payload.kind === "rename") {
              setParticipantRenames(prev => ({ ...prev, [payload.sessionId]: payload.newName }));
            } else if (payload.kind === "lock-mute") {
              setLockedMutes(prev => { const n = new Set(prev); payload.locked ? n.add(payload.targetSessionId) : n.delete(payload.targetSessionId); return n; });
            } else if (payload.kind === "chat-enabled") {
              setChatEnabledInner(payload.enabled);
            } else if (payload.kind === "reactions-enabled") {
              setReactionsEnabledInner(payload.enabled);
            } else if (payload.kind === "promote-cohost") {
              setCohosts(prev => { const n = new Set(prev); payload.promoted ? n.add(payload.targetSessionId) : n.delete(payload.targetSessionId); return n; });
            } else if (payload.kind === "spotlight") {
              setSpotlightId(payload.targetSessionId);
            }
          })
          .on("error", (e) => setError(e?.errorMsg ?? "Call error"))
          .on("left-meeting", () => setJoined(false));

        await call.join({ url: data.url, token: data.token, userName });
      } catch (err) {
        if (!destroyed) setError(err instanceof Error ? err.message : "Failed to join call");
      }
    }

    start();

    return () => {
      destroyed = true;
      callRef.current?.destroy();
      callRef.current = null;
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
      audioContextRef.current?.close().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, enabled, roomId]);

  const setLocalAudio = useCallback((on: boolean) => callRef.current?.setLocalAudio(on), []);
  const setLocalVideo = useCallback((on: boolean) => callRef.current?.setLocalVideo(on), []);

  const startScreenShare = useCallback(async () => {
    await callRef.current?.startScreenShare();
  }, []);
  const stopScreenShare = useCallback(() => callRef.current?.stopScreenShare(), []);

  const sendChat = useCallback((text: string, from: string) => {
    callRef.current?.sendAppMessage({ kind: "chat", from, text } satisfies AppMessagePayload, "*");
    setChat((c) => [...c, { id: Date.now() + Math.random(), from, text, mine: true }]);
  }, []);

  const sendReaction = useCallback((emoji: string) => {
    callRef.current?.sendAppMessage({ kind: "reaction", emoji } satisfies AppMessagePayload, "*");
    const r = { id: Date.now() + Math.random(), emoji };
    setReactions((prev) => [...prev, r]);
    setTimeout(() => setReactions((prev) => prev.filter((x) => x.id !== r.id)), 2200);
  }, []);

  const leave = useCallback(() => {
    callRef.current?.leave();
  }, []);

  /** Host-only: broadcasts an end-meeting signal to all participants then leaves. */
  const endForEveryone = useCallback(() => {
    callRef.current?.sendAppMessage({ kind: "end-meeting" } satisfies AppMessagePayload, "*");
    callRef.current?.leave();
  }, []);

  /**
   * Host-only: remotely mute a participant's microphone.
   * Requires is_owner:true on the host token (set in api/daily-room.ts).
   * The participant can unmute themselves unless the host locks mute (not
   * implemented — same behaviour as Zoom's default).
   */
  const muteParticipant = useCallback((sessionId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (callRef.current as any)?.updateParticipant(sessionId, { setAudio: false });
  }, []);

  /**
   * Host-only: remotely stop a participant's camera.
   * Requires is_owner:true on the host token.
   */
  const stopParticipantVideo = useCallback((sessionId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (callRef.current as any)?.updateParticipant(sessionId, { setVideo: false });
  }, []);

  /** Host-only: mute every non-local participant at once. */
  const muteAll = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts = call.participants() as Record<string, any>;
    for (const key of Object.keys(parts)) {
      const p = parts[key];
      if (!p.local) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call as any).updateParticipant(p.session_id as string, { setAudio: false });
      }
    }
  }, []);

  /**
   * Host-only: eject (kick) a participant from the call.
   * Requires is_owner:true on the host token.
   */
  const removeParticipant = useCallback((sessionId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (callRef.current as any)?.updateParticipant(sessionId, { eject: true });
  }, []);

  /** Send your own non-verbal feedback to all participants (null = clear). */
  const sendNonVerbalFeedback = useCallback((feedback: NonVerbalFeedback | null) => {
    const call = callRef.current;
    if (!call) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const localSid = (call.participants().local as any)?.session_id as string | undefined;
    if (!localSid) return;
    call.sendAppMessage({ kind: "non-verbal", sessionId: localSid, feedback } satisfies AppMessagePayload, "*");
    if (feedback !== null) {
      setNonVerbalFeedback(prev => ({ ...prev, [localSid]: feedback }));
    } else {
      setNonVerbalFeedback(prev => { const n = { ...prev }; delete n[localSid]; return n; });
    }
  }, []);

  /** Host-only: rename a remote participant (visible to all). */
  const renameParticipant = useCallback((sessionId: string, newName: string) => {
    callRef.current?.sendAppMessage({ kind: "rename", sessionId, newName } satisfies AppMessagePayload, "*");
    setParticipantRenames(prev => ({ ...prev, [sessionId]: newName }));
  }, []);

  /** Host-only: lock/unlock a participant's mic so they cannot unmute themselves. */
  const lockMute = useCallback((targetSessionId: string, locked: boolean) => {
    callRef.current?.sendAppMessage({ kind: "lock-mute", targetSessionId, locked } satisfies AppMessagePayload, "*");
    setLockedMutes(prev => { const n = new Set(prev); locked ? n.add(targetSessionId) : n.delete(targetSessionId); return n; });
  }, []);

  /** Host-only: enable or disable in-call chat for everyone. */
  const setChatEnabled = useCallback((enabled: boolean) => {
    callRef.current?.sendAppMessage({ kind: "chat-enabled", enabled } satisfies AppMessagePayload, "*");
    setChatEnabledInner(enabled);
  }, []);

  /** Host-only: enable or disable emoji reactions for everyone. */
  const setReactionsEnabled = useCallback((enabled: boolean) => {
    callRef.current?.sendAppMessage({ kind: "reactions-enabled", enabled } satisfies AppMessagePayload, "*");
    setReactionsEnabledInner(enabled);
  }, []);

  /** Host-only: promote or demote a co-host. */
  const promoteCohost = useCallback((targetSessionId: string, promoted: boolean) => {
    callRef.current?.sendAppMessage({ kind: "promote-cohost", targetSessionId, promoted } satisfies AppMessagePayload, "*");
    setCohosts(prev => { const n = new Set(prev); promoted ? n.add(targetSessionId) : n.delete(targetSessionId); return n; });
  }, []);

  /** Host-only: spotlight (pin) a participant for everyone, or pass null to clear. */
  const setSpotlight = useCallback((targetSessionId: string | null) => {
    callRef.current?.sendAppMessage({ kind: "spotlight", targetSessionId } satisfies AppMessagePayload, "*");
    setSpotlightId(targetSessionId);
  }, []);

  /** Toggle background blur on your own camera (Daily.co client-side ML, no external API). */
  const setBackgroundBlur = useCallback(async (enabled: boolean) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (callRef.current as any)?.updateInputSettings({
        video: { processor: { type: enabled ? "background-blur" : "none", ...(enabled ? { config: { strength: 0.5 } } : {}) } },
      });
    } catch { /* may fail before joining */ }
  }, []);

  /** Toggle noise suppression on your own mic (Daily.co client-side ML, no external API). */
  const setNoiseSuppression = useCallback(async (enabled: boolean) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (callRef.current as any)?.updateInputSettings({
        audio: { processor: { type: enabled ? "noise-cancellation" : "none" } },
      });
    } catch { /* may fail before joining */ }
  }, []);

  return {
    participants,
    joined,
    error,
    chat,
    reactions,
    networkQuality,
    nonVerbalFeedback,
    participantRenames,
    lockedMutes,
    chatEnabled,
    reactionsEnabled,
    cohosts,
    spotlightId,
    setLocalAudio,
    setLocalVideo,
    startScreenShare,
    stopScreenShare,
    stopRecording,
    sendChat,
    sendReaction,
    leave,
    endForEveryone,
    muteParticipant,
    stopParticipantVideo,
    muteAll,
    removeParticipant,
    sendNonVerbalFeedback,
    renameParticipant,
    lockMute,
    setChatEnabled,
    setReactionsEnabled,
    promoteCohost,
    setSpotlight,
    setBackgroundBlur,
    setNoiseSuppression,
  };
}
