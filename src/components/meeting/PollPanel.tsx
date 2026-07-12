/**
 * PollPanel — create and vote on in-meeting polls.
 * Polls are persisted via /api/polls and synced in real-time through
 * the Daily app-message "data-update" signal.
 */
import { useCallback, useEffect, useState } from "react";
import { Plus, X, BarChart2, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PollOption = { id: string; text: string };
type PollVote   = { voter_session: string; option_id: string };
type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  votes: PollVote[];
  ended_at: string | null;
  created_by_name: string;
};

type Props = {
  meetingId: string;
  mySession: string;
  myName: string;
  canHost: boolean;
  onClose: () => void;
  /** Increments whenever a data-update signal arrives so we re-fetch. */
  refreshSignal: number;
  onBroadcastUpdate: () => void;
};

export function PollPanel({ meetingId, mySession, myName, canHost, onClose, refreshSignal, onBroadcastUpdate }: Props) {
  const [polls,   setPolls]   = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  // Create-poll form
  const [newQ,      setNewQ]      = useState("");
  const [newOpts,   setNewOpts]   = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  const fetchPolls = useCallback(async () => {
    const res = await fetch(`/api/polls?meetingId=${encodeURIComponent(meetingId)}`);
    if (res.ok) {
      const { polls: data } = await res.json();
      setPolls(data ?? []);
    }
    setLoading(false);
  }, [meetingId]);

  useEffect(() => { void fetchPolls(); }, [fetchPolls, refreshSignal]);

  async function createPoll(e: React.FormEvent) {
    e.preventDefault();
    if (!newQ.trim()) return;
    const opts = newOpts.filter(o => o.trim()).map((text, i) => ({ id: String(i), text: text.trim() }));
    if (opts.length < 2) return;
    setSubmitting(true);
    await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, question: newQ.trim(), options: opts, createdByName: myName }),
    });
    setNewQ(""); setNewOpts(["", ""]); setCreating(false); setSubmitting(false);
    await fetchPolls();
    onBroadcastUpdate();
  }

  async function vote(pollId: string, optionId: string) {
    await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterSession: mySession, optionId }),
    });
    await fetchPolls();
    onBroadcastUpdate();
  }

  async function endPoll(pollId: string) {
    await fetch(`/api/polls/${pollId}/end`, { method: "POST" });
    await fetchPolls();
    onBroadcastUpdate();
  }

  const myVote = (poll: Poll) => poll.votes.find(v => v.voter_session === mySession)?.option_id ?? null;
  const totalVotes = (poll: Poll) => poll.votes.length;
  const optVotes = (poll: Poll, optId: string) => poll.votes.filter(v => v.option_id === optId).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
          <BarChart2 className="h-4 w-4" /> Polls ({polls.filter(p => !p.ended_at).length} active)
        </h3>
        <div className="flex gap-2">
          {canHost && !creating && (
            <button onClick={() => setCreating(true)} className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> New poll
            </button>
          )}
          <button onClick={onClose} className="rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <form onSubmit={createPoll} className="border-b border-border p-4 space-y-3">
          <Input autoFocus placeholder="Question…" value={newQ} onChange={e => setNewQ(e.target.value)} className="text-sm" />
          {newOpts.map((o, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder={`Option ${i + 1}`} value={o} onChange={e => setNewOpts(prev => prev.map((x, j) => j === i ? e.target.value : x))} className="text-sm" />
              {newOpts.length > 2 && (
                <button type="button" onClick={() => setNewOpts(prev => prev.filter((_, j) => j !== i))} className="text-text-muted hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {newOpts.length < 6 && (
            <button type="button" onClick={() => setNewOpts(prev => [...prev, ""])} className="text-xs text-primary hover:underline">
              + Add option
            </button>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" disabled={submitting} className="flex-1">Launch poll</Button>
            <Button size="sm" type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {loading && <p className="text-center text-xs text-text-muted py-8">Loading…</p>}
        {!loading && polls.length === 0 && (
          <p className="text-center text-xs text-text-muted py-8">No polls yet{canHost ? " — create one above" : ""}.</p>
        )}
        {polls.map((poll) => {
          const voted = myVote(poll);
          const total = totalVotes(poll);
          const ended = !!poll.ended_at;
          const showResults = voted !== null || ended;
          return (
            <div key={poll.id} className={cn("rounded-xl border p-4 space-y-3", ended ? "border-border bg-surface-raised opacity-70" : "border-border bg-background")}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-text leading-snug">{poll.question}</p>
                <div className="flex shrink-0 items-center gap-1">
                  {ended && <span className="rounded-full bg-border px-2 py-0.5 text-[10px] text-text-muted">Ended</span>}
                  {canHost && !ended && (
                    <button onClick={() => endPoll(poll.id)} title="End poll" className="text-text-muted hover:text-text">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {poll.options.map((opt) => {
                  const count = optVotes(poll, opt.id);
                  const pct   = total ? Math.round((count / total) * 100) : 0;
                  const isMyVote = voted === opt.id;
                  return (
                    <button
                      key={opt.id}
                      disabled={voted !== null || ended}
                      onClick={() => vote(poll.id, opt.id)}
                      className={cn(
                        "relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        isMyVote ? "border-primary bg-primary/10 text-text" : "border-border bg-background text-text hover:bg-surface-raised",
                        (voted !== null || ended) && "cursor-default"
                      )}
                    >
                      {showResults && (
                        <span className={cn("absolute inset-y-0 left-0 rounded-l-lg opacity-20 transition-all", isMyVote ? "bg-primary" : "bg-text-muted")} style={{ width: `${pct}%` }} />
                      )}
                      <span className="relative flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          {isMyVote && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                          {opt.text}
                        </span>
                        {showResults && <span className="text-xs text-text-muted">{count} ({pct}%)</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-text-muted">{total} vote{total !== 1 ? "s" : ""} · by {poll.created_by_name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
