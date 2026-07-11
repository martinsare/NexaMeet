import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, Sparkles, FileText, MessageSquare, Clock } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card, Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { meetings as meetingsApi } from "@/lib/backend";
import type { Meeting } from "@/lib/data/demo-data";
import { format } from "date-fns";

export default function Search() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Meeting[]>([]);
  const [searched, setSearched] = useState(false);

  async function onChange(value: string) {
    setQ(value);
    if (!value.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    const r = await meetingsApi.search(value);
    setResults(r);
    setSearched(true);
  }

  return (
    <AppShell title="Search">
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-void-400" />
          <Input
            autoFocus
            placeholder="Search meetings, participants, chat, transcripts, AI summaries…"
            className="h-13 pl-11 text-base"
            value={q}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="mt-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
            <TabsTrigger value="summaries">AI Summaries</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6 space-y-3">
            {!searched && <p className="text-center text-sm text-void-400">Start typing to search across everything.</p>}
            {searched && results.length === 0 && <p className="text-center text-sm text-void-400">No results for “{q}”.</p>}
            {results.map((m) => (
              <Card key={m.id} className="cursor-pointer p-5 hover:border-signal-400/50" onClick={() => navigate("/history")}>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">{m.title}</h4>
                  {m.aiSummary && <Badge variant="pulse"><Sparkles className="h-3 w-3" /> AI summary match</Badge>}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-void-400"><Clock className="h-3 w-3" /> {format(new Date(m.startAt), "MMM d, yyyy")}</p>
                {m.aiSummary && <p className="mt-2 text-sm text-void-300">{m.aiSummary.summary}</p>}
                <div className="mt-3 flex gap-3 text-xs text-void-500">
                  {m.hasTranscript && <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Transcript</span>}
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Chat</span>
                </div>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="meetings" className="mt-6 text-sm text-void-400">Filter results by meeting title and description.</TabsContent>
          <TabsContent value="transcripts" className="mt-6 text-sm text-void-400">Filter results by transcript content.</TabsContent>
          <TabsContent value="summaries" className="mt-6 text-sm text-void-400">Filter results by AI-generated summaries.</TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
