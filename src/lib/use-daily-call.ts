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

type AppMessagePayload =
  | { kind: "chat"; from: string; text: string }
  | { kind: "reaction"; emoji: string };

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
};

export function useDailyCall(meetingId: string | undefined, userName: string, options: UseDailyCallOptions = {}) {
  const { recordForAiNotes = false, enabled = true, initialAudioOn = true, initialVideoOn = true } = options;
  // Keep the latest lobby choices in a ref so the join effect (keyed on `enabled`
  // flipping to true) always reads the value picked right before joining.
  const initialAVRef = useRef({ initialAudioOn, initialVideoOn });
  initialAVRef.current = { initialAudioOn, initialVideoOn };
  const callRef = useRef<DailyCall | null>(null);
  const [participants, setParticipants] = useState<Record<string, CallParticipant>>({});
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionMessage[]>([]);
  const [networkQuality, setNetworkQuality] = useState<"good" | "low" | "very-low">("good");

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
      next[key] = toParticipant(raw[key] as any);
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
          body: JSON.stringify({ meetingId, userName }),
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
          .on("participant-left", () => syncParticipants())
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on("track-started", (e?: any) => {
            // Defer by one tick so call.participants() reflects the new track
            // state before we read it — avoids the host seeing null tracks for
            // participants who were already in the room when they joined.
            setTimeout(syncParticipants, 0);
            if (e?.track?.kind === "audio") connectAudioTrack(e.participant?.session_id ?? "", e.track as MediaStreamTrack);
          })
          .on("track-stopped", () => setTimeout(syncParticipants, 0))
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
  }, [meetingId, enabled]);

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

  return {
    participants,
    joined,
    error,
    chat,
    reactions,
    networkQuality,
    setLocalAudio,
    setLocalVideo,
    startScreenShare,
    stopScreenShare,
    stopRecording,
    sendChat,
    sendReaction,
    leave,
  };
}
