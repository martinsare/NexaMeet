import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, Hand, Smile, MessageSquare, Users,
  Grid3x3, MonitorPlay, PhoneOff, Wifi, WifiOff, Send, Copy, Lock,
  Shield, AlertTriangle, RotateCcw, X, StopCircle, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth-context";
import { meetings as meetingsApi, auth as authApi } from "@/lib/backend";
import { useDailyCall, type CallParticipant } from "@/lib/use-daily-call";
import { cn } from "@/lib/utils";

/**
 * Pre-join lobby: lets people preview + toggle their camera/mic before the
 * real Daily call connects (mirrors Zoom/Meet). Uses a throwaway
 * getUserMedia stream — released the moment "Join now" is pressed, before
 * Daily requests its own.
 */
function PreJoinLobby({
  meetingTitle,
  userName,
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  onJoin,
  onExit,
}: {
  meetingTitle: string;
  userName: string;
  micOn: boolean;
  camOn: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onJoin: () => void;
  onExit: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => setMediaError(err instanceof Error ? err.message : "Camera/mic unavailable"));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = micOn; });
  }, [micOn]);
  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = camOn; });
  }, [camOn]);

  function join() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onJoin();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-raised px-4 py-10">
      <Logo />
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-text">Ready to join?</h1>
        <p className="mt-1 text-sm text-text-muted">{meetingTitle}</p>
      </div>

      <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-2xl bg-background ring-1 ring-border">
        {camOn && !mediaError ? (
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover [transform:scaleX(-1)]" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Avatar name={userName} className="h-20 w-20" />
          </div>
        )}
        {mediaError && (
          <p className="absolute bottom-3 left-1/2 w-[90%] -translate-x-1/2 rounded-lg bg-black/60 px-3 py-1.5 text-center text-xs text-text">
            No camera/mic detected — you can still join and enable them later.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant={micOn ? "secondary" : "destructive"} size="icon" onClick={onToggleMic}>
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button variant={camOn ? "secondary" : "destructive"} size="icon" onClick={onToggleCam}>
          {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex w-full max-w-md flex-col gap-2">
        <Button className="w-full" onClick={join}>Join now</Button>
        <Button variant="secondary" className="w-full" onClick={onExit}>Back</Button>
      </div>
    </div>
  );
}

function ParticipantTile({ p, handRaised }: { p: CallParticipant; handRaised: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = p.videoTrack ? new MediaStream([p.videoTrack]) : null;
  // p.videoOn ensures this re-runs when the video element mounts/unmounts,
  // even if the track reference (persistentTrack) hasn't changed.
  }, [p.videoTrack, p.videoOn]);

  // Audio is played through a dedicated element (not the <video> tag above) so
  // it keeps working even when the participant's camera is off — the video
  // element only mounts when there's a video track to show.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.srcObject = p.audioTrack ? new MediaStream([p.audioTrack]) : null;
  }, [p.audioTrack]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-background ring-1 ring-border">
      {/* Never render local audio back to the speaker — that's just echo. */}
      {!p.local && <audio ref={audioRef} autoPlay />}
      {p.videoOn && p.videoTrack ? (
        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Avatar name={p.userName} className="h-20 w-20" />
        </div>
      )}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/50 px-2.5 py-1 text-xs text-text">
        {!p.audioOn && <MicOff className="h-3 w-3 text-destructive" />}
        {p.local ? "You" : p.userName}
        {p.local && handRaised && " ✋ Hand Raised"}
      </div>
    </div>
  );
}

