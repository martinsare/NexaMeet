import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CalendarClock, Lock, Users, Repeat, Link as LinkIcon } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { meetings as meetingsApi } from "@/lib/backend";

export default function ScheduleMeeting() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [password, setPassword] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [loading, setLoading] = useState(false);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const startAt = date && time ? new Date(`${date}T${time}`).toISOString() : new Date().toISOString();
    const m = await meetingsApi.schedule({
      title: title || "Untitled meeting",
      description,
      startAt,
      durationMins: Number(duration),
      timezone,
      recurring,
      passwordProtected: password,
      waitingRoom,
    });
    toast.success("Meeting scheduled — invite link copied");
    navigate("/dashboard");
  }

  return (
    <AppShell title="Schedule meeting">
      <div className="mx-auto max-w-2xl">
        <Card className="p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><CalendarClock className="h-5 w-5" /></div>
            <div>
              <h2 className="font-display text-lg font-semibold text-text">New meeting</h2>
              <p className="text-sm text-text-muted">Fill in the details — you can edit them later.</p>
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" required placeholder="e.g. Weekly product sync" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <textarea
                id="desc"
                placeholder="What's this meeting about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["15", "30", "45", "60", "90"].map((d) => <SelectItem key={d} value={d}>{d} minutes</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Time zone</Label>
                <Input disabled value={timezone} />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Repeat className="h-3.5 w-3.5" /> Recurring</Label>
              <Select value={recurring} onValueChange={(v) => setRecurring(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-text"><Lock className="h-4 w-4" /> Password protection</span>
                <Switch checked={password} onCheckedChange={setPassword} />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-text"><Users className="h-4 w-4" /> Waiting room</span>
                <Switch checked={waitingRoom} onCheckedChange={setWaitingRoom} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>Schedule meeting</Button>
              <Button type="button" variant="secondary"><LinkIcon className="h-4 w-4" /> Copy link</Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
