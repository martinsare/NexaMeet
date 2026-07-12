import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, Hand, Smile, MessageSquare, Users,
  Grid3x3, MonitorPlay, PhoneOff, Wifi, WifiOff, Send, Copy, Lock,
  Shield, AlertTriangle, RotateCcw, X, StopCircle, ArrowRight, UserX,
  Pin, PinOff, ThumbsUp, Settings, Star, Pencil, Sparkles, Mic2,
  BarChart2, HelpCircle, Edit3, Maximize2, Minimize2, FileText, CheckCircle2,
  Ban, Coffee, Bell, BellOff, Eye, EyeOff, Crown, Download, Volume2,
  Timer, Radio, Keyboard, AtSign, Upload, PictureInPicture2, ChevronLeft, ChevronRight, Trash2,
} from "lucide-react";
import { PollPanel } from "@/components/meeting/PollPanel";
import { QAPanel } from "@/components/meeting/QAPanel";
import { Whiteboard } from "@/components/meeting/Whiteboard";
import { ShortcutsOverlay } from "@/components/meeting/ShortcutsOverlay";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth-context";
import { meetings as meetingsApi, auth as authApi } from "@/lib/backend";
import type { MeetingRoom } from "@/lib/types";
import { useDailyCall, type CallParticipant, type NonVerbalFeedback, type WhiteboardStroke } from "@/lib/use-daily-call";
import { VectorEmoji } from "@/components/ui/vector-emoji";
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

const FEEDBACK_META: Record<NonVerbalFeedback, { emoji: string; label: string; color: string }> = {
  yes:         { emoji: "👍", label: "Yes",  color: "bg-emerald-500" },
  no:          { emoji: "👎", label: "No",   color: "bg-destructive" },
  "slow-down": { emoji: "🐢", label: "Slow", color: "bg-yellow-500" },
  "speed-up":  { emoji: "⚡", label: "Fast", color: "bg-blue-500"   },
};

const VIRTUAL_BG_PRESETS = [
  { id: "none",     label: "Off",    url: null as string | null },
  { id: "blur",     label: "Blur",   url: null as string | null },
  { id: "office",   label: "Office", url: "https://picsum.photos/seed/office1/1280/720" },
  { id: "nature",   label: "Nature", url: "https://picsum.photos/seed/forest2/1280/720" },
  { id: "space",    label: "Space",  url: "https://picsum.photos/seed/night3/1280/720" },
];

function ParticipantTile({
  p, handRaised, feedback, spotlighted, activeSpeaker, onDoubleClick, isAway,
}: {
  p: CallParticipant;
  handRaised: boolean;
  feedback?: NonVerbalFeedback;
  spotlighted?: boolean;
  activeSpeaker?: boolean;
  onDoubleClick?: () => void;
  isAway?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = p.videoTrack ? new MediaStream([p.videoTrack]) : null;
  }, [p.videoTrack, p.videoOn]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.srcObject = p.audioTrack ? new MediaStream([p.audioTrack]) : null;
  }, [p.audioTrack]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-background cursor-pointer",
        spotlighted   ? "ring-2 ring-primary" :
        activeSpeaker ? "ring-2 ring-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.3)]" :
                        "ring-1 ring-border"
      )}
      onDoubleClick={onDoubleClick}
      title={onDoubleClick ? "Double-click to expand" : undefined}
    >
      {!p.local && <audio ref={audioRef} autoPlay />}
      {p.videoOn && p.videoTrack ? (
        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Avatar name={p.userName} className="h-20 w-20" />
        </div>
      )}
      {feedback && (
        <div className={cn("absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-white", FEEDBACK_META[feedback].color)}>
          <VectorEmoji emoji={FEEDBACK_META[feedback].emoji} size={13} />
          {FEEDBACK_META[feedback].label}
        </div>
      )}
      {spotlighted && (
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
          <Pin className="h-2.5 w-2.5" /> Pinned
        </div>
      )}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 text-xs text-white">
        {activeSpeaker && p.audioOn ? (
          <span className="flex items-end gap-px" aria-label="Speaking">
            {[1, 2, 3].map((i) => (
              <span key={i} className="w-0.5 origin-bottom rounded-full bg-green-400" style={{ height: `${4 + i * 3}px`, animation: `audio-bar ${0.45 + i * 0.07}s ${i * 0.1}s ease-in-out infinite alternate` }} />
            ))}
          </span>
        ) : !p.audioOn ? (
          <MicOff className="h-3 w-3 text-red-400" />
        ) : null}
        {isAway && <Coffee className="h-3 w-3 text-amber-400" />}
        <span>{p.local ? "You" : p.userName}{handRaised ? " ✋" : ""}{isAway ? " (BRB)" : ""}</span>
      </div>
      {onDoubleClick && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="h-4 w-4 text-white/70" />
        </div>
      )}
    </div>
  );
}

/** Compact tile used in screenshare sidebar and spotlight strip. */
function SmallTile({ p, feedback, rename }: { p: CallParticipant; feedback?: NonVerbalFeedback; rename?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = p.videoTrack ? new MediaStream([p.videoTrack]) : null;
  }, [p.videoTrack, p.videoOn]);
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.srcObject = p.audioTrack ? new MediaStream([p.audioTrack]) : null;
  }, [p.audioTrack]);
  const displayName = rename ?? p.userName;
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-background ring-1 ring-border">
      {!p.local && <audio ref={audioRef} autoPlay />}
      {p.videoOn && p.videoTrack
        ? <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        : <div className="flex h-full items-center justify-center"><Avatar name={displayName} className="h-10 w-10" /></div>
      }
      {feedback && (
        <div className={cn("absolute right-1 top-1 rounded-full p-0.5 text-white", FEEDBACK_META[feedback].color)}>
          <VectorEmoji emoji={FEEDBACK_META[feedback].emoji} size={10} />
        </div>
      )}
      <div className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
        {!p.audioOn && <MicOff className="h-2.5 w-2.5 text-red-400" />}
        {p.local ? "You" : displayName}
      </div>
    </div>
  );
}