export default function MeetingRoom() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [handRaised, setHandRaised] = useState(false);
  const [view, setView] = useState<"grid" | "speaker">("grid");
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState("NexaMeet Meeting");
  const [screenSharing, setScreenSharing] = useState(false);
  const [isHost, setIsHost] = useState(false);
  // Seed hostId from the ?h= URL param immediately — this lets participants join
  // without needing a Supabase DB read (which RLS would block for non-members).
  const [hostId, setHostId] = useState<string | undefined>(searchParams.get("h") ?? undefined);
  const [wrappingUp, setWrappingUp] = useState(false);
  const [inLobby, setInLobby] = useState(true);
  const [lobbyMicOn, setLobbyMicOn] = useState(true);
  const [lobbyCamOn, setLobbyCamOn] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestNameReady, setGuestNameReady] = useState(false);

  const isGuest = !session || session.guest === true;
  const userName = isGuest
    ? (guestName.trim() || session?.user.name || "Guest")
    : (session.user.name ?? "Guest");

  async function submitGuestName(e: React.FormEvent) {
    e.preventDefault();
    const name = guestName.trim() || "Guest";
    await authApi.continueAsGuest(name);
    setGuestName(name);
    setGuestNameReady(true);
  }
  const {
    participants,
    joined,
    error: callError,
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
    endForEveryone,
  } = useDailyCall(id, userName, {
    recordForAiNotes: isHost,
    enabled: !inLobby && !!hostId,
    initialAudioOn: lobbyMicOn,
    initialVideoOn: lobbyCamOn,
    hostId,
    onMeetingEnded: () => {
      toast("The host ended the meeting");
      navigate("/dashboard");
    },
  });

  const participantList = Object.values(participants);
  const local = participantList.find((p) => p.local);
  const micOn = local?.audioOn ?? lobbyMicOn;
  const camOn = local?.videoOn ?? lobbyCamOn;

  useEffect(() => {
    if (!id) return;
    meetingsApi.get(id).then((m) => {
      if (!m) return;
      setMeetingTitle(m.title);
      setHostId(m.hostId);
      setIsHost(!!session?.user && m.hostId === session.user.id);
    });
  }, [id, session?.user?.id]);

  // Record this user as a participant the moment the Daily call connects.
  // Guests (no session) are skipped. Requires migration 002 to persist.
  useEffect(() => {
    if (!joined || !id || !session?.user) return;
    meetingsApi.recordJoin(id).catch(() => {/* non-fatal */});
  }, [joined, id, session?.user?.id]);

  useEffect(() => {
    if (callError) toast.error(callError);
  }, [callError]);

  useEffect(() => {
    if (!joined) return;
    const int = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(int);
  }, [joined]);

  useEffect(() => {
    if (networkQuality === "very-low") toast("Weak connection — audio/video may be affected", { icon: <WifiOff className="h-4 w-4" /> });
  }, [networkQuality]);

  async function toggleScreenShare() {
    try {
      if (screenSharing) {
        stopScreenShare();
        setScreenSharing(false);
        return;
      }
      await startScreenShare();
      setScreenSharing(true);
      toast.success("You're sharing your screen");
    } catch {
      toast.error("Screen share cancelled");
    }
  }

  function sendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChat(chatInput, userName);
    setChatInput("");
  }

  async function endMeeting() {
    if (!id) return;
    setWrappingUp(true);
    const durationMins = Math.max(1, Math.ceil(elapsed / 60));
    try {
      endForEveryone();          // broadcast + leave Daily
      const recording = await stopRecording();
      if (recording && recording.size > 5000) {
        toast.loading("Generating AI meeting notes…", { id: "ai-notes" });
        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": recording.type || "audio/webm" },
          body: recording,
        });
        const transcribeData = await transcribeRes.json();
        if (!transcribeRes.ok) throw new Error(transcribeData.error ?? "Transcription failed");
        const transcript = (transcribeData.transcript as string) ?? "";
        let aiSummary: { summary: string; decisions: string[]; actionItems: { task: string; owner: string; done: boolean }[]; highlights: string[] };
        if (transcript.trim().length > 0) {
          const summarizeRes = await fetch("/api/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript }),
          });
          const summarizeData = await summarizeRes.json();
          if (!summarizeRes.ok) throw new Error(summarizeData.error ?? "Summarization failed");
          aiSummary = summarizeData;
        } else {
          aiSummary = { summary: "", decisions: [], actionItems: [], highlights: [] };
        }
        await meetingsApi.saveAiNotes(id, { durationMins, transcript, segments: transcribeData.segments ?? [], aiSummary });
        toast.success("Meeting notes ready", { id: "ai-notes" });
      } else {
        await meetingsApi.end(id, durationMins);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't wrap up the meeting", { id: "ai-notes" });
      await meetingsApi.end(id, durationMins).catch(() => {});
    } finally {
      setWrappingUp(false);
      navigate("/history");
    }
  }

  async function leaveCall() {
    if (!isHost || !id) {
      leave();
      navigate("/dashboard");
      return;
    }

    setWrappingUp(true);
    const durationMins = Math.max(1, Math.ceil(elapsed / 60));
    try {
      const recording = await stopRecording();
      leave();

      if (recording && recording.size > 5000) {
        toast.loading("Generating AI meeting notes…", { id: "ai-notes" });
        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": recording.type || "audio/webm" },
          body: recording,
        });
        const transcribeData = await transcribeRes.json();
        if (!transcribeRes.ok) throw new Error(transcribeData.error ?? "Transcription failed");

        const transcript = (transcribeData.transcript as string) ?? "";
        let aiSummary: { summary: string; decisions: string[]; actionItems: { task: string; owner: string; done: boolean }[]; highlights: string[] };
        if (transcript.trim().length > 0) {
          const summarizeRes = await fetch("/api/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript }),
          });
          const summarizeData = await summarizeRes.json();
          if (!summarizeRes.ok) throw new Error(summarizeData.error ?? "Summarization failed");
          aiSummary = summarizeData;
        } else {
          aiSummary = { summary: "", decisions: [], actionItems: [], highlights: [] };
        }

        await meetingsApi.saveAiNotes(id, {
          durationMins,
          transcript,
          segments: transcribeData.segments ?? [],
          aiSummary,
        });
        toast.success("Meeting notes ready", { id: "ai-notes" });
      } else {
        await meetingsApi.end(id, durationMins);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate AI notes for this meeting", { id: "ai-notes" });
      await meetingsApi.end(id, durationMins).catch(() => {});
    } finally {
      setWrappingUp(false);
      navigate("/history");
    }
  }

  function copyLink() {
    const joinUrl = `${window.location.origin}/meeting/${id}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const invite = [
      `NexaMeet is inviting you to a scheduled meeting.`,
      ``,
      `Topic: ${meetingTitle}`,
      `Date: ${dateStr}`,
      `Meeting ID: ${id}`,
      ``,
      `Join NexaMeet Meeting:`,
      joinUrl,
    ].join("\n");
    navigator.clipboard.writeText(invite);
    toast.success("Invite copied to clipboard");
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const qualityMeta: Record<"good" | "low" | "very-low", { label: string; color: string; bars: number }> = {
    good: { label: "HD", color: "text-success", bars: 4 },
    low: { label: "Low Data", color: "text-yellow-400", bars: 2 },
    "very-low": { label: "Audio Only", color: "text-destructive", bars: 1 },
  };
  const quality = qualityMeta[networkQuality];

  if (inLobby) {
    // Guests who haven't entered a name yet see the name-input step first
    if (isGuest && !guestNameReady) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-raised px-4 py-10">
          <Logo />
          <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-background p-8 shadow-sm">
            <div className="space-y-1 text-center">
              <h1 className="font-display text-xl font-semibold text-text">What's your name?</h1>
              <p className="text-sm text-text-muted">
                You're joining <span className="font-medium text-text">{meetingTitle}</span> as a guest.
              </p>
            </div>
            <form onSubmit={submitGuestName} className="space-y-4">
              <div>
                <Label htmlFor="guest-name">Your name</Label>
                <Input
                  id="guest-name"
                  autoFocus
                  placeholder="How others will see you"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Continue to lobby <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
          <button onClick={() => navigate(-1)} className="text-sm text-text-muted hover:text-text">
            ← Go back
          </button>
        </div>
      );
    }

    return (
      <PreJoinLobby
        meetingTitle={meetingTitle}
        userName={userName}
        micOn={lobbyMicOn}
        camOn={lobbyCamOn}
        onToggleMic={() => setLobbyMicOn((v) => !v)}
        onToggleCam={() => setLobbyCamOn((v) => !v)}
        onJoin={() => setInLobby(false)}
        onExit={() => navigate(-1)}
      />
    );
  }

  if (callError && !joined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-raised px-4 text-center">
        <Logo />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold text-text">Couldn't connect to this call</h1>
          <p className="mt-1 max-w-sm text-sm text-text-muted">{callError}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setInLobby(true)}><RotateCcw className="h-3.5 w-3.5" /> Try again</Button>
          <Button variant="destructive" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-surface-raised">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Logo />
          <Badge variant="outline" className="hidden sm:inline-flex">{mm}:{ss}</Badge>
          <Badge variant="outline" className="hidden items-center gap-1.5 sm:inline-flex"><Lock className="h-3 w-3" /> Secured</Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className={cn("hidden items-center gap-1.5 text-xs font-medium sm:flex", quality.color)}>
            {networkQuality === "very-low" ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{quality.label}</span>
            <div className="flex items-end gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={cn("w-1 rounded-sm", i <= quality.bars ? "bg-current" : "bg-current opacity-20")} style={{ height: `${i * 3}px` }} />
              ))}
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={copyLink}><Copy className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Copy link</span></Button>
        </div>
      </div>

      {/* Main area */}
      <div className="relative flex flex-1 overflow-hidden">
        <div className="relative flex-1 p-4">
          {/* floating reactions */}
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            {reactions.map((r) => (
              <span
                key={r.id}
                className="absolute bottom-24 text-3xl"
                style={{ left: `${20 + (r.id % 60)}%`, animation: "reaction-rise 2.2s ease-out forwards" }}
              >
                {r.emoji}
              </span>
            ))}
          </div>
          <style>{`@keyframes reaction-rise { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-220px); opacity: 0; } }`}</style>

          <div
            className={cn(
              "grid h-full gap-3",
              participantList.length <= 1 && "grid-cols-1",
              participantList.length === 2 && "grid-cols-1 sm:grid-cols-2",
              participantList.length >= 3 && "grid-cols-2 sm:grid-cols-3"
            )}
          >
            {participantList.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-text-muted">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Connecting to the call…
              </div>
            ) : (
              participantList.map((p) => <ParticipantTile key={p.sessionId} p={p} handRaised={handRaised} />)
            )}
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="fixed inset-0 z-30 flex flex-col bg-background md:static md:z-auto md:w-80 md:border-l md:border-border">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold text-text">In-call chat</h3>
              <button onClick={() => setShowChat(false)} className="rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-text"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {chat.map((m) => (
                <div key={m.id} className={cn("max-w-[85%] rounded-xl px-3 py-2 text-sm", m.mine ? "ml-auto bg-primary text-text" : "bg-surface-raised text-text")}>
                  {!m.mine && <p className="mb-0.5 text-xs font-medium text-primary">{m.from}</p>}
                  {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={sendChatMessage} className="flex gap-2 border-t border-border p-3">
              <Input placeholder="Message everyone" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
              <Button size="icon" type="submit"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        )}

        {/* Participants panel */}
        {showParticipants && (
          <div className="fixed inset-0 z-30 flex flex-col bg-background md:static md:z-auto md:w-80 md:border-l md:border-border">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold text-text">Participants ({participantList.length})</h3>
              <button onClick={() => setShowParticipants(false)} className="rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-text"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-3">
              {participantList.map((p) => (
                <div key={p.sessionId} className="flex items-center justify-between rounded-lg px-2 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={p.userName} className="h-8 w-8" />
                    <span className="text-sm text-text">{p.local ? `${p.userName} (You)` : p.userName}</span>
                  </div>
                </div>
              ))}
              {participantList.length <= 1 && (
                <p className="px-2 py-4 text-xs text-text-muted text-center">No other participants yet.</p>
              )}
            </div>
            <div className="space-y-2 border-t border-border p-3">
              <Button variant="secondary" size="sm" className="w-full"><Shield className="h-3.5 w-3.5" /> Mute everyone</Button>
              <Button variant="secondary" size="sm" className="w-full"><Lock className="h-3.5 w-3.5" /> Lock meeting</Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 overflow-x-auto border-t border-border bg-surface-raised px-3 py-3 sm:justify-center sm:px-4 sm:py-4">
        <Button className="shrink-0" variant={micOn ? "secondary" : "destructive"} size="icon" onClick={() => setLocalAudio(!micOn)}>{micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}</Button>
        <Button className="shrink-0" variant={camOn ? "secondary" : "destructive"} size="icon" onClick={() => setLocalVideo(!camOn)}>{camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}</Button>
        <Button className="shrink-0" variant={screenSharing ? "pulse" : "secondary"} size="icon" onClick={toggleScreenShare}><ScreenShare className="h-4 w-4" /></Button>
        <Button className="shrink-0" variant={handRaised ? "pulse" : "secondary"} size="icon" onClick={() => setHandRaised(!handRaised)}><Hand className="h-4 w-4" /></Button>
        <div className="relative group shrink-0">
          <Button variant="secondary" size="icon"><Smile className="h-4 w-4" /></Button>
          <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-surface-raised p-1.5 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            {["👍", "❤️", "😂", "😮", "👏", "🔥"].map((e) => (
              <button key={e} className="rounded-full p-1 text-lg hover:bg-surface-raised" onClick={() => sendReaction(e)}>{e}</button>
            ))}
          </div>
        </div>
        <Button className="shrink-0" variant="secondary" size="icon" onClick={() => setView(view === "grid" ? "speaker" : "grid")}>{view === "grid" ? <MonitorPlay className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}</Button>
        <Button className="shrink-0" variant={showChat ? "primary" : "secondary"} size="icon" onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}><MessageSquare className="h-4 w-4" /></Button>
        <Button className="shrink-0" variant={showParticipants ? "primary" : "secondary"} size="icon" onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}><Users className="h-4 w-4" /></Button>
        {isHost ? (
          <>
            <Button className="shrink-0" variant="destructive" onClick={endMeeting} disabled={wrappingUp}>
              <StopCircle className="h-4 w-4" /> {wrappingUp ? "Wrapping up…" : "End for all"}
            </Button>
            <Button className="shrink-0" variant="secondary" onClick={leaveCall} disabled={wrappingUp}>
              <PhoneOff className="h-4 w-4" /> Leave
            </Button>
          </>
        ) : (
          <Button className="shrink-0" variant="destructive" onClick={leaveCall} disabled={wrappingUp}>
            <PhoneOff className="h-4 w-4" /> Leave
          </Button>
        )}
      </div>

      {wrappingUp && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-text-muted">Generating AI meeting notes…</p>
        </div>
      )}
    </div>
  );
}
