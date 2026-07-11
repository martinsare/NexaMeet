import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, Sparkles, FileText, Clock } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { meetings as meetingsApi } from "@/lib/backend";
import type { Meeting } from "@/lib/backend";
import { format } from "date-fns";

export default function Search() {
  const navigate = useNavigate();
  const [q, setQ]               = useState("");
  const [results, setResults]   = useState<Meeting[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading]   = useState(false);

  async function onChange(value: string) {
    setQ(value);
    if (!value.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    const r = await meetingsApi.search(value);
    setResults(r);
    setSearched(true);
    setLoading(false);
  }

  return (
    <AppShell title="Search">
      <div className="mx-auto max-w-2xl">
        {/* Search input */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            autoFocus
            placeholder="Search meetings, transcripts, AI summaries…"
            className="h-12 rounded-xl pl-11 text-base"
            value={q}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>

        {/* Results */}
        <div className="mt-6">
          {!searched && !loading && (
            <div className="py-16 text-center">
              <SearchIcon className="mx-auto mb-3 h-8 w-8 text-text-muted opacity-40" />
              <p className="text-sm text-text-muted">Search across your meetings, transcripts, and AI summaries.</p>
            </div>
          )}

          {loading && (
            <div className="py-10 text-center text-sm text-text-muted">Searching…</div>
          )}

          {searched && !loading && results.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-text-muted">No results for "<span className="font-medium text-text">{q}</span>".</p>
              <p className="mt-1 text-sm text-text-muted">Try different keywords or check the spelling.</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {results.length} result{results.length === 1 ? "" : "s"}
              </p>
              <div className="divide-y divide-border rounded-xl border border-border">
                {results.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate("/history")}
                    className="flex w-full flex-col items-start gap-1.5 px-5 py-4 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-surface-raised"
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="font-medium text-text">{m.title}</span>
                      <div className="flex shrink-0 gap-1.5">
                        {m.aiSummary && <Badge variant="pulse"><Sparkles className="h-3 w-3" /> AI summary</Badge>}
                        {m.hasTranscript && <Badge variant="outline"><FileText className="h-3 w-3" /> Transcript</Badge>}
                      </div>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Clock className="h-3 w-3" /> {format(new Date(m.startAt), "MMM d, yyyy")}
                    </p>
                    {m.aiSummary?.summary && (
                      <p className="mt-0.5 text-sm text-text-muted line-clamp-2">{m.aiSummary.summary}</p>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
