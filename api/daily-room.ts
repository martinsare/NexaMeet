/**
 * Serverless endpoint — Daily.co room + meeting token issuance.
 *
 * Vercel-style handler: `export default function handler(req, res)`.
 * DAILY_API_KEY never reaches the browser — it's read from server-side
 * environment only. Locally (Replit/Vite dev), this file is shimmed in via
 * a Vite middleware (see vite.config.ts) so `npm run dev` behaves the same
 * as a Vercel deployment without needing a separate server process.
 */
import type { IncomingMessage, ServerResponse } from "node:http";

type Req = IncomingMessage & { body?: unknown };
type Res = ServerResponse;

const DAILY_API = "https://api.daily.co/v1";

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

async function dailyFetch(path: string, apiKey: string, init?: RequestInit) {
  const res = await fetch(`${DAILY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    send(res, 405, { error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    send(res, 500, { error: "DAILY_API_KEY is not configured on the server." });
    return;
  }

  const body = await readJsonBody(req);
  const meetingId = String(body.meetingId ?? "").trim();
  const roomId = String(body.roomId ?? "").trim();
  const userName = String(body.userName ?? "Guest").trim() || "Guest";
  // hostId is the meeting owner's user ID. When provided, all participants of
  // the same meeting share one stable Daily room (the host's personal room)
  // rather than creating a new room per meeting record. Only the short-lived
  // token changes each session, which is effectively the "passcode".
  const hostId = String(body.hostId ?? "").trim();

  if (!meetingId) {
    send(res, 400, { error: "meetingId is required" });
    return;
  }

  // Use a stable personal room per host so repeated sessions reuse the same
  // Daily room. Fall back to meetingId-based name if hostId is unavailable.
  const roomKey = hostId || meetingId;
  const roomSuffix = roomId || "main";
  const roomName = `nexameet-user-${roomKey}-${roomSuffix}`.replace(/[^A-Za-z0-9_-]/g, "-");

  try {
    // 1. Get the room if it exists, otherwise create it.
    let room = await dailyFetch(`/rooms/${roomName}`, apiKey);
    if (!room.ok) {
      room = await dailyFetch("/rooms", apiKey, {
        method: "POST",
        body: JSON.stringify({
          name: roomName,
          privacy: "private",
          properties: {
            enable_chat: true,
            enable_screenshare: true,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4, // 4h expiry
          },
        }),
      });
      if (!room.ok) {
        // Two concurrent requests (e.g. React dev double-effect) can both try
        // to create the same room — the loser just re-fetches the winner's room.
        const info = String((room.data as { info?: string })?.info ?? "");
        if (info.includes("already exists")) {
          room = await dailyFetch(`/rooms/${roomName}`, apiKey);
        }
        if (!room.ok) {
          send(res, room.status, { error: "Failed to create Daily room", details: room.data });
          return;
        }
      }
    }

    // 2. Mint a short-lived meeting token scoped to this room + user.
    const token = await dailyFetch("/meeting-tokens", apiKey, {
      method: "POST",
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: userName,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
        },
      }),
    });
    if (!token.ok) {
      send(res, token.status, { error: "Failed to create meeting token", details: token.data });
      return;
    }

    const roomData = room.data as { url: string };
    const tokenData = token.data as { token: string };
    send(res, 200, { url: roomData.url, token: tokenData.token });
  } catch (err) {
    send(res, 500, { error: "Daily API request failed", details: String(err) });
  }
}
