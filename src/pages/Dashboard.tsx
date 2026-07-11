import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { Video, CalendarPlus, LogIn, Sparkles, Clock, Users, ArrowRight, Radio, StopCircle, Plus } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { meetings as meetingsApi } from "@/lib/backend";
import type { Meeting } from "@/lib/backend";
import emptyMeetings from "@/assets/images/empty-meetings.png";

export default function Dashboard() {
  const { session } = useAuth();
  const navigate    = useNavigate();
  const [live, setLive]                 = useState<Meeting[]>([]);
  const [upcoming, setUpcoming]         = useState<Meeting[]>([]);
  const [recent, setRecent]             = useState<Meeting[]>([]);
  const [joinId, setJoinId]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [endingId, setEndingId]         = useState<string | null>(null);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDesc, setMeetingDesc]   = useState("");
  const [creating, setCreating]         = useState(false);

  useEffect(() => {
    Promise.all([meetingsApi.live(), meetingsApi.upcoming(), meetingsApi.history()]).then(
      ([lv, up, hist]) => { setLive(lv); setUpcoming(up); setRecent(hist.slice(0, 5)); setLoading(false); }
    );
  }, []);

  async function startMeeting(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const m = await meetingsApi.createInstant({ title: meetingTitle.trim() || "My meeting", description: meetingDesc.trim() });
      setShowNewMeeting(false); setMeetingTitle(""); setMeetingDesc("");
      navigate(`/meeting/${m.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start meeting");
    } finally { setCreating(false); }
  }

  async function endLive(m: Meeting) {
    setEndingId(m.id);
    try {
      await meetingsApi.end(m.id, Math.max(1, Math.ceil((Date.now() - new Date(m.startAt).getTime()) / 60000)));
      setLive((prev) => prev.filter((x) => x.id !== m.id));
      toast.success("Meeting ended");
    } catch { toast.error("Couldn't end the meeting"); }
    finally { setEndingId(null); }
  }

  function joinMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!joinId.trim()) return;
    navigate(`/meeting/${joinId.trim()}`);
  }

  async function copyInvite(m: Meeting) {
    const joinUrl = `${window.location.origin}/meeting/${m.id}`;
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy the invite link");
    }
  }

  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  return (
    <AppShell title="Home">
      <div className="mx-auto max-w-3xl space-y-10">

        {/* New meeting dialog */}
        <Dialog open={showNewMeeting} onOpenChange={setShowNewMeeting}>
          <DialogContent>
            <DialogTitle>New meeting</DialogTitle>
            <p className="mt-1 text-sm text-text-muted">Name your room, then jump in.</p>
            <form onSubmit={startMeeting} className="mt-5 space-y-4">
              <div>
                <Label htmlFor="nm-title">Title</Label>
                <Input id="nm-title" placeholder="e.g. Design review" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} autoFocus />
              </div>
              <div>
                <Label htmlFor="nm-desc">Description <span className="font-normal text-text-muted">(optional)</span></Label>
                <textarea
                  id="nm-desc"
                  placeholder="What's this meeting about?"
                  value={meetingDesc}
                  onChange={(e) => setMeetingDesc(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="submit" className="flex-1" disabled={creating}>
                  <Video className="h-4 w-4" /> {creating ? "Starting…" : "Start meeting"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowNewMeeting(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{format(new Date(), "EEEE, MMMM d")}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-text">Good to see you, {firstName}.</h2>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowNewMeeting(true)}><Plus className="h-4 w-4" /> New meeting</Button>
            <Button variant="secondary" onClick={() => navigate("/schedule")}><CalendarPlus className="h-4 w-4" /> Schedule</Button>
          </div>
        </div>

        {/* Join by ID */}
        <form onSubmit={joinMeeting} className="flex gap-2">
          <Input placeholder="Paste a meeting ID or invite link to join…" value={joinId} onChange={(e) => setJoinId(e.target.value)} />
          <Button type="submit" variant="secondary"><LogIn className="h-4 w-4" /> Join</Button>
        </form>

        {/* Live now */}
        {live.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Live now</h3>
            </div>
            <div className="divide-y divide-border rounded-xl border border-destructive/20 bg-destructive/5">
              {live.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Radio className="h-3.5 w-3.5 shrink-0 text-destructive" />
                      <span className="truncate font-medium text-text">{m.title}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Started {format(new Date(m.startAt), "h:mm a")}
                      {m.participants.length > 0 && ` · ${m.participants.length} participant${m.participants.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {m.hostId === session?.user?.id && (
                      <Button size="sm" variant="destructive" onClick={() => endLive(m)} disabled={endingId === m.id}>
                        <StopCircle className="h-3.5 w-3.5" /> {endingId === m.id ? "Ending…" : "End"}
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/meeting/${m.id}?h=${m.hostId}`)}>
                      Rejoin <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming meetings */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Upcoming</h3>
            <button className="text-xs text-primary hover:underline" onClick={() => navigate("/schedule")}>+ Schedule new</button>
          </div>
          {loading ? (
            <div className="py-8 text-center text-sm text-text-muted">Loading…</div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-10 text-center">
              <img src={emptyMeetings} className="h-24 w-24 object-contain" style={{ mixBlendMode: "screen" }} alt="" />
              <p className="text-sm text-text-muted">Nothing scheduled yet.</p>
              <Button size="sm" variant="secondary" onClick={() => navigate("/schedule")}>Schedule a meeting</Button>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {upcoming.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-text">{m.title}</span>
                      {m.passwordProtected && <Badge variant="outline">Locked</Badge>}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
                      <Clock className="h-3 w-3" /> {format(new Date(m.startAt), "EEE, MMM d · h:mm a")} · {m.durationMins}m
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {m.participants.length > 0 && (
                      <div className="hidden items-center gap-1.5 sm:flex">
                        <div className="flex -space-x-1.5">
                          {m.participants.slice(0, 3).map((p) => (
                            <Avatar key={p.id} src={p.avatarUrl} name={p.name} className="h-6 w-6 ring-2 ring-background" />
                          ))}
                        </div>
                        <span className="text-xs text-text-muted">{m.participants.length}</span>
                      </div>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => copyInvite(m)}>
                      <CalendarPlus className="h-3.5 w-3.5" /> Copy invite
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/meeting/${m.id}`)}>
                      Start <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* AI recap */}
        {recent[0]?.aiSummary && (
          <section className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" /> AI recap from your last meeting
            </div>
            <p className="mt-2 text-sm text-text-muted line-clamp-2">{recent[0].aiSummary.summary}</p>
            <button className="mt-2 text-xs text-primary hover:underline" onClick={() => navigate("/history")}>
              Read full recap →
            </button>
          </section>
        )}

        {/* Recent meetings */}
        {recent.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Recent</h3>
              <button className="text-xs text-primary hover:underline" onClick={() => navigate("/history")}>View all</button>
            </div>
            <div className="divide-y divide-border rounded-xl border border-border">
              {recent.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-surface-raised" onClick={() => navigate("/history")}>
                  <div className="min-w-0">
                    <span className="truncate text-sm font-medium text-text">{m.title}</span>
                    <p className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {m.participants.length}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {m.durationMins}m</span>
                      <span>{format(new Date(m.startAt), "MMM d")}</span>
                    </p>
                  </div>
                  {m.aiSummary && <Badge variant="pulse"><Sparkles className="h-3 w-3" /> Summary</Badge>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
