/**
 * Serverless endpoint — audio -> transcript via Groq's hosted Whisper.
 * Vercel-style handler, shimmed into Vite dev via vite.config.ts.
 *
 * Accepts a raw audio body (any content-type Whisper supports, e.g.
 * audio/webm from the browser's MediaRecorder) and forwards it to Groq.
 * GROQ_API_KEY is server-only — never sent to the browser.
 */
import type { IncomingMessage, ServerResponse } from "node:http";

type Req = IncomingMessage;
type Res = ServerResponse;

function send(res: Res, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readRawBody(req: Req): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

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

  try {
    const audio = await readRawBody(req);
    if (audio.length < 1024) {
      send(res, 400, { error: "Audio payload is empty or too short to transcribe." });
      return;
    }

    const contentType = req.headers["content-type"] || "audio/webm";
    const ext = contentType.includes("ogg") ? "ogg" : contentType.includes("mp4") ? "mp4" : "webm";

    const form = new FormData();
    form.append("file", new Blob([audio], { type: contentType }), `meeting-audio.${ext}`);
    form.append("model", "whisper-large-v3-turbo");
    form.append("response_format", "verbose_json");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const data = await groqRes.json().catch(() => ({}));
    if (!groqRes.ok) {
      send(res, groqRes.status, { error: "Groq transcription failed", details: data });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const segments = ((data as any).segments ?? []).map((s: any) => ({
      start: s.start as number,
      end: s.end as number,
      text: (s.text as string).trim(),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send(res, 200, { transcript: (data as any).text ?? "", segments });
  } catch (err) {
    send(res, 500, { error: "Transcription request failed", details: String(err) });
  }
}
