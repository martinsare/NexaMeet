import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Users, Repeat } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { meetings as meetingsApi } from "@/lib/backend";

export default function ScheduleMeeting() {
  const navigate  = useNavigate();
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate]             = useState("");
  const [time, setTime]             = useState("");
  const [duration, setDuration]     = useState("30");
  const [recurring, setRecurring]   = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [password, setPassword]     = useState(false);
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [loading, setLoading]       = useState(false);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const startAt = date && time ? new Date(`${date}T${time}`).toISOString() : new Date().toISOString();
      const meeting = await meetingsApi.schedule({
        title: title || "Untitled meeting", description, startAt,
        durationMins: Number(duration), timezone, recurring,
        passwordProtected: password, waitingRoom,
      });

      const joinUrl = `${window.location.origin}/meeting/${meeting.id}`;
      const dateStr = new Date(startAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const timeStr = new Date(startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const invite = [
        `NexaMeet is inviting you to a scheduled meeting.`,
        ``,
        `Topic: ${meeting.title}`,
        `Date: ${dateStr}`,
        `Time: ${timeStr}`,
        `Meeting ID: ${meeting.id}`,
        ``,
        `Join NexaMeet Meeting:`,
        joinUrl,
      ].join("\n");
      try {
        await navigator.clipboard.writeText(invite);
        toast.success("Meeting scheduled and invite link copied");
      } catch {
        toast.success("Meeting scheduled");
      }
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Schedule">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-text">New scheduled meeting</h2>
          <p className="mt-1 text-sm text-text-muted">Fill in the details — you can share the invite link after.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basics */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" required placeholder="e.g. Weekly product sync" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="desc">Description <span className="font-normal text-text-muted">(optional)</span></Label>
              <textarea
                id="desc"
                placeholder="What's this meeting about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                rows={3}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* When */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">When</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["15","30","45","60","90"].map((d) => (
                      <SelectItem key={d} value={d}>{d} minutes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Repeat className="h-3.5 w-3.5" /> Repeat</Label>
                <Select value={recurring} onValueChange={(v) => setRecurring(v as typeof recurring)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-text-muted">Time zone: {timezone}</p>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Options */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Options</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock className="h-4 w-4 text-text-muted" />
                <div>
                  <p className="text-sm font-medium text-text">Password protection</p>
                  <p className="text-xs text-text-muted">Marks the meeting as locked in the app</p>
                </div>
              </div>
              <Switch checked={password} onCheckedChange={setPassword} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-text-muted" />
                <div>
                  <p className="text-sm font-medium text-text">Waiting room</p>
                  <p className="text-xs text-text-muted">Admit participants one by one</p>
                </div>
              </div>
              <Switch checked={waitingRoom} onCheckedChange={setWaitingRoom} />
            </div>
          </div>

          <div className="border-t border-border pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Scheduling…" : "Schedule meeting"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
