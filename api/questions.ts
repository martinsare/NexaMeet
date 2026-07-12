/**
 * /api/questions — in-meeting Q&A
 *
 * GET  /api/questions?meetingId=…       list questions + upvote counts
 * POST /api/questions                    ask a question  { meetingId, text, askedByName, askedBySession }
 * POST /api/questions/:id/upvote         upvote          { voterSession }
 * POST /api/questions/:id/answer         mark answered   (host)
 * POST /api/questions/:id/dismiss        dismiss/hide    (host)
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
  const parts = url.pathname.replace(/^\/api\/questions\/?/, "").split("/").filter(Boolean);

  if (req.method === "GET") {
    const meetingId = url.searchParams.get("meetingId");
    if (!meetingId) return send(res, 400, { error: "meetingId required" });
    const { data, error } = await db()
      .from("meeting_questions")
      .select("*, upvotes:meeting_question_upvotes(voter_session)")
      .eq("meeting_id", meetingId)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: true });
    if (error) return send(res, 500, { error: error.message });
    return send(res, 200, { questions: data });
  }

  if (req.method === "POST") {
    const body = await readBody(req);

    if (parts[1] === "upvote") {
      const { voterSession } = body as { voterSession: string };
      await db().from("meeting_question_upvotes").upsert(
        { question_id: parts[0], voter_session: voterSession },
        { onConflict: "question_id,voter_session" }
      );
      return send(res, 200, { ok: true });
    }

    if (parts[1] === "answer") {
      await db().from("meeting_questions").update({ is_answered: true }).eq("id", parts[0]);
      return send(res, 200, { ok: true });
    }

    if (parts[1] === "dismiss") {
      await db().from("meeting_questions").update({ is_dismissed: true }).eq("id", parts[0]);
      return send(res, 200, { ok: true });
    }

    // Create question
    const { meetingId, text, askedByName, askedBySession } = body as {
      meetingId: string; text: string; askedByName: string; askedBySession: string;
    };
    const { data, error } = await db().from("meeting_questions")
      .insert({ meeting_id: meetingId, text, asked_by_name: askedByName, asked_by_session: askedBySession })
      .select().single();
    if (error) return send(res, 500, { error: error.message });
    return send(res, 201, { question: data });
  }

  send(res, 405, { error: "Method not allowed" });
}
