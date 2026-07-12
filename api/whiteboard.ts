/**
 * /api/whiteboard — whiteboard stroke persistence
 *
 * GET  /api/whiteboard?meetingId=…   all active strokes (for latecomers)
 * POST /api/whiteboard               save a stroke   { meetingId, strokeData, createdBySession }
 * POST /api/whiteboard/clear         clear meeting   { meetingId }
 * POST /api/whiteboard/:id/delete    soft-delete one stroke
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
  const parts = url.pathname.replace(/^\/api\/whiteboard\/?/, "").split("/").filter(Boolean);

  if (req.method === "GET") {
    const meetingId = url.searchParams.get("meetingId");
    if (!meetingId) return send(res, 400, { error: "meetingId required" });
    const { data, error } = await db()
      .from("meeting_whiteboard_strokes")
      .select("id, stroke_data, created_by_session, created_at")
      .eq("meeting_id", meetingId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });
    if (error) return send(res, 500, { error: error.message });
    return send(res, 200, { strokes: data });
  }

  if (req.method === "POST") {
    const body = await readBody(req);

    if (parts[0] === "clear") {
      const { meetingId } = body as { meetingId: string };
      await db().from("meeting_whiteboard_strokes").update({ is_deleted: true }).eq("meeting_id", meetingId);
      return send(res, 200, { ok: true });
    }

    if (parts[1] === "delete") {
      await db().from("meeting_whiteboard_strokes").update({ is_deleted: true }).eq("id", parts[0]);
      return send(res, 200, { ok: true });
    }

    // Save stroke
    const { meetingId, strokeData, createdBySession } = body as {
      meetingId: string; strokeData: unknown; createdBySession: string;
    };
    const { data, error } = await db().from("meeting_whiteboard_strokes")
      .insert({ meeting_id: meetingId, stroke_data: strokeData, created_by_session: createdBySession })
      .select("id").single();
    if (error) return send(res, 500, { error: error.message });
    return send(res, 201, { id: (data as { id: string }).id });
  }

  send(res, 405, { error: "Method not allowed" });
}
