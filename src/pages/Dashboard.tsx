import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { Video, CalendarPlus, LogIn, Sparkles, Clock, Users, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { meetings as meetingsApi } from "@/lib/backend";
import type { Meeting } from "@/lib/backend";
import emptyMeetings from "@/assets/images/empty-meetings.jpg";

export default function Dashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [joinId, setJoinId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([meetingsApi.upcoming(), meetingsApi.history()]).then(
      ([up, hist]) => {
        setUpcoming(up);
        setRecent(hist.slice(0, 3));
        setLoading(false);
      }
    );
  }, []);

  async function startInstant() {
    const m = await meetingsApi.createInstant();
    toast.success("Meeting room ready — copied invite link");
    navigate(`/meeting/${m.id}`);
  }

  function joinMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!joinId.trim()) return;
    navigate(`/meeting/${joinId.trim()}`);
  }

  return (
    <AppShell title="Home">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-2xl border border-border bg-surface-raised/10 bg-gradient-to-br from-primary/20 to-success/10 p-7">
          <p className="text-sm text-text-muted">{format(new Date(), "EEEE, MMMM d")}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-text">
            Welcome back, {session?.user.name?.split(" ")[0] ?? "there"}
          </h2>
          <p className="mt-1 text-text-muted">You have {upcoming.length} upcoming meeting{upcoming.length === 1 ? "" : "s"} today.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={startInstant}><Video className="h-4 w-4" /> Start instant meeting</Button>
            <Button variant="secondary" onClick={() => navigate("/schedule")}><CalendarPlus className="h-4 w-4" /> Schedule meeting</Button>
          </div>
        </div>

        <form onSubmit={joinMeeting} className="flex gap-3">
          <Input placeholder="Enter a meeting ID or paste an invite link to join" value={joinId} onChange={(e) => setJoinId(e.target.value)} />
          <Button type="submit" variant="secondary"><LogIn className="h-4 w-4" /> Join</Button>
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-text">Upcoming meetings</h3>
            <Button variant="link" size="sm" onClick={() => navigate("/schedule")}>Schedule new <ArrowRight className="h-3.5 w-3.5" /></Button>
          </div>
          {loading ? (
            <Card className="p-10 text-center text-text-muted">Loading…</Card>
          ) : upcoming.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <img src={emptyMeetings} className="h-32 w-32 object-contain" style={{ mixBlendMode: "screen" }} alt="" />
              <p className="text-text-muted">No upcoming meetings yet.</p>
              <Button size="sm" onClick={() => navigate("/schedule")}>Schedule your first one</Button>
            </Card>
          ) : (
            upcoming.map((m) => (
              <Card key={m.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-text">{m.title}</h4>
                    {m.passwordProtected && <Badge variant="outline">Locked</Badge>}
                    {m.waitingRoom && <Badge variant="outline">Waiting room</Badge>}
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                    <Clock className="h-3.5 w-3.5" /> {format(new Date(m.startAt), "EEE, MMM d · h:mm a")} · {m.durationMins}m
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {m.participants.slice(0, 4).map((p) => (
                        <Avatar key={p.id} src={p.avatarUrl} name={p.name} className="h-6 w-6 ring-2 ring-background" />
                      ))}
                    </div>
                    {m.participants.length > 0 && <span className="text-xs text-text-muted">{m.participants.length} invited</span>}
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate(`/meeting/${m.id}`)}>Start <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Card>
            ))
          )}

          {recent[0]?.aiSummary && (
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" /> AI meeting recap</div>
              <p className="mt-2 text-sm text-text-muted">{recent[0].aiSummary.summary}</p>
              <Button variant="link" size="sm" className="mt-1 px-0" onClick={() => navigate("/history")}>Read full recap <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Card>
          )}

          <div className="flex items-center justify-between pt-4">
            <h3 className="font-display text-lg font-semibold text-text">Recent meetings</h3>
            <Button variant="link" size="sm" onClick={() => navigate("/history")}>View all <ArrowRight className="h-3.5 w-3.5" /></Button>
          </div>
          {recent.map((m) => (
            <Card key={m.id} className="flex items-center justify-between p-5">
              <div>
                <h4 className="font-medium text-text">{m.title}</h4>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                  <Users className="h-3.5 w-3.5" /> {m.participants.length} participants · {m.durationMins}m
                </p>
              </div>
              {m.aiSummary && (
                <Badge variant="pulse"><Sparkles className="h-3 w-3" /> Summary ready</Badge>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