/** Full-size tile showing a participant's shared screen. */
function ScreenTile({ p }: { p: CallParticipant }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!videoRef.current || !p.screenTrack) return;
    videoRef.current.srcObject = new MediaStream([p.screenTrack]);
  }, [p.screenTrack]);
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-black ring-1 ring-border">
      <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-contain" />
      <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white">
        {p.local ? "Your screen" : `${p.userName}'s screen`}
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
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [meetingLocked, setMeetingLocked] = useState(false);
  const [waitingToJoin, setWaitingToJoin] = useState(false);
  const [pendingParticipants, setPendingParticipants] = useState<Array<{ id: string; name: string; avatarUrl: string; guest: boolean }>>([]);
  const [blurEnabled, setBlurEnabled] = useState(false);
  const [noiseEnabled, setNoiseEnabled] = useState(false);
  const [myFeedback, setMyFeedback] = useState<NonVerbalFeedback | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  // New features
  const [showPoll, setShowPoll] = useState(false);
  const [showQA, setShowQA]    = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [fullscreenId, setFullscreenId]     = useState<string | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [caption, setCaption] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const captionRecRef = useRef<any>(null);
  const [selectedBg, setSelectedBg] = useState<string>("none");
  const [devices, setDevices] = useState<{ cameras: MediaDeviceInfo[]; mics: MediaDeviceInfo[]; speakers: MediaDeviceInfo[] }>({ cameras: [], mics: [], speakers: [] });
  const [selectedMic, setSelectedMic] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [dmTarget, setDmTarget] = useState(""); // session ID or "" = everyone
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAway, setIsAway] = useState(false);
  const [selfNameInput, setSelfNameInput] = useState<string | null>(null); // null=hidden
  const [breakoutTimerInput, setBreakoutTimerInput] = useState("5");
  const [breakoutMsgInput, setBreakoutMsgInput] = useState("");
  const [customBgFile, setCustomBgFile] = useState<string | null>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null);
  const recordingConsentSentRef = useRef(false);
  const prevChatLengthRef = useRef(0);
  const GRID_PAGE_SIZE = 9;
  const [gridPage, setGridPage] = useState(0);
  const [muteWarning, setMuteWarning] = useState(false);
  const muteWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    awayStatuses,
    chimesEnabled,
    lockedScreenshare,
    lockedCameraJoin,
    autoMuteJoin,
    chatReactions,
    remoteCaptions,
    speakerTime,
    unmuteRequests,
    isCallRecording,
    focusMode,
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
  } = useDailyCall(id, userName, {
    recordForAiNotes: isHost,
    enabled: !inLobby && !!hostId,
    initialAudioOn: lobbyMicOn,
    initialVideoOn: lobbyCamOn,
    hostId,
    roomId: activeRoomId ?? undefined,
    isHost,
    onMeetingEnded: () => {
      toast("The host ended the meeting");
      navigate("/dashboard");
    },
  });

  const participantList = Object.values(participants);
  const local = participantList.find((p) => p.local);
  const micOn = local?.audioOn ?? lobbyMicOn;
  const camOn = local?.videoOn ?? lobbyCamOn;
  const screensharer = participantList.find(p => p.screenTrack !== null) ?? null;
  const spotlightedP = spotlightId ? (participantList.find(p => p.sessionId === spotlightId) ?? null) : null;
  const isLocalLocked = !!(local && lockedMutes.has(local.sessionId));
  const canHost = isHost || (local ? cohosts.has(local.sessionId) : false);
  const fullscreenParticipant = fullscreenId ? (participantList.find(p => p.sessionId === fullscreenId) ?? null) : null;

  function handleFeedback(fb: NonVerbalFeedback | null) {
    setMyFeedback(fb);
    sendNonVerbalFeedback(fb);
  }

  async function toggleBlur() {
    const next = !blurEnabled;
    setBlurEnabled(next);
    await setBackgroundBlur(next);
  }
  async function toggleNoise() {
    const next = !noiseEnabled;
    setNoiseEnabled(next);
    await setNoiseSuppression(next);
  }

  async function handleBgChange(bgId: string) {
    setSelectedBg(bgId);
    if (bgId === "none") {
      setBlurEnabled(false);
      await setVirtualBackground("none");
    } else if (bgId === "blur") {
      setBlurEnabled(true);
      await setBackgroundBlur(true);
    } else {
      setBlurEnabled(false);
      await setBackgroundBlur(false);
      const bg = VIRTUAL_BG_PRESETS.find(b => b.id === bgId);
      if (bg?.url) await setVirtualBackground(bg.url);
    }
  }

  // Stable refs for keyboard shortcut closure (avoids stale captures)
  const micOnRef = useRef(micOn);
  const camOnRef = useRef(camOn);
  useEffect(() => { micOnRef.current = micOn; }, [micOn]);
  useEffect(() => { camOnRef.current = camOn; }, [camOn]);

  // Keyboard shortcuts: Space=push-to-talk, Alt+A=toggle mic, Alt+V=toggle cam
  useEffect(() => {
    if (!joined) return;
    let pttActive = false;
    function onKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        if (!micOnRef.current && !pttActive) { pttActive = true; setLocalAudio(true); }
      }
      if (e.altKey && e.code === "KeyA") { e.preventDefault(); setLocalAudio(!micOnRef.current); }
      if (e.altKey && e.code === "KeyV") { e.preventDefault(); setLocalVideo(!camOnRef.current); }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space" && pttActive) { pttActive = false; setLocalAudio(false); }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [joined, setLocalAudio, setLocalVideo]);

  // Live captions via Web Speech API (transcribes your own mic locally)
  useEffect(() => {
    if (!captionsEnabled) { captionRecRef.current?.stop(); setCaption(""); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { toast("Live captions not supported in this browser"); setCaptionsEnabled(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any;
    rec.continuous = true; rec.interimResults = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => setCaption(Array.from(ev.results as any[]).map((r: any) => r[0].transcript).join(" "));
    rec.onerror = () => setCaptionsEnabled(false);
    rec.start(); captionRecRef.current = rec;
    return () => rec.stop();
  }, [captionsEnabled]);

  // Enumerate media devices once joined
  useEffect(() => {
    if (joined) enumerateDevices().then(setDevices);
  }, [joined, enumerateDevices]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const m = await meetingsApi.get(id);
      if (!m) return;
      setMeetingTitle(m.title);
      setHostId(m.hostId);
      setIsHost(!!session?.user && m.hostId === session.user.id);
      setMeetingLocked(Boolean(m.locked));
      setPendingParticipants(
        m.participants
          .filter((p) => !p.joined)
          .map((p) => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl, guest: Boolean(p.guest) }))
      );
    };
    void load();
    const int = setInterval(() => { void load(); }, 3000);
    return () => clearInterval(int);
  }, [id, session?.user?.id]);

  useEffect(() => {
    if (!id) return;
    meetingsApi.rooms.list(id).then((nextRooms) => {
      setRooms(nextRooms);
      setActiveRoomId((current) => current ?? nextRooms[0]?.id ?? null);
    }).catch(() => {});
  }, [id]);

  // Record this user as a participant the moment the Daily call connects.
  // Guests (no session) are skipped. Requires migration 002 to persist.
  useEffect(() => {
    if (!joined || !id || !session?.user) return;
    meetingsApi.recordJoin(id).catch(() => {/* non-fatal */});
  }, [joined, id, session?.user?.id]);

  useEffect(() => {
    if (!id || !waitingToJoin || isHost || !session?.user) return;
    const int = setInterval(async () => {
      const admitted = await meetingsApi.isAdmitted(id);
      if (admitted) {
        setWaitingToJoin(false);
        setInLobby(false);
      }
    }, 3000);
    return () => clearInterval(int);
  }, [id, waitingToJoin, isHost, session?.user?.id]);

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

  // Toast when screenshare starts/stops
  useEffect(() => {
    if (!screenshareNotify) return;
    if (screenshareNotify.started) toast(`${screenshareNotify.userName} is now sharing their screen`, { icon: <ScreenShare className="h-4 w-4" /> });
    clearScreenshareNotify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenshareNotify]);

  // Host-transfer notification
  useEffect(() => {
    if (!hostTransferNotify) return;
    if (local?.sessionId === hostTransferNotify.sessionId) { toast.success("You are now the host"); setIsHost(true); }
    else toast(`${hostTransferNotify.name} is now the host`, { icon: <Crown className="h-4 w-4" /> });
    clearHostTransferNotify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostTransferNotify]);

  // Unread chat badge
  useEffect(() => {
    if (chat.length > prevChatLengthRef.current) {
      if (!showChat) {
        const incoming = chat.slice(prevChatLengthRef.current).filter(m => !m.mine).length;
        if (incoming > 0) setUnreadCount(c => c + incoming);
      }
      prevChatLengthRef.current = chat.length;
    }
  }, [chat, showChat]);
  useEffect(() => { if (showChat) setUnreadCount(0); }, [showChat]);

  // Broadcast live captions to all participants when text changes
  useEffect(() => {
    if (captionsEnabled && caption.trim()) broadcastCaption(caption);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caption, captionsEnabled]);

  // Notify all about recording start (host only, once on join)
  useEffect(() => {
    if (joined && isHost && !recordingConsentSentRef.current) {
      recordingConsentSentRef.current = true;
      notifyRecordingConsent();
    }
  }, [joined, isHost]);

  // Unmute request: show actionable toast to the targeted participant
  useEffect(() => {
    const myReqs = unmuteRequests.filter(r => r.sessionId === local?.sessionId);
    if (!myReqs.length) return;
    const req = myReqs[myReqs.length - 1];
    toast(`${req.fromName} is asking you to unmute`, {
      action: { label: "Unmute", onClick: () => setLocalAudio(true) },
      duration: 8000,
    });
    dismissUnmuteRequest(local!.sessionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unmuteRequests.length]);

  // Breakout broadcast message toast
  useEffect(() => {
    if (breakoutBroadcastMsg) toast(breakoutBroadcastMsg, { icon: <Radio className="h-4 w-4" />, duration: 10000 });
  }, [breakoutBroadcastMsg]);

  // Breakout timer toast
  useEffect(() => {
    if (breakoutMinutesLeft !== null)
      toast(`${breakoutMinutesLeft} minute${breakoutMinutesLeft === 1 ? "" : "s"} left in breakout room`, { icon: <Timer className="h-4 w-4" />, duration: 8000 });
  }, [breakoutMinutesLeft]);

  // "You're on mute" — detects when you speak while muted
  useEffect(() => {
    if (!local || micOn) { setMuteWarning(false); return; }
    if (activeSpeakerId === local.sessionId) {
      setMuteWarning(true);
      if (muteWarningTimerRef.current) clearTimeout(muteWarningTimerRef.current);
      muteWarningTimerRef.current = setTimeout(() => setMuteWarning(false), 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSpeakerId, micOn, local?.sessionId]);

  // Chat persistence — saves to localStorage after every new message
  useEffect(() => {
    if (!id || chat.length === 0) return;
    try { localStorage.setItem(`nexameet-chat-${id}`, JSON.stringify(chat.slice(-200))); } catch {}
  }, [chat, id]);

  // Grid page reset when participants drop below current page
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(participantList.length / GRID_PAGE_SIZE) - 1);
    if (gridPage > maxPage) setGridPage(maxPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantList.length]);

  // Meeting duration warnings at 55 min and 60 min
  useEffect(() => {
    if (elapsed === 55 * 60) toast("This meeting has been running for 55 minutes", { icon: <Timer className="h-4 w-4" />, duration: 10000 });
    if (elapsed === 60 * 60) toast("1 hour — consider wrapping up soon", { icon: <Timer className="h-4 w-4" />, duration: 10000 });
  }, [elapsed]);

  // Escape closes active panel; ? toggles shortcuts overlay
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "?") { e.preventDefault(); setShowShortcuts(v => !v); return; }
      if (e.key === "Escape") {
        if (selfNameInput !== null) { setSelfNameInput(null); return; }
        if (fullscreenId) { setFullscreenId(null); return; }
        if (showWhiteboard) { setShowWhiteboard(false); return; }
        if (showShortcuts) { setShowShortcuts(false); return; }
        if (showQA) { setShowQA(false); return; }
        if (showPoll) { setShowPoll(false); return; }
        if (showParticipants) { setShowParticipants(false); return; }
        if (showChat) { setShowChat(false); return; }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selfNameInput, fullscreenId, showWhiteboard, showShortcuts, showQA, showPoll, showParticipants, showChat]);

  async function togglePiP() {
    try {
      const videoEl = document.querySelector<HTMLVideoElement>("video:not([muted])") ?? document.querySelector<HTMLVideoElement>("video");
      if (!videoEl) { toast("No video stream available for PiP"); return; }
      if ((document as any).pictureInPictureElement) await (document as any).exitPictureInPicture();
      else await (videoEl as any).requestPictureInPicture();
    } catch { toast("Picture-in-picture is not supported in this browser"); }
  }

  function saveChatToFile() {
    const lines = chat.map(m => `[${new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}] ${m.from}: ${m.text}`).join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `chat-${id ?? "meeting"}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleCustomBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomBgFile(url);
    setSelectedBg("custom");
    void setVirtualBackground(url);
  }

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
    const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const timeStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const invite = [
      `NexaMeet is inviting you to a scheduled meeting.`,
      ``,
      `Topic: ${meetingTitle}`,
      `Date: ${dateStr}`,
      `Time: ${timeStr}`,
      `Meeting ID: ${id}`,
      ``,
      `Join NexaMeet Meeting:`,
      joinUrl,
    ].join("\n");
    navigator.clipboard.writeText(invite);
    toast.success("Invite copied to clipboard");
  }

  async function createRoom() {
    if (!id) return;
    setCreatingRoom(true);
    try {
      const roomName = `Breakout ${rooms.filter((r) => r.kind === "breakout").length + 1}`;
      const room = await meetingsApi.rooms.create(id, roomName);
      setRooms((prev) => [...prev, room]);
      setActiveRoomId(room.id);
      toast.success("Room created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create room");
    } finally {
      setCreatingRoom(false);
    }
  }

  async function toggleMeetingLock() {
    if (!id) return;
    const nextLocked = !meetingLocked;
    try {
      await meetingsApi.setLocked(id, nextLocked);
      setMeetingLocked(nextLocked);
      toast.success(nextLocked ? "Meeting locked" : "Meeting unlocked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update lock");
    }
  }

  async function admitWaitingUser(idOrGuest: { id: string; guest: boolean }) {
    if (!id) return;
    try {
      if (idOrGuest.guest) await meetingsApi.admitGuestParticipant(id, idOrGuest.id);
      else await meetingsApi.admitParticipant(id, idOrGuest.id);
      toast.success("Participant admitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't admit participant");
    }
  }

  async function denyWaitingUser(idOrGuest: { id: string; guest: boolean }) {
    if (!id) return;
    try {
      if (idOrGuest.guest) await meetingsApi.denyGuestParticipant(id, idOrGuest.id);
      else await meetingsApi.denyParticipant(id, idOrGuest.id);
      toast.success("Participant denied");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't deny participant");
    }
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
        onJoin={() => {
          if (meetingLocked && !isHost) {
            toast.error("This meeting is locked");
            return;
          }
          if (!isHost && (session?.user || session?.guest)) {
            void meetingsApi.requestJoin(id!);
            setWaitingToJoin(true);
            return;
          }
          setInLobby(false);
        }}
        onExit={() => navigate(-1)}
      />
    );
  }

  if (waitingToJoin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-raised px-4 text-center">
        <Logo />
        <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-sm">
          <h1 className="font-display text-xl font-semibold text-text">Waiting room</h1>
          <p className="mt-2 text-sm text-text-muted">
            You’re waiting for the host to admit you to <span className="font-medium text-text">{meetingTitle}</span>.
          </p>
        </div>
      </div>
    );
  }

  if (meetingLocked && !isHost) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-raised px-4 text-center">
        <Logo />
        <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-sm">
          <h1 className="font-display text-xl font-semibold text-text">Meeting locked</h1>
          <p className="mt-2 text-sm text-text-muted">
            The host has locked <span className="font-medium text-text">{meetingTitle}</span>. Try again later or ask the host to unlock it.
          </p>
        </div>
      </div>
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
        <div className="relative flex-1 overflow-hidden">
          {/* Floating reactions */}
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            {reactions.map((r) => (
              <span key={r.id} className="absolute bottom-24" style={{ left: `${20 + (r.id % 60)}%`, animation: "reaction-rise 2.2s ease-out forwards" }}>
                <VectorEmoji emoji={r.emoji} size={40} />
              </span>
            ))}
          </div>
          <style>{`
            @keyframes reaction-rise { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-220px); opacity: 0; } }
            @keyframes audio-bar { 0% { transform: scaleY(0.35); } 100% { transform: scaleY(1.05); } }
          `}</style>

          {/* Reconnect overlay */}
          {reconnecting && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p className="text-sm font-medium text-white">Reconnecting…</p>
              <p className="text-xs text-white/60">Your connection was interrupted</p>
            </div>
          )}

          {/* Live captions overlay */}
          {captionsEnabled && caption && (
            <div className="pointer-events-none absolute bottom-20 left-4 right-4 z-10 flex justify-center">
              <div className="max-w-xl rounded-xl bg-black/75 px-4 py-2.5 text-center text-sm font-medium leading-relaxed text-white">
                {caption}
              </div>
            </div>
          )}

          {screensharer ? (
            /* Screenshare layout: screen fills main area, participants in right strip */
            <div className="flex h-full gap-3 p-4">
              <div className="min-w-0 flex-1">
                <ScreenTile p={screensharer} />
              </div>
              <div className="flex w-36 shrink-0 flex-col gap-2 overflow-y-auto">
                {participantList.map((p) => (
                  <SmallTile key={p.sessionId} p={p} feedback={nonVerbalFeedback[p.sessionId]} rename={participantRenames[p.sessionId]} />
                ))}
              </div>
            </div>
          ) : spotlightedP ? (
            /* Spotlight layout: pinned participant large, others in bottom strip */
            <div className="flex h-full flex-col gap-3 p-4">
              <div className="min-h-0 flex-1">
                <ParticipantTile
                  p={{ ...spotlightedP, userName: participantRenames[spotlightedP.sessionId] ?? spotlightedP.userName }}
                  handRaised={(handRaised && spotlightedP.local) || raisedHands.some(h => h.sessionId === spotlightedP.sessionId)}
                  feedback={nonVerbalFeedback[spotlightedP.sessionId]}
                  activeSpeaker={activeSpeakerId === spotlightedP.sessionId}
                  isAway={!!awayStatuses[spotlightedP.sessionId]}
                  onDoubleClick={() => setFullscreenId(spotlightedP.sessionId)}
                  spotlighted
                />
              </div>
              {participantList.length > 1 && (
                <div className="flex h-28 shrink-0 gap-3 overflow-x-auto">
                  {participantList.filter(p => p.sessionId !== spotlightedP.sessionId).map((p) => (
                    <div key={p.sessionId} className="w-44 shrink-0">
                      <SmallTile p={p} feedback={nonVerbalFeedback[p.sessionId]} rename={participantRenames[p.sessionId]} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Normal grid with pagination */
            <div className="relative h-full p-4">
              {(() => {
                const totalPages = Math.max(1, Math.ceil(participantList.length / GRID_PAGE_SIZE));
                const paginated = participantList.slice(gridPage * GRID_PAGE_SIZE, (gridPage + 1) * GRID_PAGE_SIZE);
                const n = paginated.length;
                return (
                  <>
                    <div className={cn("grid h-full gap-3",
                      n <= 1 && "grid-cols-1",
                      n === 2 && "grid-cols-1 sm:grid-cols-2",
                      n >= 3 && n <= 4 && "grid-cols-2",
                      n >= 5 && n <= 6 && "grid-cols-2 sm:grid-cols-3",
                      n >= 7 && "grid-cols-3"
                    )}>
                      {participantList.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-text-muted">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Connecting to the call…
                        </div>
                      ) : (
                        paginated.map((p) => (
                          <ParticipantTile
                            key={p.sessionId}
                            p={{ ...p, userName: participantRenames[p.sessionId] ?? p.userName }}
                            handRaised={(handRaised && p.local) || raisedHands.some(h => h.sessionId === p.sessionId)}
                            feedback={nonVerbalFeedback[p.sessionId]}
                            activeSpeaker={activeSpeakerId === p.sessionId}
                            isAway={!!awayStatuses[p.sessionId]}
                            onDoubleClick={() => setFullscreenId(p.sessionId)}
                          />
                        ))
                      )}
                    </div>
                    {totalPages > 1 && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                        <button disabled={gridPage === 0} onClick={() => setGridPage(p => p - 1)} className="text-white disabled:opacity-30 hover:text-primary transition-colors">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-xs text-white">{gridPage + 1} / {totalPages}</span>
                        <button disabled={gridPage >= totalPages - 1} onClick={() => setGridPage(p => p + 1)} className="text-white disabled:opacity-30 hover:text-primary transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="fixed inset-0 z-30 flex flex-col bg-background md:static md:z-auto md:w-80 md:border-l md:border-border">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold text-text">In-call chat</h3>
              <div className="flex items-center gap-1">
                {chat.length > 0 && (
                  <>
                    <button onClick={saveChatToFile} title="Save chat" className="rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-text">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    {canHost && (
                      <button onClick={() => { if (window.confirm("Clear all chat messages for everyone?")) clearChat(); }} title="Clear all chat" className="rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </>
                )}
                <button onClick={() => setShowChat(false)} className="rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-text"><X className="h-4 w-4" /></button>
              </div>
            </div>
            {/* DM target selector */}
            <div className="border-b border-border px-3 py-2">
              <select
                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-text"
                value={dmTarget}
                onChange={e => setDmTarget(e.target.value)}
              >
                <option value="">Everyone</option>
                {participantList.filter(p => !p.local).map(p => (
                  <option key={p.sessionId} value={p.sessionId}>{participantRenames[p.sessionId] ?? p.userName}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {chat.filter(m => {
                if (!m.isDM) return true;
                if (m.mine) return true;
                return m.dmTo === local?.sessionId;
              }).map((m) => (
                <div key={m.id} className="group">
                  <div className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                    m.mine ? "ml-auto bg-primary text-text" : "bg-surface-raised text-text",
                    m.isDM && "ring-1 ring-primary/50"
                  )}>
                    {!m.mine && <p className="mb-0.5 text-xs font-medium text-primary">{m.from}{m.isDM ? " → you" : ""}</p>}
                    {m.mine && m.isDM && (
                      <p className="mb-0.5 text-[10px] opacity-60 text-right">
                        DM → {participantRenames[m.dmTo ?? ""] ?? participantList.find(p => p.sessionId === m.dmTo)?.userName ?? "..."}
                      </p>
                    )}
                    <p className="break-words">{m.text}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      {m.sentAt > 0 && <span className="text-[10px] opacity-50">{new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {["👍","❤️","😂"].map(e => (
                          <button key={e} onClick={() => reactToChat(m.id, e)} className="rounded p-0.5 text-[11px] hover:bg-background transition-colors">
                            <VectorEmoji emoji={e} size={11} />
                          </button>
                        ))}
                      </div>
                    </div>
                    {chatReactions[m.id] && Object.keys(chatReactions[m.id]).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {Object.entries(
                          Object.values(chatReactions[m.id]).reduce<Record<string, number>>((acc, e) => ({ ...acc, [e]: (acc[e] ?? 0) + 1 }), {})
                        ).map(([emoji, count]) => (
                          <span key={emoji} className="flex items-center gap-0.5 rounded-full bg-background px-1.5 py-0.5 text-[10px]">
                            <VectorEmoji emoji={emoji} size={10} /> {count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chat.length === 0 && <p className="py-4 text-center text-xs text-text-muted">No messages yet</p>}
            </div>
            {chatEnabled ? (
              <form onSubmit={(e) => { e.preventDefault(); if (!chatInput.trim()) return; sendChat(chatInput, userName, dmTarget || undefined); setChatInput(""); }} className="flex gap-2 border-t border-border p-3">
                <Input
                  placeholder={dmTarget ? `DM ${participantRenames[dmTarget] ?? participantList.find(p => p.sessionId === dmTarget)?.userName ?? "..."}` : "Message everyone"}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <Button size="icon" type="submit"><Send className="h-4 w-4" /></Button>
              </form>
            ) : (
              <div className="border-t border-border p-3 text-center text-xs text-text-muted">Chat disabled by host</div>
            )}
          </div>
        )}

        {/* Participants panel */}
        {showParticipants && (
          <div className="fixed inset-0 z-30 flex flex-col bg-background md:static md:z-auto md:w-80 md:border-l md:border-border">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold text-text">Participants ({participantList.length})</h3>
              <button onClick={() => setShowParticipants(false)} className="rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-text"><X className="h-4 w-4" /></button>
            </div>
            {rooms.length > 0 && (
              <div className="border-b border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Rooms</p>
                  {isHost && <button onClick={createRoom} className="text-xs text-primary hover:underline" disabled={creatingRoom}>{creatingRoom ? "Creating..." : "+ New"}</button>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        activeRoomId === room.id ? "border-primary bg-primary text-text" : "border-border bg-surface-raised text-text-muted"
                      )}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 space-y-1 overflow-y-auto p-3">
              {raisedHands.length > 0 && (
                <div className="mb-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">✋ Raised hands</p>
                  <div className="mt-2 space-y-1">
                    {[...raisedHands].sort((a, b) => a.raisedAt - b.raisedAt).map(h => (
                      <div key={h.sessionId} className="flex items-center justify-between rounded-lg px-1 py-0.5">
                        <span className="text-sm text-text">{h.userName}</span>
                        {canHost && <button onClick={() => lowerHandFor(h.sessionId)} className="text-xs text-text-muted underline hover:text-text">Lower</button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {pendingParticipants.length > 0 && (
                <div className="mb-3 rounded-xl border border-border bg-surface-raised p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Waiting room</p>
                    {pendingParticipants.length > 1 && (
                      <button onClick={() => { pendingParticipants.forEach(p => { void admitWaitingUser({ id: p.id, guest: p.guest }); }); toast.success("All participants admitted"); }} className="text-xs font-medium text-primary hover:underline">
                        Admit all ({pendingParticipants.length})
                      </button>
                    )}
                  </div>
                  <div className="mt-2 space-y-2">
                    {pendingParticipants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-background px-2 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={p.name} className="h-8 w-8" />
                          <span className="text-sm text-text">{p.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => { void admitWaitingUser({ id: p.id, guest: p.guest }); }}>
                            Admit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { void denyWaitingUser({ id: p.id, guest: p.guest }); }}>
                            Deny
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Hand raise queue — ordered by time raised */}
              {raisedHands.length > 0 && (
                <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Raised hands ({raisedHands.length})</p>
                    {canHost && raisedHands.length > 1 && (
                      <button onClick={() => raisedHands.forEach(h => lowerHandFor(h.sessionId))} className="text-xs text-primary hover:underline">Lower all</button>
                    )}
                  </div>
                  <ol className="mt-2 space-y-1">
                    {[...raisedHands].sort((a, b) => a.raisedAt - b.raisedAt).map((h, i) => (
                      <li key={h.sessionId} className="flex items-center justify-between rounded-lg bg-background px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-center text-xs font-bold text-text-muted">{i + 1}</span>
                          <span className="text-sm text-text">✋ {participantRenames[h.sessionId] ?? h.userName}</span>
                        </div>
                        {canHost && (
                          <button onClick={() => lowerHandFor(h.sessionId)} className="text-[10px] text-text-muted hover:text-destructive underline">Lower</button>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {participantList.map((p) => {
                const displayName = participantRenames[p.sessionId] ?? p.userName;
                const fb = nonVerbalFeedback[p.sessionId];
                const isLocked = lockedMutes.has(p.sessionId);
                const isCo = cohosts.has(p.sessionId);
                const isPinned = spotlightId === p.sessionId;
                const isRenaming = renamingId === p.sessionId;
                return (
                  <div key={p.sessionId} className="rounded-lg px-2 py-2 hover:bg-surface-raised">
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar name={displayName} className="h-8 w-8 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="truncate text-sm text-text">{p.local ? `${displayName} (You)` : displayName}</span>
                            {isCo && <Star className="h-3 w-3 shrink-0 text-yellow-400" title="Co-host" />}
                            {isLocked && <Lock className="h-3 w-3 shrink-0 text-destructive" title="Mic locked" />}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {p.audioOn ? <Mic className="h-3 w-3 text-text-muted" /> : <MicOff className="h-3 w-3 text-destructive" />}
                            {p.videoOn ? <Video className="h-3 w-3 text-text-muted" /> : <VideoOff className="h-3 w-3 text-destructive" />}
                            {fb && (
                              <span className={cn("ml-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white", FEEDBACK_META[fb].color)}>
                                <VectorEmoji emoji={FEEDBACK_META[fb].emoji} size={10} /> {FEEDBACK_META[fb].label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {p.local ? (
                        <button title="Rename yourself" onClick={() => setSelfNameInput(displayName)} className="ml-2 rounded-md p-1 text-text-muted hover:bg-background hover:text-text">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      ) : canHost && (
                        <div className="ml-2 flex shrink-0 flex-wrap items-center gap-0.5">
                          <button title={isPinned ? "Unpin" : "Pin for everyone"} onClick={() => setSpotlight(isPinned ? null : p.sessionId)} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text">
                            {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                          </button>
                          <button title={isCo ? "Remove co-host" : "Make co-host"} onClick={() => { promoteCohost(p.sessionId, !isCo); toast(isCo ? `${displayName} is no longer co-host` : `${displayName} is now co-host`); }} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text">
                            <Star className={cn("h-3.5 w-3.5", isCo && "text-yellow-400")} />
                          </button>
                          <button title="Transfer host role to this participant" onClick={() => { transferHost(p.sessionId, displayName); toast(`Host transferred to ${displayName}`); }} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text">
                            <Crown className="h-3.5 w-3.5" />
                          </button>
                          <button title={isLocked ? "Unlock mic" : "Lock mic (prevent unmute)"} onClick={() => { lockMute(p.sessionId, !isLocked); toast(isLocked ? `${displayName} can unmute` : `${displayName}'s mic locked`); }} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text">
                            <Lock className={cn("h-3.5 w-3.5", isLocked && "text-destructive")} />
                          </button>
                          <button title="Rename" onClick={() => { setRenamingId(p.sessionId); setRenameInput(displayName); }} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {p.audioOn ? (
                            <>
                              <button title="Mute" onClick={() => { muteParticipant(p.sessionId); toast(`${displayName} muted`); }} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text">
                                <MicOff className="h-3.5 w-3.5" />
                              </button>
                              <button title="Ask to unmute" onClick={() => { requestUnmute(p.sessionId); toast(`Asked ${displayName} to unmute`); }} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text">
                                <Mic className="h-3.5 w-3.5 text-primary" />
                              </button>
                            </>
                          ) : (
                            <button title="Ask to unmute" onClick={() => { requestUnmute(p.sessionId); toast(`Asked ${displayName} to unmute`); }} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text">
                              <Mic className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button title={p.videoOn ? "Stop video" : "Video already off"} disabled={!p.videoOn} onClick={() => { stopParticipantVideo(p.sessionId); toast(`${displayName}'s video stopped`); }} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text disabled:opacity-30">
                            <VideoOff className="h-3.5 w-3.5" />
                          </button>
                          <button title="Remove from call" onClick={() => { removeParticipant(p.sessionId); toast(`${displayName} removed`); }} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-destructive">
                            <UserX className="h-3.5 w-3.5" />
                          </button>
                          <button title="Ban (remove and block rejoin)" onClick={() => { banParticipant(p.sessionId); toast(`${displayName} banned`); }} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-destructive">
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {isRenaming && (
                      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (renameInput.trim()) { renameParticipant(p.sessionId, renameInput.trim()); toast(`Renamed to ${renameInput.trim()}`); } setRenamingId(null); }}>
                        <Input autoFocus value={renameInput} onChange={e => setRenameInput(e.target.value)} placeholder="New display name" className="h-7 text-xs" />
                        <Button type="submit" size="sm" className="h-7 px-2 text-xs">Save</Button>
                        <Button type="button" variant="secondary" size="sm" className="h-7 px-2 text-xs" onClick={() => setRenamingId(null)}>Cancel</Button>
                      </form>
                    )}
                  </div>
                );
              })}
              {participantList.length <= 1 && (
                <p className="px-2 py-4 text-xs text-text-muted text-center">No other participants yet.</p>
              )}
            </div>
            <div className="space-y-1.5 border-t border-border p-3">
              {canHost && (
                <>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => { muteAll(); toast("Everyone muted"); }}>
                    <Shield className="h-3.5 w-3.5" /> Mute everyone
                  </Button>
                  {/* Chat / reactions toggles */}
                  <button onClick={() => { setChatEnabled(!chatEnabled); toast(chatEnabled ? "Chat disabled" : "Chat enabled"); }} className={cn("flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs", chatEnabled ? "border-border text-text-muted" : "border-destructive/40 text-destructive")}>
                    <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> {chatEnabled ? "Disable chat" : "Enable chat"}</span>
                    <span className={cn("h-4 w-7 rounded-full transition-colors", chatEnabled ? "bg-primary" : "bg-border")} />
                  </button>
                  <button onClick={() => { setReactionsEnabled(!reactionsEnabled); toast(reactionsEnabled ? "Reactions disabled" : "Reactions enabled"); }} className={cn("flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs", reactionsEnabled ? "border-border text-text-muted" : "border-destructive/40 text-destructive")}>
                    <span className="flex items-center gap-1.5"><Smile className="h-3.5 w-3.5" /> {reactionsEnabled ? "Disable reactions" : "Enable reactions"}</span>
                    <span className={cn("h-4 w-7 rounded-full transition-colors", reactionsEnabled ? "bg-primary" : "bg-border")} />
                  </button>
                  {/* Lock screenshare / camera */}
                  <button onClick={() => { setLockedScreenshareAll(!lockedScreenshare); toast(lockedScreenshare ? "Screensharing unlocked" : "Screensharing locked"); }} className={cn("flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs", lockedScreenshare ? "border-destructive/40 text-destructive" : "border-border text-text-muted")}>
                    <span className="flex items-center gap-1.5"><ScreenShare className="h-3.5 w-3.5" /> {lockedScreenshare ? "Unlock screenshare" : "Lock screenshare"}</span>
                    <span className={cn("h-4 w-7 rounded-full transition-colors", lockedScreenshare ? "bg-destructive" : "bg-border")} />
                  </button>
                  <button onClick={() => { setLockedCameraAll(!lockedCameraJoin); toast(lockedCameraJoin ? "Cameras unlocked" : "Cameras locked for all"); }} className={cn("flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs", lockedCameraJoin ? "border-destructive/40 text-destructive" : "border-border text-text-muted")}>
                    <span className="flex items-center gap-1.5"><Video className="h-3.5 w-3.5" /> {lockedCameraJoin ? "Unlock cameras" : "Lock all cameras"}</span>
                    <span className={cn("h-4 w-7 rounded-full transition-colors", lockedCameraJoin ? "bg-destructive" : "bg-border")} />
                  </button>
                  {/* Auto-mute new joiners */}
                  <button onClick={() => { setAutoMuteJoin(!autoMuteJoin); toast(autoMuteJoin ? "Auto-mute off" : "New joiners will be auto-muted"); }} className={cn("flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs", autoMuteJoin ? "border-primary/40 text-primary" : "border-border text-text-muted")}>
                    <span className="flex items-center gap-1.5"><MicOff className="h-3.5 w-3.5" /> Auto-mute new joiners</span>
                    <span className={cn("h-4 w-7 rounded-full transition-colors", autoMuteJoin ? "bg-primary" : "bg-border")} />
                  </button>
                  {/* Focus mode */}
                  <button onClick={() => { setFocusMode(!focusMode); toast(focusMode ? "Focus mode off" : "Focus mode on — participants only see you"); }} className={cn("flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs", focusMode ? "border-primary/40 text-primary" : "border-border text-text-muted")}>
                    <span className="flex items-center gap-1.5">{focusMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} Focus mode</span>
                    <span className={cn("h-4 w-7 rounded-full transition-colors", focusMode ? "bg-primary" : "bg-border")} />
                  </button>
                  {/* Breakout room controls */}
                  {rooms.length > 0 && (
                    <div className="mt-2 space-y-1.5 rounded-xl border border-border p-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Breakout controls</p>
                      <div className="flex gap-1">
                        <input
                          type="number" min="1" max="60"
                          value={breakoutTimerInput}
                          onChange={e => setBreakoutTimerInput(e.target.value)}
                          className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs text-text"
                        />
                        <Button size="sm" variant="secondary" className="flex-1 text-xs h-7 px-2" onClick={() => { broadcastBreakoutTimer(Number(breakoutTimerInput)); toast(`${breakoutTimerInput}m timer sent to all rooms`); }}>
                          <Timer className="h-3 w-3" /> Send timer
                        </Button>
                      </div>
                      <Button size="sm" variant="secondary" className="w-full text-xs h-7" onClick={() => { returnAllFromBreakout(); toast("All participants returned to main room"); }}>
                        Return all to main room
                      </Button>
                      <div className="flex gap-1">
                        <input
                          placeholder="Broadcast message…"
                          value={breakoutMsgInput}
                          onChange={e => setBreakoutMsgInput(e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-text"
                        />
                        <Button size="sm" variant="secondary" className="text-xs h-7 px-2" onClick={() => { if (breakoutMsgInput.trim()) { broadcastToBreakoutRooms(breakoutMsgInput); setBreakoutMsgInput(""); toast("Broadcast sent"); } }}>
                          <Radio className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              <Button variant="secondary" size="sm" className="w-full" onClick={toggleMeetingLock}>
                <Lock className="h-3.5 w-3.5" /> {meetingLocked ? "Unlock meeting" : "Lock meeting"}
              </Button>
            </div>
          </div>
        )}

        {/* Poll panel */}
        {showPoll && id && (
          <div className="fixed inset-0 z-30 flex flex-col bg-background md:static md:z-auto md:w-80 md:border-l md:border-border">
            <PollPanel
              meetingId={id}
              mySession={local?.sessionId ?? ""}
              myName={userName}
              canHost={canHost}
              onClose={() => setShowPoll(false)}
              refreshSignal={dataUpdateSignal?.kind === "poll" ? dataUpdateSignal.at : 0}
              onBroadcastUpdate={() => broadcastDataUpdate("poll")}
            />
          </div>
        )}

        {/* Q&A panel */}
        {showQA && id && (
          <div className="fixed inset-0 z-30 flex flex-col bg-background md:static md:z-auto md:w-80 md:border-l md:border-border">
            <QAPanel
              meetingId={id}
              mySession={local?.sessionId ?? ""}
              myName={userName}
              canHost={canHost}
              onClose={() => setShowQA(false)}
              refreshSignal={dataUpdateSignal?.kind === "qa" ? dataUpdateSignal.at : 0}
              onBroadcastUpdate={() => broadcastDataUpdate("qa")}
            />
          </div>
        )}
      </div>

      {/* You're on mute warning */}
      {muteWarning && (
        <div className="flex items-center justify-center gap-2 border-t border-destructive/30 bg-destructive/10 py-2 text-sm font-medium text-destructive">
          <MicOff className="h-4 w-4" />
          <span>You're muted — press <kbd className="mx-1 rounded bg-destructive/20 px-1.5 py-0.5 font-mono text-xs">M</kbd> to unmute</span>
          <button onClick={() => { setLocalAudio(true); setMuteWarning(false); }} className="ml-1 rounded-full bg-destructive/20 px-2 py-0.5 text-xs hover:bg-destructive/30 transition-colors">Unmute</button>
        </div>
      )}
      {/* Controls */}
      <div className="flex items-center gap-2 overflow-x-auto border-t border-border bg-surface-raised px-3 py-3 sm:justify-center sm:px-4 sm:py-4">
        {/* Mic — disabled when host has locked your mute */}
        <Button
          className="shrink-0"
          variant={micOn ? "secondary" : "destructive"}
          size="icon"
          title={isLocalLocked ? "Muted by host" : undefined}
          onClick={() => { if (!isLocalLocked || micOn) setLocalAudio(!micOn); }}
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button className="shrink-0" variant={camOn ? "secondary" : "destructive"} size="icon" onClick={() => setLocalVideo(!camOn)}>{camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}</Button>
        <Button className="shrink-0" variant={screenSharing ? "pulse" : "secondary"} size="icon" onClick={toggleScreenShare}><ScreenShare className="h-4 w-4" /></Button>
        <Button className="shrink-0" variant={handRaised ? "pulse" : "secondary"} size="icon" onClick={() => { const next = !handRaised; setHandRaised(next); raiseHand(local?.sessionId ?? "", userName, next); }}><Hand className="h-4 w-4" /></Button>
        {/* Non-verbal feedback picker */}
        <div className="relative group shrink-0">
          <Button variant={myFeedback ? "pulse" : "secondary"} size="icon" title="Non-verbal feedback">
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-full left-1/2 mb-2 w-40 -translate-x-1/2 rounded-xl border border-border bg-surface-raised p-1.5 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
            {(["yes", "no", "slow-down", "speed-up"] as NonVerbalFeedback[]).map((fb) => (
              <button key={fb} onClick={() => handleFeedback(myFeedback === fb ? null : fb)} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-background", myFeedback === fb && "bg-background font-semibold")}>
                <VectorEmoji emoji={FEEDBACK_META[fb].emoji} size={16} /> {FEEDBACK_META[fb].label}
                {myFeedback === fb && <span className="ml-auto text-text-muted">✕ clear</span>}
              </button>
            ))}
          </div>
        </div>
        {/* Emoji reactions */}
        <div className="relative group shrink-0">
          <Button variant="secondary" size="icon" title="Send reaction" disabled={!reactionsEnabled}><Smile className="h-4 w-4" /></Button>
          {reactionsEnabled && (
            <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-surface-raised p-1.5 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
              {["👍", "❤️", "😂", "😮", "👏", "🔥"].map((e) => (
                <button key={e} className="rounded-full p-1.5 hover:bg-background transition-colors" onClick={() => sendReaction(e)}>
                  <VectorEmoji emoji={e} size={22} />
                </button>
              ))}
            </div>
          )}
        </div>
        {/* My settings: background blur + noise suppression */}
        <div className="relative group shrink-0">
          <Button variant="secondary" size="icon" title="My settings"><Settings className="h-4 w-4" /></Button>
          <div className="absolute bottom-full right-0 mb-2 w-64 max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-surface-raised p-3 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">My settings</p>
            <button onClick={toggleNoise} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-background transition-colors">
              <span className="flex items-center gap-2 text-text"><Mic2 className="h-3.5 w-3.5" /> Noise suppression</span>
              <span className={cn("h-4 w-7 rounded-full transition-colors", noiseEnabled ? "bg-primary" : "bg-border")} />
            </button>
            <button onClick={() => setCaptionsEnabled(!captionsEnabled)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-background transition-colors">
              <span className="flex items-center gap-2 text-text"><FileText className="h-3.5 w-3.5" /> Live captions (you)</span>
              <span className={cn("h-4 w-7 rounded-full transition-colors", captionsEnabled ? "bg-primary" : "bg-border")} />
            </button>
            <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Background</p>
            <div className="flex flex-wrap gap-1.5">
              {VIRTUAL_BG_PRESETS.map(bg => (
                <button key={bg.id} onClick={() => handleBgChange(bg.id)} title={bg.label}
                  className={cn("relative h-10 w-14 overflow-hidden rounded-lg border-2 transition-all",
                    selectedBg === bg.id ? "border-primary" : "border-border hover:border-text-muted"
                  )}>
                  {bg.url
                    ? <img src={bg.url} className="h-full w-full object-cover" alt={bg.label} loading="lazy" />
                    : bg.id === "blur"
                      ? <span className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500/40 to-purple-500/40"><Sparkles className="h-3.5 w-3.5 text-white" /></span>
                      : <span className="flex h-full items-center justify-center bg-border text-[9px] text-text-muted">Off</span>
                  }
                  {selectedBg === bg.id && <span className="absolute inset-0 flex items-center justify-center bg-primary/30"><CheckCircle2 className="h-4 w-4 text-white" /></span>}
                </button>
              ))}
            </div>
            {devices.cameras.length > 0 && (
              <>
                <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Camera</p>
                <select className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-text"
                  value={selectedCamera}
                  onChange={async e => { setSelectedCamera(e.target.value); await setVideoInputDevice(e.target.value); }}>
                  {devices.cameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || "Camera"}</option>)}
                </select>
              </>
            )}
            {devices.mics.length > 0 && (
              <>
                <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Microphone</p>
                <select className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-text"
                  value={selectedMic}
                  onChange={async e => { setSelectedMic(e.target.value); await setAudioInputDevice(e.target.value); }}>
                  {devices.mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || "Microphone"}</option>)}
                </select>
              </>
            )}
            {devices.speakers.length > 0 && (
              <>
                <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Speaker</p>
                <select className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-text"
                  value={selectedSpeaker}
                  onChange={async e => {
                    setSelectedSpeaker(e.target.value);
                    try {
                      // Apply speaker selection to all audio elements
                      document.querySelectorAll<HTMLAudioElement>("audio").forEach(async el => {
                        await (el as any).setSinkId?.(e.target.value);
                      });
                    } catch {}
                  }}>
                  {devices.speakers.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || "Speaker"}</option>)}
                </select>
              </>
            )}
            {/* Custom virtual background upload */}
            <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Custom background</p>
            <button onClick={() => customBgInputRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-muted hover:border-primary hover:text-primary transition-colors">
              <Upload className="h-3.5 w-3.5" /> Upload your own image…
            </button>
            <input ref={customBgInputRef} type="file" accept="image/*" className="hidden" onChange={handleCustomBgUpload} />
            {customBgFile && (
              <div className="mt-1 flex items-center gap-2">
                <img src={customBgFile} alt="Custom bg" className="h-8 w-12 rounded object-cover" />
                <button onClick={() => { setCustomBgFile(null); setSelectedBg("none"); void setVirtualBackground("none"); }} className="text-[10px] text-text-muted hover:text-destructive underline">Remove</button>
              </div>
            )}
            {/* Join/leave chimes toggle */}
            <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Call sounds</p>
            <button onClick={() => { setChimesEnabled(!chimesEnabled); toast(chimesEnabled ? "Join/leave chimes off" : "Join/leave chimes on"); }} className="flex w-full items-center justify-between rounded-lg border border-border px-2 py-1.5 text-sm hover:bg-background transition-colors">
              <span className="flex items-center gap-2 text-text">{chimesEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />} Join/leave chimes</span>
              <span className={cn("h-4 w-7 rounded-full transition-colors", chimesEnabled ? "bg-primary" : "bg-border")} />
            </button>
            {/* Away / BRB status */}
            <button onClick={() => { const next = !isAway; setIsAway(next); setAwayStatus(next); toast(next ? "You're marked as away" : "Welcome back!"); }} className="mt-0.5 flex w-full items-center justify-between rounded-lg border border-border px-2 py-1.5 text-sm hover:bg-background transition-colors">
              <span className="flex items-center gap-2 text-text"><Coffee className="h-3.5 w-3.5" /> Away / BRB</span>
              <span className={cn("h-4 w-7 rounded-full transition-colors", isAway ? "bg-amber-500" : "bg-border")} />
            </button>
          </div>
        </div>
        <Button className="shrink-0" variant="secondary" size="icon" onClick={() => setView(view === "grid" ? "speaker" : "grid")}>{view === "grid" ? <MonitorPlay className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}</Button>
        <div className="relative shrink-0">
          <Button variant={showChat ? "primary" : "secondary"} size="icon" title="Chat (Alt+C)" onClick={() => { setShowChat(!showChat); setShowParticipants(false); setShowPoll(false); setShowQA(false); }}><MessageSquare className="h-4 w-4" /></Button>
          {unreadCount > 0 && !showChat && (
            <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
          )}
        </div>
        <div className="relative shrink-0">
          <Button variant={showParticipants ? "primary" : "secondary"} size="icon" title="Participants (Alt+P)" onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); setShowPoll(false); setShowQA(false); }}><Users className="h-4 w-4" /></Button>
          {participantList.length > 0 && (
            <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-text-muted px-0.5 text-[9px] font-bold text-background">{participantList.length}</span>
          )}
        </div>
        <Button className="shrink-0" variant={showPoll ? "primary" : "secondary"} size="icon" title="Polls" onClick={() => { setShowPoll(!showPoll); setShowChat(false); setShowParticipants(false); setShowQA(false); }}><BarChart2 className="h-4 w-4" /></Button>
        <Button className="shrink-0" variant={showQA ? "primary" : "secondary"} size="icon" title="Q&amp;A" onClick={() => { setShowQA(!showQA); setShowChat(false); setShowParticipants(false); setShowPoll(false); }}><HelpCircle className="h-4 w-4" /></Button>
        <Button className="shrink-0" variant={showWhiteboard ? "primary" : "secondary"} size="icon" title="Whiteboard" onClick={() => setShowWhiteboard(v => !v)}><Edit3 className="h-4 w-4" /></Button>
        <Button className="shrink-0" variant={isAway ? "pulse" : "secondary"} size="icon" title="Away / BRB" onClick={() => { const next = !isAway; setIsAway(next); setAwayStatus(next); toast(next ? "Marked as away" : "Welcome back!"); }}><Coffee className="h-4 w-4" /></Button>
        <Button className="shrink-0" variant="secondary" size="icon" title="Picture-in-picture" onClick={togglePiP}><PictureInPicture2 className="h-4 w-4" /></Button>
        <Button className="shrink-0" variant="secondary" size="icon" title="Keyboard shortcuts (?)" onClick={() => setShowShortcuts(v => !v)}><Keyboard className="h-4 w-4" /></Button>
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

      {/* Whiteboard overlay */}
      {showWhiteboard && id && (
        <Whiteboard
          meetingId={id}
          strokes={whiteboardStrokes}
          mySessionId={local?.sessionId ?? ""}
          canClear={canHost}
          onStroke={sendWhiteboardStroke}
          onUndo={undoWhiteboardStroke}
          onClear={clearWhiteboard}
          onClose={() => setShowWhiteboard(false)}
        />
      )}

      {/* Fullscreen tile overlay (double-click any tile to expand) */}
      {fullscreenParticipant && (
        <div className="fixed inset-0 z-40 flex flex-col bg-black">
          <div className="relative min-h-0 flex-1">
            <ParticipantTile
              p={{ ...fullscreenParticipant, userName: participantRenames[fullscreenParticipant.sessionId] ?? fullscreenParticipant.userName }}
              handRaised={(handRaised && fullscreenParticipant.local) || raisedHands.some(h => h.sessionId === fullscreenParticipant.sessionId)}
              feedback={nonVerbalFeedback[fullscreenParticipant.sessionId]}
              activeSpeaker={activeSpeakerId === fullscreenParticipant.sessionId}
            />
          </div>
          <div className="flex justify-center py-3">
            <Button variant="secondary" size="sm" onClick={() => setFullscreenId(null)}>
              <Minimize2 className="h-4 w-4" /> Exit fullscreen
            </Button>
          </div>
        </div>
      )}

      {wrappingUp && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-text-muted">Generating AI meeting notes…</p>
        </div>
      )}

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}

      {/* Recording consent banner */}
      {isCallRecording && (
        <div className="pointer-events-none fixed bottom-20 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-destructive/40 bg-background/90 px-4 py-2 text-xs font-medium text-destructive backdrop-blur-sm shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
            This meeting is being recorded
          </div>
        </div>
      )}

      {/* Self-rename dialog */}
      {selfNameInput !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-raised shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-text">Change your display name</h2>
              <button onClick={() => setSelfNameInput(null)} className="rounded-md p-1 text-text-muted hover:bg-background hover:text-text"><X className="h-4 w-4" /></button>
            </div>
            <form className="p-5 space-y-4" onSubmit={e => { e.preventDefault(); if (selfNameInput.trim()) { setSelfName(selfNameInput.trim()); toast(`You're now ${selfNameInput.trim()}`); } setSelfNameInput(null); }}>
              <Input
                autoFocus
                value={selfNameInput}
                onChange={e => setSelfNameInput(e.target.value)}
                placeholder="Your display name"
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Save</Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setSelfNameInput(null)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Focus mode indicator for non-hosts */}
      {focusMode && !canHost && (
        <div className="pointer-events-none fixed top-16 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-background/90 px-4 py-2 text-xs font-medium text-primary backdrop-blur-sm shadow-lg">
            <Eye className="h-3.5 w-3.5" /> Focus mode — host view only
          </div>
        </div>
      )}

      {/* Remote participants' captions */}
      {Object.keys(remoteCaptions).length > 0 && (
        <div className="pointer-events-none fixed bottom-24 left-4 right-4 z-10 flex flex-col items-center gap-1">
          {Object.entries(remoteCaptions).slice(0, 3).map(([sid, { name, text }]) => text.trim() && (
            <div key={sid} className="max-w-xl rounded-xl bg-black/75 px-4 py-2 text-center text-sm font-medium text-white">
              <span className="text-xs text-white/60 mr-2">{name}:</span>{text}
            </div>
          ))}
        </div>
      )}

      {/* Speaker talk-time stats (shown in a floating badge when there's data) */}
      {joined && Object.keys(speakerTime).length > 0 && showParticipants && (
        <></>  /* Talk time is shown inline in participants panel rows */
      )}
    </div>
  );
}
