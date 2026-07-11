import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Sparkles, Download, Share2, FileText, Users, Clock } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { meetings as meetingsApi } from "@/lib/backend";
import emptyInvite from "@/assets/images/empty-invite.jpg";
import type { Meeting } from "@/lib/data/demo-data";
import { formatDuration } from "@/lib/utils";

export default function MeetingHistory() {
  const [history, setHistory] = useState<Meeting[]>([]);
  const [active, setActive] = useState<Meeting | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    meetingsApi.history().then((h) => {
      setHistory(h);
      setActive(h[0] ?? null);
    });
  }, []);

  const filtered = history.filter((m) => m.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell title="Meeting history">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-3">
          <Input placeholder="Search past meetings…" value={q} onChange={(e) => setQ(e.target.value)} />
          {filtered.map((m) => (
            <Card
              key={m.id}
              onClick={() => setActive(m)}
              className={`cursor-pointer p-4 transition-colors ${active?.id === m.id ? "border-signal-400" : "hover:border-surface-border"}`}
            >
              <h4 className="font-medium text-white">{m.title}</h4>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-void-400">
                <Clock className="h-3 w-3" /> {format(new Date(m.startAt), "MMM d")} · {formatDuration(m.durationMins)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {m.participants.slice(0, 3).map((p) => <Avatar key={p.id} src={p.avatarUrl} name={p.name} className="h-6 w-6 ring-2 ring-void-950" />)}
                </div>
                {m.aiSummary && <Badge variant="pulse"><Sparkles className="h-3 w-3" /> AI</Badge>}
              </div>
            </Card>
          ))}
        </div>

        <div>
          {active ? (
            <Card className="p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-white">{active.title}</h2>
                  <p className="mt-1 flex items-center gap-3 text-sm text-void-400">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDuration(active.durationMins)}</span>
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {active.participants.length} participants</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {active.hasRecording && <Button size="sm" variant="secondary"><Download className="h-3.5 w-3.5" /> Recording</Button>}
                  {active.hasTranscript && <Button size="sm" variant="secondary"><FileText className="h-3.5 w-3.5" /> Transcript</Button>}
                  <Button size="sm" variant="secondary"><Share2 className="h-3.5 w-3.5" /> Share</Button>
                </div>
              </div>

              {active.aiSummary ? (
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-signal-300"><Sparkles className="h-4 w-4" /> AI Summary</h3>
                    <p className="mt-2 text-sm text-void-200">{active.aiSummary.summary}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Decisions made</h3>
                    <ul className="mt-2 space-y-1.5">
                      {active.aiSummary.decisions.map((d) => <li key={d} className="text-sm text-void-200">• {d}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Action items</h3>
                    <div className="mt-2 space-y-2">
                      {active.aiSummary.actionItems.map((a) => (
                        <div key={a.task} className="flex items-center justify-between rounded-lg border border-surface-border px-3 py-2">
                          <span className="text-sm text-void-100">{a.task}</span>
                          <Badge variant={a.done ? "pulse" : "outline"}>{a.owner}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Highlights</h3>
                    <ul className="mt-2 space-y-1.5">
                      {active.aiSummary.highlights.map((h) => <li key={h} className="text-sm text-void-200">✦ {h}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm text-void-400">No AI summary was generated for this meeting.</p>
              )}
            </Card>
          ) : (
            <Card className="flex flex-col items-center gap-2 p-10 text-center">
              <img src={emptyInvite} className="h-32 w-32 object-contain" style={{ mixBlendMode: "screen" }} alt="" />
              <p className="text-void-300">No past meetings yet.</p>
              <p className="text-sm text-void-500">Completed meetings and their AI summaries will appear here.</p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
