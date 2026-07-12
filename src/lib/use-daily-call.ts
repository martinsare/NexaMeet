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

export type ChatMessage    = { id: number; from: string; text: string; mine: boolean; sentAt: number; isDM?: boolean; dmTo?: string };
export type ReactionMessage = { id: number; emoji: string };
export type NonVerbalFeedback = "yes" | "no" | "slow-down" | "speed-up";
export type WhiteboardStroke = {
  id: string;
  tool: "pen" | "eraser";
  points: number[];   // normalised [0,1] x,y pairs
  color: string;
  width: number;
};
export type RaisedHand = { sessionId: string; userName: string; raisedAt: number };

type AppMessagePayload =
  | { kind: "chat"; from: string; text: string; dmTargetSession?: string }
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
  | { kind: "spotlight"; targetSessionId: string | null }
  | { kind: "hand-raise"; sessionId: string; userName: string; raised: boolean; raisedAt: number }
  | { kind: "whiteboard-stroke"; stroke: WhiteboardStroke }
  | { kind: "whiteboard-undo"; strokeId: string }
  | { kind: "whiteboard-clear" }
  | { kind: "data-update"; dataKind: "poll" | "qa" }
  | { kind: "unmute-request"; targetSessionId: string; fromName: string }
  | { kind: "transfer-host"; newHostSessionId: string; newHostName: string }
  | { kind: "recording-consent" }
  | { kind: "screenshare-notify"; userName: string; started: boolean }
  | { kind: "caption-all"; text: string; fromSession: string; fromName: string }
  | { kind: "away-status"; sessionId: string; isAway: boolean }
  | { kind: "lock-screenshare"; locked: boolean }
  | { kind: "lock-camera"; locked: boolean }
  | { kind: "auto-mute-join"; enabled: boolean }
  | { kind: "chat-react"; messageId: number; emoji: string; sessionId: string }
  | { kind: "self-rename"; sessionId: string; newName: string }
  | { kind: "focus-mode"; enabled: boolean }
  | { kind: "breakout-timer"; minutesLeft: number }
  | { kind: "breakout-return-all" }
  | { kind: "breakout-broadcast"; message: string }
  | { kind: "chimes-enabled"; enabled: boolean }
  | { kind: "clear-chat" };

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
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([]);
  const [reconnecting, setReconnecting] = useState(false);
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<WhiteboardStroke[]>([]);
  const [dataUpdateSignal, setDataUpdateSignal] = useState<{ kind: "poll" | "qa"; at: number } | null>(null);
  // Extended meeting state
  const [awayStatuses, setAwayStatuses]         = useState<Record<string, boolean>>({});
  const [chimesEnabledState, setChimesEnabledState] = useState(true);
  const [lockedScreenshare, setLockedScreenshare]   = useState(false);
  const [lockedCameraJoin, setLockedCameraJoin]     = useState(false);
  const [autoMuteJoinState, setAutoMuteJoinState]   = useState(false);
  const [chatReactions, setChatReactions] = useState<Record<number, Record<string, string>>>({});
  const [remoteCaptions, setRemoteCaptions] = useState<Record<string, { name: string; text: string }>>({});
  const [speakerTime, setSpeakerTime] = useState<Record<string, number>>({});
  const [unmuteRequests, setUnmuteRequests] = useState<Array<{ sessionId: string; fromName: string; at: number }>>([]);
  const [isCallRecording, setIsCallRecording] = useState(false);
  const [focusModeState, setFocusModeState]   = useState(false);
  const [breakoutBroadcastMsg, setBreakoutBroadcastMsg] = useState<string | null>(null);
  const [breakoutMinutesLeft, setBreakoutMinutesLeft]   = useState<number | null>(null);
  const [screenshareNotify, setScreenshareNotify] = useState<{ userName: string; started: boolean } | null>(null);
  const [hostTransferNotify, setHostTransferNotify] = useState<{ sessionId: string; name: string } | null>(null);
  const [bannedSessionIds, setBannedSessionIds] = useState<Set<string>>(new Set());
  // Used to suppress join chimes for participants who were already in the room.
  const hasJoinedRef      = useRef(false);
  const chimesEnabledRef  = useRef(true);
  const autoMuteJoinRef   = useRef(false);
  const isHostRef         = useRef(false);
  const speakerStartRef   = useRef<{ sessionId: string; startedAt: number } | null>(null);

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
          .on("joined-meeting", () => {
            setJoined(true); syncParticipants(); ensureRecorder();
            // Mark as fully joined so future participant-joined events play a chime.
            setTimeout(() => { hasJoinedRef.current = true; }, 500);
          })
          .on("participant-joined", (e?: DailyEventObjectParticipant) => {
            const sid = (e?.participant as any)?.session_id as string | undefined;
            syncParticipants();
            if (hasJoinedRef.current) {
              if (chimesEnabledRef.current) playChime("join");
              // Auto-mute new joiners if the host has enabled it
              if (autoMuteJoinRef.current && isHostRef.current && sid) {
                setTimeout(() => (callRef.current as any)?.updateParticipant(sid, { setAudio: false }), 800);
              }
            }
          })
          .on("participant-updated", () => syncParticipants())
          .on("participant-left", (e?: DailyEventObjectParticipant) => {
            const sid = (e?.participant as any)?.session_id as string | undefined;
            if (sid) {
              delete trackCacheRef.current[sid];
              setNonVerbalFeedback(prev => { const n = { ...prev }; delete n[sid]; return n; });
              setParticipantRenames(prev => { const n = { ...prev }; delete n[sid]; return n; });
              setLockedMutes(prev => { const n = new Set(prev); n.delete(sid); return n; });
              setCohosts(prev => { const n = new Set(prev); n.delete(sid); return n; });
              setRaisedHands(prev => prev.filter(h => h.sessionId !== sid));
              setAwayStatuses(prev => { const n = { ...prev }; delete n[sid]; return n; });
              setRemoteCaptions(prev => { const n = { ...prev }; delete n[sid]; return n; });
              // Flush any remaining speaker time
              if (speakerStartRef.current?.sessionId === sid) {
                const elapsed = Date.now() - speakerStartRef.current.startedAt;
                setSpeakerTime(t => ({ ...t, [sid]: (t[sid] ?? 0) + elapsed }));
                speakerStartRef.current = null;
              }
            }
            if (hasJoinedRef.current && chimesEnabledRef.current) playChime("leave");
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("active-speaker-change", (e?: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sid = (e as any)?.activeSpeaker?.peerId as string | undefined;
            const now = Date.now();
            if (speakerStartRef.current) {
              const { sessionId: prev, startedAt } = speakerStartRef.current;
              setSpeakerTime(t => ({ ...t, [prev]: (t[prev] ?? 0) + (now - startedAt) }));
            }
            speakerStartRef.current = sid ? { sessionId: sid, startedAt: now } : null;
            setActiveSpeakerId(sid ?? null);
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("network-connection", (e?: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const event = (e as any)?.event as string | undefined;
            setReconnecting(event === "interrupted");
          })
          .on("app-message", (e?: DailyEventObjectAppMessage) => {
            if (!e) return;
            const payload = e.data as AppMessagePayload;
            if (payload.kind === "chat") {
              setChat((c) => [...c, { id: Date.now() + Math.random(), from: payload.from, text: payload.text, mine: false, sentAt: Date.now() }]);
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
            } else if (payload.kind === "hand-raise") {
              if (payload.raised) {
                setRaisedHands(prev => [...prev.filter(h => h.sessionId !== payload.sessionId), { sessionId: payload.sessionId, userName: payload.userName, raisedAt: payload.raisedAt }]);
              } else {
                setRaisedHands(prev => prev.filter(h => h.sessionId !== payload.sessionId));
              }
            } else if (payload.kind === "whiteboard-stroke") {
              setWhiteboardStrokes(prev => [...prev, payload.stroke]);
            } else if (payload.kind === "whiteboard-undo") {
              setWhiteboardStrokes(prev => prev.filter(s => s.id !== payload.strokeId));
            } else if (payload.kind === "whiteboard-clear") {
              setWhiteboardStrokes([]);
            } else if (payload.kind === "data-update") {
              setDataUpdateSignal({ kind: payload.dataKind, at: Date.now() });
            } else if (payload.kind === "unmute-request") {
              setUnmuteRequests(prev => [...prev, { sessionId: payload.targetSessionId, fromName: payload.fromName, at: Date.now() }]);
            } else if (payload.kind === "transfer-host") {
              setHostTransferNotify({ sessionId: payload.newHostSessionId, name: payload.newHostName });
            } else if (payload.kind === "recording-consent") {
              setIsCallRecording(true);
            } else if (payload.kind === "screenshare-notify") {
              setScreenshareNotify({ userName: payload.userName, started: payload.started });
            } else if (payload.kind === "caption-all") {
              setRemoteCaptions(prev => ({ ...prev, [payload.fromSession]: { name: payload.fromName, text: payload.text } }));
            } else if (payload.kind === "away-status") {
              setAwayStatuses(prev => ({ ...prev, [payload.sessionId]: payload.isAway }));
            } else if (payload.kind === "lock-screenshare") {
              setLockedScreenshare(payload.locked);
            } else if (payload.kind === "lock-camera") {
              setLockedCameraJoin(payload.locked);
            } else if (payload.kind === "auto-mute-join") {
              setAutoMuteJoinState(payload.enabled);
              autoMuteJoinRef.current = payload.enabled;
            } else if (payload.kind === "chat-react") {
              setChatReactions(prev => ({ ...prev, [payload.messageId]: { ...(prev[payload.messageId] ?? {}), [payload.sessionId]: payload.emoji } }));
            } else if (payload.kind === "self-rename") {
              setParticipantRenames(prev => ({ ...prev, [payload.sessionId]: payload.newName }));
            } else if (payload.kind === "focus-mode") {
              setFocusModeState(payload.enabled);
            } else if (payload.kind === "breakout-broadcast") {
              setBreakoutBroadcastMsg(payload.message);
              setTimeout(() => setBreakoutBroadcastMsg(null), 10000);
            } else if (payload.kind === "breakout-timer") {
              setBreakoutMinutesLeft(payload.minutesLeft);
            } else if (payload.kind === "breakout-return-all") {
              setBreakoutMinutesLeft(null);
            } else if (payload.kind === "chimes-enabled") {
              setChimesEnabledState(payload.enabled);
              chimesEnabledRef.current = payload.enabled;
            } else if (payload.kind === "clear-chat") {
              setChat([]);
            } else if (payload.kind === "chat") {
              // Handled above — this else-if is unreachable but satisfies the exhaustive check
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
    const call = callRef.current;
    if (!call) return;
    await (call as any).startScreenShare({
      displayMediaRequestOptions: { video: true, audio: true },
    });
    const localName = (call.participants().local as any)?.user_name ?? "Someone";
    call.sendAppMessage({ kind: "screenshare-notify", userName: localName, started: true } satisfies AppMessagePayload, "*");
    setScreenshareNotify({ userName: localName, started: true });
  }, []);
  const stopScreenShare = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    call.stopScreenShare();
    const localName = (call.participants().local as any)?.user_name ?? "Someone";
    call.sendAppMessage({ kind: "screenshare-notify", userName: localName, started: false } satisfies AppMessagePayload, "*");
  }, []);

  const sendChat = useCallback((text: string, from: string, dmTargetSession?: string) => {
    callRef.current?.sendAppMessage({ kind: "chat", from, text, dmTargetSession } satisfies AppMessagePayload, "*");
    setChat((c) => [...c, { id: Date.now() + Math.random(), from, text, mine: true, sentAt: Date.now(), isDM: !!dmTargetSession, dmTo: dmTargetSession }]);
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

  /** Broadcast your hand-raise state (and update local raisedHands). */
  const raiseHand = useCallback((sessionId: string, userName: string, raised: boolean) => {
    const raisedAt = Date.now();
    callRef.current?.sendAppMessage({ kind: "hand-raise", sessionId, userName, raised, raisedAt } satisfies AppMessagePayload, "*");
    if (raised) {
      setRaisedHands(prev => [...prev.filter(h => h.sessionId !== sessionId), { sessionId, userName, raisedAt }]);
    } else {
      setRaisedHands(prev => prev.filter(h => h.sessionId !== sessionId));
    }
  }, []);

  /** Host: lower a specific participant's hand. */
  const lowerHandFor = useCallback((sessionId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = Object.values(callRef.current?.participants() ?? {}).find((x: any) => x.session_id === sessionId) as any;
    callRef.current?.sendAppMessage({ kind: "hand-raise", sessionId, userName: p?.user_name ?? "", raised: false, raisedAt: 0 } satisfies AppMessagePayload, "*");
    setRaisedHands(prev => prev.filter(h => h.sessionId !== sessionId));
  }, []);

  /** Broadcast a whiteboard stroke to everyone and add it locally. */
  const sendWhiteboardStroke = useCallback((stroke: WhiteboardStroke) => {
    callRef.current?.sendAppMessage({ kind: "whiteboard-stroke", stroke } satisfies AppMessagePayload, "*");
    setWhiteboardStrokes(prev => [...prev, stroke]);
  }, []);

  /** Remove a stroke by ID for everyone. */
  const undoWhiteboardStroke = useCallback((strokeId: string) => {
    callRef.current?.sendAppMessage({ kind: "whiteboard-undo", strokeId } satisfies AppMessagePayload, "*");
    setWhiteboardStrokes(prev => prev.filter(s => s.id !== strokeId));
  }, []);

  /** Clear all whiteboard strokes for everyone. */
  const clearWhiteboard = useCallback(() => {
    callRef.current?.sendAppMessage({ kind: "whiteboard-clear" } satisfies AppMessagePayload, "*");
    setWhiteboardStrokes([]);
  }, []);

  /** Signal all participants to refresh poll/Q&A data from the API. */
  const broadcastDataUpdate = useCallback((dataKind: "poll" | "qa") => {
    callRef.current?.sendAppMessage({ kind: "data-update", dataKind } satisfies AppMessagePayload, "*");
    setDataUpdateSignal({ kind: dataKind, at: Date.now() });
  }, []);

  /** Enumerate available camera, microphone, and speaker devices. */
  const enumerateDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      return {
        cameras:   all.filter(d => d.kind === "videoinput"),
        mics:      all.filter(d => d.kind === "audioinput"),
        speakers:  all.filter(d => d.kind === "audiooutput"),
      };
    } catch { return { cameras: [], mics: [], speakers: [] }; }
  }, []);

  /** Switch to a different microphone. */
  const setAudioInputDevice = useCallback(async (deviceId: string) => {
    try { await (callRef.current as any)?.setInputDevicesAsync({ audioDeviceId: deviceId }); } catch {}
  }, []);

  /** Switch to a different camera. */
  const setVideoInputDevice = useCallback(async (deviceId: string) => {
    try { await (callRef.current as any)?.setInputDevicesAsync({ videoDeviceId: deviceId }); } catch {}
  }, []);

  // ── isHost ref sync (used for auto-mute-join) ────────────────────────────
  // isHost is passed from the caller; keep it in a ref for event-handler access
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  /** Send an "ask to unmute" request to a participant. */
  const requestUnmute = useCallback((targetSessionId: string) => {
    const call = callRef.current;
    if (!call) return;
    const fromName = (call.participants().local as any)?.user_name ?? "Host";
    call.sendAppMessage({ kind: "unmute-request", targetSessionId, fromName } satisfies AppMessagePayload, "*");
  }, []);

  /** Dismiss a pending unmute request (local only). */
  const dismissUnmuteRequest = useCallback((sessionId: string) => {
    setUnmuteRequests(prev => prev.filter(r => r.sessionId !== sessionId));
  }, []);

  /** Transfer host role to another participant (they become co-host + get notified). */
  const transferHost = useCallback((newHostSessionId: string, newHostName: string) => {
    const call = callRef.current;
    if (!call) return;
    call.sendAppMessage({ kind: "transfer-host", newHostSessionId, newHostName } satisfies AppMessagePayload, "*");
    call.sendAppMessage({ kind: "promote-cohost", targetSessionId: newHostSessionId, promoted: true } satisfies AppMessagePayload, "*");
    setCohosts(prev => { const n = new Set(prev); n.add(newHostSessionId); return n; });
    setHostTransferNotify({ sessionId: newHostSessionId, name: newHostName });
  }, []);

  /** Kick + record ban locally (prevents visual re-admit). */
  const banParticipant = useCallback((sessionId: string) => {
    (callRef.current as any)?.updateParticipant(sessionId, { eject: true });
    setBannedSessionIds(prev => { const n = new Set(prev); n.add(sessionId); return n; });
  }, []);

  /** Notify all participants that recording has started (consent banner). */
  const notifyRecordingConsent = useCallback(() => {
    callRef.current?.sendAppMessage({ kind: "recording-consent" } satisfies AppMessagePayload, "*");
    setIsCallRecording(true);
  }, []);

  /** Host: lock/unlock all screensharing. */
  const setLockedScreenshareAll = useCallback((locked: boolean) => {
    callRef.current?.sendAppMessage({ kind: "lock-screenshare", locked } satisfies AppMessagePayload, "*");
    setLockedScreenshare(locked);
  }, []);

  /** Host: lock camera (stop all cameras + prevent turning on). */
  const setLockedCameraAll = useCallback((locked: boolean) => {
    const call = callRef.current;
    if (!call) return;
    call.sendAppMessage({ kind: "lock-camera", locked } satisfies AppMessagePayload, "*");
    setLockedCameraJoin(locked);
    if (locked) {
      const parts = call.participants() as Record<string, any>;
      for (const p of Object.values(parts)) {
        if (!p.local) (call as any).updateParticipant(p.session_id, { setVideo: false });
      }
    }
  }, []);

  /** Host: toggle auto-mute for new joiners. */
  const setAutoMuteJoin = useCallback((enabled: boolean) => {
    callRef.current?.sendAppMessage({ kind: "auto-mute-join", enabled } satisfies AppMessagePayload, "*");
    setAutoMuteJoinState(enabled);
    autoMuteJoinRef.current = enabled;
  }, []);

  /** Set your own away status (coffee cup icon on tile). */
  const setAwayStatus = useCallback((isAway: boolean) => {
    const call = callRef.current;
    if (!call) return;
    const localSid = (call.participants().local as any)?.session_id as string | undefined;
    if (!localSid) return;
    call.sendAppMessage({ kind: "away-status", sessionId: localSid, isAway } satisfies AppMessagePayload, "*");
    setAwayStatuses(prev => ({ ...prev, [localSid]: isAway }));
  }, []);

  /** Toggle join/leave chimes for everyone. */
  const setChimesEnabled = useCallback((enabled: boolean) => {
    callRef.current?.sendAppMessage({ kind: "chimes-enabled", enabled } satisfies AppMessagePayload, "*");
    setChimesEnabledState(enabled);
    chimesEnabledRef.current = enabled;
  }, []);

  /** React to a specific chat message with an emoji. */
  const reactToChat = useCallback((messageId: number, emoji: string) => {
    const call = callRef.current;
    if (!call) return;
    const localSid = (call.participants().local as any)?.session_id as string | undefined;
    if (!localSid) return;
    call.sendAppMessage({ kind: "chat-react", messageId, emoji, sessionId: localSid } satisfies AppMessagePayload, "*");
    setChatReactions(prev => ({ ...prev, [messageId]: { ...(prev[messageId] ?? {}), [localSid]: emoji } }));
  }, []);

  /** Rename yourself (visible to all). */
  const setSelfName = useCallback((newName: string) => {
    const call = callRef.current;
    if (!call) return;
    const localSid = (call.participants().local as any)?.session_id as string | undefined;
    if (!localSid) return;
    call.sendAppMessage({ kind: "self-rename", sessionId: localSid, newName } satisfies AppMessagePayload, "*");
    setParticipantRenames(prev => ({ ...prev, [localSid]: newName }));
  }, []);

  /** Broadcast your live caption text to all participants. */
  const broadcastCaption = useCallback((text: string) => {
    const call = callRef.current;
    if (!call) return;
    const local = call.participants().local as any;
    if (!local) return;
    call.sendAppMessage({ kind: "caption-all", text, fromSession: local.session_id, fromName: local.user_name } satisfies AppMessagePayload, "*");
  }, []);

  /** Host: enable/disable focus mode (non-hosts only see host tile). */
  const setFocusMode = useCallback((enabled: boolean) => {
    callRef.current?.sendAppMessage({ kind: "focus-mode", enabled } satisfies AppMessagePayload, "*");
    setFocusModeState(enabled);
  }, []);

  /** Host: broadcast a "X minutes left" timer to all breakout rooms. */
  const broadcastBreakoutTimer = useCallback((minutesLeft: number) => {
    callRef.current?.sendAppMessage({ kind: "breakout-timer", minutesLeft } satisfies AppMessagePayload, "*");
    setBreakoutMinutesLeft(minutesLeft);
  }, []);

  /** Host: signal all participants to return to the main room. */
  const returnAllFromBreakout = useCallback(() => {
    callRef.current?.sendAppMessage({ kind: "breakout-return-all" } satisfies AppMessagePayload, "*");
    setBreakoutMinutesLeft(null);
  }, []);

  /** Host: send a text broadcast message to all breakout rooms. */
  const broadcastToBreakoutRooms = useCallback((message: string) => {
    callRef.current?.sendAppMessage({ kind: "breakout-broadcast", message } satisfies AppMessagePayload, "*");
  }, []);

  /** Host: clear all chat messages for everyone in the call. */
  const clearChat = useCallback(() => {
    setChat([]);
    callRef.current?.sendAppMessage({ kind: "clear-chat" } satisfies AppMessagePayload, "*");
  }, []);

  /** Clear a screenshare notification once it has been shown as a toast. */
  const clearScreenshareNotify = useCallback(() => setScreenshareNotify(null), []);
  /** Clear a host-transfer notification once shown. */
  const clearHostTransferNotify = useCallback(() => setHostTransferNotify(null), []);

  /** Apply a virtual background image (URL) or remove it (pass "none"). */
  const setVirtualBackground = useCallback(async (imageUrl: string | "none") => {
    try {
      await (callRef.current as any)?.updateInputSettings({
        video: {
          processor: imageUrl === "none"
            ? { type: "none" }
            : { type: "background-image", config: { source: imageUrl } },
        },
      });
    } catch {}
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
    activeSpeakerId,
    raisedHands,
    reconnecting,
    whiteboardStrokes,
    dataUpdateSignal,
    raiseHand,
    lowerHandFor,
    sendWhiteboardStroke,
    undoWhiteboardStroke,
    clearWhiteboard,
    broadcastDataUpdate,
    enumerateDevices,
    setAudioInputDevice,
    setVideoInputDevice,
    setVirtualBackground,
    // New v3 features
    awayStatuses,
    chimesEnabled: chimesEnabledState,
    lockedScreenshare,
    lockedCameraJoin,
    autoMuteJoin: autoMuteJoinState,
    chatReactions,
    remoteCaptions,
    speakerTime,
    unmuteRequests,
    isCallRecording,
    focusMode: focusModeState,
    breakoutBroadcastMsg,
    breakoutMinutesLeft,
    screenshareNotify,
    hostTransferNotify,
    bannedSessionIds,
    requestUnmute,
    dismissUnmuteRequest,
    transferHost,
    banParticipant,
    notifyRecordingConsent,
    setLockedScreenshareAll,
    setLockedCameraAll,
    setAutoMuteJoin,
    setAwayStatus,
    setChimesEnabled,
    reactToChat,
    setSelfName,
    broadcastCaption,
    setFocusMode,
    broadcastBreakoutTimer,
    returnAllFromBreakout,
    broadcastToBreakoutRooms,
    clearScreenshareNotify,
    clearHostTransferNotify,
    clearChat,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function playChime(type: "join" | "leave") {
  try {
    const ctx = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    if (type === "join") {
      osc.frequency.setValueAtTime(880,  ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    } else {
      osc.frequency.setValueAtTime(660,  ctx.currentTime);
      osc.frequency.setValueAtTime(440,  ctx.currentTime + 0.15);
    }
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  } catch { /* AudioContext may be unavailable */ }
}
