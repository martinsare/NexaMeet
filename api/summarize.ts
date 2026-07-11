/**
 * Serverless endpoint — transcript -> structured AI meeting summary via
 * Groq's hosted LLM. Vercel-style handler, shimmed into Vite dev via
 * vite.config.ts. GROQ_API_KEY is server-only — never sent to the browser.
 *
 * Output shape matches `Meeting["aiSummary"]` in src/lib/types.ts:
 *   { summary, decisions[], actionItems[{task, owner, done}], highlights[] }
 */
import type { IncomingMessage, ServerResponse } from "node:http";

type Req = IncomingMessage & { body?: unknown };
type Res = ServerResponse;

function send(res: Res, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: Req): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const SYSTEM_PROMPT = `You are an assistant that turns a raw meeting transcript into structured notes.
Respond with ONLY a JSON object of this exact shape, no prose, no markdown fences:
{
  "summary": "2-4 sentence plain-English summary of what the meeting was about",
  "decisions": ["short decision 1", "short decision 2"],
  "actionItems": [{ "task": "what needs to be done", "owner": "person or team responsible, or 'Unassigned' if unclear", "done": false }],
  "highlights": ["short notable quote or moment", "..."]
}
If the transcript is too short or empty to extract meaningful content, still return valid JSON with your best-effort (possibly empty arrays) rather than an error.`;

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    send(res, 405, { error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    send(res, 500, { error: "GROQ_API_KEY is not configured on the server." });
    return;
  }

  const body = await readJsonBody(req);
  const transcript = String(body.transcript ?? "").trim();
  if (!transcript) {
    send(res, 400, { error: "transcript is required" });
    return;
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Transcript:\n\n${transcript}` },
        ],
      }),
    });

    const data = await groqRes.json().catch(() => ({}));
    if (!groqRes.ok) {
      send(res, groqRes.status, { error: "Groq summarization failed", details: data });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = (data as any).choices?.[0]?.message?.content ?? "{}";
    let parsed: {
      summary?: string;
      decisions?: string[];
      actionItems?: { task: string; owner: string; done: boolean }[];
      highlights?: string[];
    };
    try {
      parsed = JSON.parse(content);
    } catch {
      send(res, 502, { error: "Groq returned non-JSON summary", details: content });
      return;
    }

    send(res, 200, {
      summary: parsed.summary ?? "",
      decisions: parsed.decisions ?? [],
      actionItems: parsed.actionItems ?? [],
      highlights: parsed.highlights ?? [],
    });
  } catch (err) {
    send(res, 500, { error: "Summarization request failed", details: String(err) });
  }
}
