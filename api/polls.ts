/**
 * /api/polls — in-meeting polls
 *
 * GET  /api/polls?meetingId=…          list polls + votes for a meeting
 * POST /api/polls                       create a poll  { meetingId, question, options, createdByName }
 * POST /api/polls/:id/vote              cast a vote     { voterSession, optionId }
 * POST /api/polls/:id/end              end a poll (host)
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";

type Req = IncomingMessage & { body?: unknown };
type Res = ServerResponse;

function send(res: Res, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req: Req): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function db() {
  return createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
}

export default async function handler(req: Req, res: Res) {
  const url = new URL(req.url!, "http://localhost");
  // pathParts strips /api/polls → [""] then removes empties
  const parts = url.pathname.replace(/^\/api\/polls\/?/, "").split("/").filter(Boolean);
  // parts[0] = poll id (if present), parts[1] = action ("vote" | "end")

  if (req.method === "GET") {
    const meetingId = url.searchParams.get("meetingId");
    if (!meetingId) return send(res, 400, { error: "meetingId required" });
    const { data, error } = await db()
      .from("meeting_polls")
      .select("*, votes:meeting_poll_votes(*)")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true });
    if (error) return send(res, 500, { error: error.message });
    return send(res, 200, { polls: data });
  }

  if (req.method === "POST") {
    const body = await readBody(req);

    if (parts[1] === "vote") {
      const { voterSession, optionId } = body as { voterSession: string; optionId: string };
      const { error } = await db().from("meeting_poll_votes").upsert(
        { poll_id: parts[0], voter_session: voterSession, option_id: optionId },
        { onConflict: "poll_id,voter_session" }
      );
      if (error) return send(res, 500, { error: error.message });
      return send(res, 200, { ok: true });
    }

    if (parts[1] === "end") {
      const { error } = await db().from("meeting_polls")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", parts[0]);
      if (error) return send(res, 500, { error: error.message });
      return send(res, 200, { ok: true });
    }

    // Create poll
    const { meetingId, question, options, createdByName } = body as {
      meetingId: string; question: string;
      options: Array<{ id: string; text: string }>; createdByName: string;
    };
    const { data, error } = await db().from("meeting_polls")
      .insert({ meeting_id: meetingId, question, options, created_by_name: createdByName })
      .select().single();
    if (error) return send(res, 500, { error: error.message });
    return send(res, 201, { poll: data });
  }

  send(res, 405, { error: "Method not allowed" });
}
