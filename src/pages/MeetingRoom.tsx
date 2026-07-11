import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, Hand, Smile, MessageSquare, Users,
  Grid3x3, MonitorPlay, PhoneOff, Wifi, WifiOff, Send, Copy, Lock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth-context";
import { meetings as meetingsApi } from "@/lib/backend";
import { useDailyCall, type CallParticipant } from "@/lib/use-daily-call";
import { cn } from "@/lib/utils";

function ParticipantTile({ p, handRaised }: { p: CallParticipant; handRaised: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (p.videoTrack) {
      el.srcObject = new MediaStream([p.videoTrack]);
    } else {
      el.srcObject = null;
    }
  }, [p.videoTrack]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-background ring-1 ring-border">
      {p.videoOn && p.videoTrack ? (
        <video ref={videoRef} autoPlay muted={p.local} playsInline className="h-full w-full object-cover" />
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

  const userName = session?.user.name ?? "Guest";
  const {
    participants,
    error: callError,
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
  } = useDailyCall(id, userName);

  const participantList = Object.values(participants);
  const local = participantList.find((p) => p.local);
  const micOn = local?.audioOn ?? true;
  const camOn = local?.videoOn ?? true;

  useEffect(() => {
    if (id) meetingsApi.get(id).then((m) => { if (m) setMeetingTitle(m.title); });
  }, [id]);

  useEffect(() => {
    if (callError) toast.error(callError);
  }, [callError]);

  useEffect(() => {
    const int = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(int);
  }, []);

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

  function leaveCall() {
    leave();
    navigate("/dashboard");
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
      ``,
      `---`,
      `One tap join (mobile):`,
      `${joinUrl}?audio=1`,
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

  return (
    <div className="flex h-screen flex-col bg-surface-raised">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-4">
          <Logo />
          <Badge variant="outline" className="hidden sm:inline-flex">{mm}:{ss}</Badge>
          <Badge variant="outline" className="hidden items-center gap-1.5 sm:inline-flex"><Lock className="h-3 w-3" /> Secured</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-1.5 text-xs font-medium", quality.color)}>
            {networkQuality === "very-low" ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{quality.label}</span>
            <div className="flex items-end gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={cn("w-1 rounded-sm", i <= quality.bars ? "bg-current" : "bg-current opacity-20")} style={{ height: `${i * 3}px` }} />
              ))}
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={copyLink}><Copy className="h-3.5 w-3.5" /> Copy link</Button>
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
              <div className="flex h-full items-center justify-center text-sm text-text-muted">Connecting to the call…</div>
            ) : (
              participantList.map((p) => <ParticipantTile key={p.sessionId} p={p} handRaised={handRaised} />)
            )}
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="flex w-80 flex-col border-l border-border bg-background">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold text-text">In-call chat</h3>
              <button onClick={() => setShowChat(false)} className="text-text-muted hover:text-text"></button>
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
          <div className="flex w-80 flex-col border-l border-border bg-background">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold text-text">Participants ({participantList.length})</h3>
              <button onClick={() => setShowParticipants(false)} className="text-text-muted hover:text-text"></button>
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
      <div className="flex items-center justify-center gap-2 border-t border-border bg-surface-raised px-4 py-4">
        <Button variant={micOn ? "secondary" : "destructive"} size="icon" onClick={() => setLocalAudio(!micOn)}>{micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}</Button>
        <Button variant={camOn ? "secondary" : "destructive"} size="icon" onClick={() => setLocalVideo(!camOn)}>{camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}</Button>
        <Button variant={screenSharing ? "pulse" : "secondary"} size="icon" onClick={toggleScreenShare}><ScreenShare className="h-4 w-4" /></Button>
        <Button variant={handRaised ? "pulse" : "secondary"} size="icon" onClick={() => setHandRaised(!handRaised)}><Hand className="h-4 w-4" /></Button>
        <div className="relative group">
          <Button variant="secondary" size="icon"><Smile className="h-4 w-4" /></Button>
          <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-surface-raised p-1.5 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            {["👍", "❤️", "😂", "😮", "👏", "🔥"].map((e) => (
              <button key={e} className="rounded-full p-1 text-lg hover:bg-surface-raised" onClick={() => sendReaction(e)}>{e}</button>
            ))}
          </div>
        </div>
        <Button variant="secondary" size="icon" onClick={() => setView(view === "grid" ? "speaker" : "grid")}>{view === "grid" ? <MonitorPlay className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}</Button>
        <Button variant={showChat ? "primary" : "secondary"} size="icon" onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}><MessageSquare className="h-4 w-4" /></Button>
        <Button variant={showParticipants ? "primary" : "secondary"} size="icon" onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}><Users className="h-4 w-4" /></Button>
        <Button variant="destructive" onClick={leaveCall}><PhoneOff className="h-4 w-4" /> Leave</Button>
      </div>
    </div>
  );
}
