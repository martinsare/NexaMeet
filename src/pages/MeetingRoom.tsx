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
import { cn } from "@/lib/utils";

type Quality = "hd" | "sd" | "low-data" | "audio-only";
type Reaction = { id: number; emoji: string; x: number };

const EMOJIS = ["+", "!", "!", "?", "!!"];

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [view, setView] = useState<"grid" | "speaker">("grid");
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [quality, setQuality] = useState<Quality>("hd");
  const [bars, setBars] = useState(4);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [chat, setChat] = useState<{ id: number; from: string; text: string; mine: boolean }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (!active) return;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => toast.error("Camera/mic permission denied — continuing in preview mode"));
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = camOn ? stream : null;
    stream?.getVideoTracks().forEach((t) => (t.enabled = camOn));
    stream?.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [camOn, micOn, stream]);

  // Simulate network fluctuation -> Smart Connection adapts
  useEffect(() => {
    const int = setInterval(() => {
      const roll = Math.random();
      let q: Quality = "hd";
      let b = 4;
      if (roll < 0.08) { q = "audio-only"; b = 1; }
      else if (roll < 0.2) { q = "low-data"; b = 2; }
      else if (roll < 0.4) { q = "sd"; b = 3; }
      setQuality(q);
      setBars(b);
    }, 6000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    const int = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (quality === "audio-only" || quality === "low-data") {
      toast(quality === "audio-only" ? "Weak connection — switched to Audio Only" : "Network dip — switched to Low Data Mode", { icon: <WifiOff className="h-4 w-4" /> });
    }
  }, [quality]);

  async function toggleScreenShare() {
    if (screenSharing) {
      setScreenSharing(false);
      return;
    }
    try {
      await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenSharing(true);
      toast.success("You're sharing your screen");
    } catch {
      toast.error("Screen share cancelled");
    }
  }

  function sendReaction(emoji: string) {
    const r = { id: Date.now(), emoji, x: 20 + Math.random() * 60 };
    setReactions((prev) => [...prev, r]);
    setTimeout(() => setReactions((prev) => prev.filter((x) => x.id !== r.id)), 2200);
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChat((c) => [...c, { id: Date.now(), from: session?.user.name ?? "You", text: chatInput, mine: true }]);
    setChatInput("");
  }

  function leaveCall() {
    stream?.getTracks().forEach((t) => t.stop());
    navigate("/dashboard");
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${id}`);
    toast.success("Invite link copied");
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const qualityMeta: Record<Quality, { label: string; color: string }> = {
    hd: { label: "HD", color: "text-success" },
    sd: { label: "SD", color: "text-primary" },
    "low-data": { label: "Low Data", color: "text-yellow-400" },
    "audio-only": { label: "Audio Only", color: "text-destructive" },
  };

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
          <div className={cn("flex items-center gap-1.5 text-xs font-medium", qualityMeta[quality].color)}>
            {quality === "audio-only" ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{qualityMeta[quality].label}</span>
            <div className="flex items-end gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={cn("w-1 rounded-sm", i <= bars ? "bg-current" : "bg-current opacity-20")} style={{ height: `${i * 3}px` }} />
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
                className="absolute bottom-24 animate-[float_2.2s_ease-out_forwards] text-3xl"
                style={{ left: `${r.x}%`, animation: "reaction-rise 2.2s ease-out forwards" }}
              >
                {r.emoji}
              </span>
            ))}
          </div>
          <style>{`@keyframes reaction-rise { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-220px); opacity: 0; } }`}</style>

          <div className="grid h-full gap-3 grid-cols-1">
            <div className="relative overflow-hidden rounded-2xl bg-background ring-1 ring-border">
              {camOn ? (
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Avatar src={session?.user.avatarUrl} name={session?.user.name ?? "You"} className="h-20 w-20" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/50 px-2.5 py-1 text-xs text-text">
                {!micOn && <MicOff className="h-3 w-3 text-destructive" />} You {handRaised && " ✋ Hand Raised"}
              </div>
            </div>
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
            <form onSubmit={sendChat} className="flex gap-2 border-t border-border p-3">
              <Input placeholder="Message everyone" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
              <Button size="icon" type="submit"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        )}

        {/* Participants panel */}
        {showParticipants && (
          <div className="flex w-80 flex-col border-l border-border bg-background">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold text-text">Participants (1)</h3>
              <button onClick={() => setShowParticipants(false)} className="text-text-muted hover:text-text"></button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-3">
              <div className="flex items-center justify-between rounded-lg px-2 py-2">
                <div className="flex items-center gap-2"><Avatar src={session?.user.avatarUrl} name={session?.user.name ?? "You"} className="h-8 w-8" /><span className="text-sm text-text">{session?.user.name} (You) · Host</span></div>
              </div>
              <p className="px-2 py-4 text-xs text-text-muted text-center">No other participants yet.</p>
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
        <Button variant={micOn ? "secondary" : "destructive"} size="icon" onClick={() => setMicOn(!micOn)}>{micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}</Button>
        <Button variant={camOn ? "secondary" : "destructive"} size="icon" onClick={() => setCamOn(!camOn)}>{camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}</Button>
        <Button variant={screenSharing ? "pulse" : "secondary"} size="icon" onClick={toggleScreenShare}><ScreenShare className="h-4 w-4" /></Button>
        <Button variant={handRaised ? "pulse" : "secondary"} size="icon" onClick={() => setHandRaised(!handRaised)}><Hand className="h-4 w-4" /></Button>
        <div className="relative group">
          <Button variant="secondary" size="icon"><Smile className="h-4 w-4" /></Button>
          <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-surface-raised p-1.5 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            {EMOJIS.map((e) => (
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
