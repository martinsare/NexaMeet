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
export function useDailyCall(meetingId: string | undefined, userName: string) {
  const callRef = useRef<DailyCall | null>(null);
  const [participants, setParticipants] = useState<Record<string, CallParticipant>>({});
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionMessage[]>([]);
  const [networkQuality, setNetworkQuality] = useState<"good" | "low" | "very-low">("good");

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
    if (!meetingId) return;
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

        const call = Daily.createCallObject({
          videoSource: true,
          audioSource: true,
        });
        callRef.current = call;

        call
          .on("joined-meeting", () => { setJoined(true); syncParticipants(); })
          .on("participant-joined", (e?: DailyEventObjectParticipant) => { syncParticipants(); void e; })
          .on("participant-updated", () => syncParticipants())
          .on("participant-left", () => syncParticipants())
          .on("track-started", () => syncParticipants())
          .on("track-stopped", () => syncParticipants())
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

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
    sendChat,
    sendReaction,
    leave,
  };
}
