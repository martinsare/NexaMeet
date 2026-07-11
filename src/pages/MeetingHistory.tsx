import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Sparkles, Download, Share2, FileText, Users, Clock, Search } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { meetings as meetingsApi } from "@/lib/backend";
import emptyInvite from "@/assets/images/empty-invite.png";
import type { Meeting } from "@/lib/backend";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function MeetingHistory() {
  const [history, setHistory]               = useState<Meeting[]>([]);
  const [active, setActive]                 = useState<Meeting | null>(null);
  const [q, setQ]                           = useState("");
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [transcript, setTranscript]         = useState<{ transcript: string; segments: { start: number; end: number; text: string }[] } | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  async function openTranscript() {
    if (!active) return;
    setTranscriptOpen(true);
    setTranscriptLoading(true);
    const data = await meetingsApi.getTranscript(active.id);
    setTranscript(data);
    setTranscriptLoading(false);
  }

  useEffect(() => {
    meetingsApi.history().then((h) => { setHistory(h); setActive(h[0] ?? null); });
  }, []);

  const filtered = history.filter((m) => m.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell title="History">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">

        {/* Sidebar list */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <Input placeholder="Search past meetings…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>

          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-muted">No meetings found.</p>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActive(m)}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-surface-raised",
                    active?.id === m.id && "bg-primary/5"
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className={cn("truncate text-sm font-medium", active?.id === m.id ? "text-primary" : "text-text")}>
                      {m.title}
                    </span>
                    {m.aiSummary && <Badge variant="pulse"><Sparkles className="h-3 w-3" /></Badge>}
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Clock className="h-3 w-3" />
                    {format(new Date(m.startAt), "MMM d, yyyy")} · {formatDuration(m.durationMins)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail pane */}
        <div>
          {active ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                <div>
                  <h2 className="font-display text-xl font-semibold text-text">{active.title}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDuration(active.durationMins)}</span>
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {active.participants.length} participants</span>
                    <span>{format(new Date(active.startAt), "MMM d, yyyy · h:mm a")}</span>
                  </div>
                  {active.participants.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {active.participants.map((p) => (
                        <div key={p.id} className="flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-1">
                          <Avatar src={p.avatarUrl} name={p.name} className="h-5 w-5" />
                          <span className="text-xs font-medium text-text">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {active.hasRecording && (
                    <Button size="sm" variant="secondary"><Download className="h-3.5 w-3.5" /> Recording</Button>
                  )}
                  {active.hasTranscript && (
                    <Button size="sm" variant="secondary" onClick={openTranscript}>
                      <FileText className="h-3.5 w-3.5" /> Transcript
                    </Button>
                  )}
                  <Button size="sm" variant="secondary"><Share2 className="h-3.5 w-3.5" /> Share</Button>
                </div>
              </div>

              {/* AI Summary */}
              {active.aiSummary ? (
                <div className="space-y-6">
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> AI Summary
                    </p>
                    <p className="text-sm leading-relaxed text-text-muted">{active.aiSummary.summary}</p>
                  </div>

                  {active.aiSummary.decisions.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Decisions made</p>
                      <ul className="space-y-1.5">
                        {active.aiSummary.decisions.map((d) => (
                          <li key={d} className="flex items-start gap-2 text-sm text-text">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {active.aiSummary.actionItems.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Action items</p>
                      <div className="divide-y divide-border rounded-xl border border-border">
                        {active.aiSummary.actionItems.map((a) => (
                          <div key={a.task} className="flex items-center justify-between gap-3 px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className={cn("h-2 w-2 shrink-0 rounded-full", a.done ? "bg-success" : "bg-border")} />
                              <span className={cn("text-sm", a.done && "line-through text-text-muted")}>{a.task}</span>
                            </div>
                            <Badge variant={a.done ? "pulse" : "outline"}>{a.owner}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {active.aiSummary.highlights.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Highlights</p>
                      <ul className="space-y-1.5">
                        {active.aiSummary.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2 text-sm text-text-muted">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No AI summary was generated for this meeting.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <img src={emptyInvite} className="h-24 w-24 object-contain" style={{ mixBlendMode: "screen" }} alt="" />
              <p className="text-text-muted">No past meetings yet.</p>
              <p className="text-sm text-text-muted">Completed meetings and their AI summaries will appear here.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={transcriptOpen} onOpenChange={setTranscriptOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Transcript — {active?.title}</DialogTitle>
          <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {transcriptLoading ? (
              <p className="text-sm text-text-muted">Loading transcript…</p>
            ) : transcript && transcript.segments.length > 0 ? (
              transcript.segments.map((s, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 tabular-nums text-text-muted">{formatTimestamp(s.start)}</span>
                  <span className="text-text">{s.text}</span>
                </div>
              ))
            ) : transcript?.transcript ? (
              <p className="whitespace-pre-wrap text-sm text-text">{transcript.transcript}</p>
            ) : (
              <p className="text-sm text-text-muted">No transcript available for this meeting.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
