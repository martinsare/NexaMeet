/**
 * QAPanel — structured Q&A for meetings.
 * Participants ask questions; others upvote; host marks answered / dismisses.
 */
import { useCallback, useEffect, useState } from "react";
import { X, HelpCircle, ArrowUp, CheckCircle2, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type QUpvote = { voter_session: string };
type Question = {
  id: string;
  text: string;
  asked_by_name: string;
  asked_by_session: string;
  is_answered: boolean;
  is_dismissed: boolean;
  upvotes: QUpvote[];
  created_at: string;
};

type Props = {
  meetingId: string;
  mySession: string;
  myName: string;
  canHost: boolean;
  onClose: () => void;
  refreshSignal: number;
  onBroadcastUpdate: () => void;
};

export function QAPanel({ meetingId, mySession, myName, canHost, onClose, refreshSignal, onBroadcastUpdate }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [input,     setInput]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"open" | "answered">("open");

  const fetchQuestions = useCallback(async () => {
    const res = await fetch(`/api/questions?meetingId=${encodeURIComponent(meetingId)}`);
    if (res.ok) {
      const { questions: data } = await res.json();
      setQuestions(data ?? []);
    }
    setLoading(false);
  }, [meetingId]);

  useEffect(() => { void fetchQuestions(); }, [fetchQuestions, refreshSignal]);

  async function askQuestion(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setSubmitting(true);
    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, text, askedByName: myName, askedBySession: mySession }),
    });
    setInput(""); setSubmitting(false);
    await fetchQuestions();
    onBroadcastUpdate();
  }

  async function upvote(qId: string) {
    await fetch(`/api/questions/${qId}/upvote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterSession: mySession }),
    });
    await fetchQuestions();
    onBroadcastUpdate();
  }

  async function markAnswered(qId: string) {
    await fetch(`/api/questions/${qId}/answer`, { method: "POST" });
    await fetchQuestions();
    onBroadcastUpdate();
  }

  async function dismiss(qId: string) {
    await fetch(`/api/questions/${qId}/dismiss`, { method: "POST" });
    await fetchQuestions();
    onBroadcastUpdate();
  }

  const upvoteCount = (q: Question) => q.upvotes.length;
  const myUpvoted   = (q: Question) => q.upvotes.some(u => u.voter_session === mySession);

  const sorted = (list: Question[]) => [...list].sort((a, b) => upvoteCount(b) - upvoteCount(a));
  const open     = sorted(questions.filter(q => !q.is_answered));
  const answered = sorted(questions.filter(q => q.is_answered));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
          <HelpCircle className="h-4 w-4" /> Q&amp;A
          {open.length > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">{open.length}</span>}
        </h3>
        <button onClick={onClose} className="rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-text">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["open","answered"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 text-xs font-medium capitalize transition-colors",
              tab === t ? "border-b-2 border-primary text-primary" : "text-text-muted hover:text-text"
            )}>
            {t} ({t === "open" ? open.length : answered.length})
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && <p className="text-center text-xs text-text-muted py-8">Loading…</p>}
        {!loading && (tab === "open" ? open : answered).length === 0 && (
          <p className="text-center text-xs text-text-muted py-8">
            {tab === "open" ? "No questions yet — be the first to ask!" : "No answered questions yet."}
          </p>
        )}
        {(tab === "open" ? open : answered).map((q) => (
          <div key={q.id} className={cn("rounded-xl border p-3 space-y-2", q.is_answered ? "border-border opacity-60" : "border-border bg-background")}>
            <p className="text-sm text-text leading-snug">{q.text}</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-text-muted">{q.asked_by_name}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => upvote(q.id)}
                  className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                    myUpvoted(q) ? "bg-primary/15 text-primary" : "text-text-muted hover:bg-surface-raised hover:text-text"
                  )}>
                  <ArrowUp className="h-3 w-3" /> {upvoteCount(q)}
                </button>
                {canHost && !q.is_answered && (
                  <>
                    <button onClick={() => markAnswered(q.id)} title="Mark answered" className="rounded-md p-1 text-text-muted hover:text-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => dismiss(q.id)} title="Dismiss" className="rounded-md p-1 text-text-muted hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={askQuestion} className="flex gap-2 border-t border-border p-3">
        <Input placeholder="Ask a question…" value={input} onChange={e => setInput(e.target.value)} className="text-sm" />
        <Button size="icon" type="submit" disabled={submitting}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
