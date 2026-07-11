# NexaMeet

A video conferencing and meeting management web app built with React + Vite + TypeScript. Almost entirely frontend, with one small serverless function for issuing Daily.co call credentials — deployable to serverless platforms like Vercel.

## Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **UI components:** Radix UI primitives + custom shadcn-style components
- **Routing:** React Router v7
- **Animations:** Framer Motion, lottie-web (direct — bypasses lottie-react's React 19 incompatibility)
- **Forms:** React Hook Form + Zod
- **State/data:** TanStack Query. All real data (auth, meetings, notifications, profiles) is backed by **Supabase** — see below. There is no localStorage fallback for app data.
- **Video calls:** Daily.co (`@daily-co/daily-js`, call-object mode) — see "Real-time video (Daily.co)" below.

## Running the app

```bash
npm run dev
```

Runs on port 5000.

## Project structure

```
src/
  assets/          # Images and lottie JSON files
  components/
    app/           # AppShell (authenticated layout)
    brand/         # Logo
    lottie/        # PulseConnect, CheckmarkSuccess animations
    marketing/     # Nav, Footer
    ui/            # Button, Input, Card, Dialog, etc.
  lib/
    backend.ts     # Data abstraction layer (swap localStorage → Supabase here)
    auth-context.tsx
    data/
      demo-data.ts # All mock data — centralised for easy swap-out
  pages/           # Landing, Login, Signup, Dashboard, MeetingRoom, etc.
```

## Data layer

All data flows through `src/lib/backend.ts`. Auth and database operations use **Supabase** (`@supabase/supabase-js`). The Supabase client is initialised in `src/lib/supabase.ts` using two Replit Secrets:

| Secret | Where to find it |
|--------|-----------------|
| `VITE_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon / public key |

### Running the migration

Open your Supabase project → **SQL Editor → New query**, paste the contents of `supabase/migrations/001_initial.sql`, and click **Run**. This creates:

- `profiles` — one row per auth user, auto-populated by a trigger on sign-up
- `meetings` — scheduled, live, and ended meetings
- `meeting_participants` — join table linking users to meetings
- `notifications` — per-user notification rows

Row-Level Security (RLS) is enabled on every table: users can only read and write their own data.

### Guest sessions

Unauthenticated guests (via "Continue as guest") are a real, intentional feature — not a fallback for missing Supabase config. Their session is stored in `localStorage` under `nexameet.guest_session` since they don't have a Supabase account. They can join meeting rooms but cannot create or view persistent meetings.

## Real-time video (Daily.co)

Live audio/video/screen-share in `src/pages/MeetingRoom.tsx` runs on Daily.co's call-object SDK (`@daily-co/daily-js`), wrapped by the `useDailyCall` hook in `src/lib/use-daily-call.ts`. The custom UI (grid, chat, participants panel, controls) is kept — Daily only supplies the underlying media tracks and messaging.

- **Server-side room/token issuance:** `api/daily-room.ts` is a Vercel-style serverless function (`export default function handler(req, res)`) that creates/fetches a Daily room and mints a short-lived meeting token using the `DAILY_API_KEY` secret. This key never reaches the browser.
- **Local dev shim:** since this project has no persistent backend, `vite.config.ts` adds a dev-only middleware (`dailyApiDevShim`) that loads `api/daily-room.ts` via `server.ssrLoadModule` and serves it at `/api/daily-room` so `npm run dev` behaves like a Vercel deployment. No separate server process needed.
- **On Vercel:** `api/daily-room.ts` is picked up automatically as a serverless function. Set `DAILY_API_KEY` as a Vercel environment variable (Replit secrets do not carry over) — it must NOT be prefixed `VITE_` or it would be bundled into the client.
- **In-call chat and emoji reactions** are sent over Daily's `sendAppMessage` (broadcast to all participants), not just local UI state.
- **Known account requirement:** Daily's REST API (room/token creation) works on any plan, but actually joining a call currently fails with `account-missing-payment-method` until a payment method is added in the Daily.co dashboard (Billing). This is an account-level restriction on Daily's side, not a code issue.

## User preferences

- Almost no backend — Supabase for auth/data, one serverless function (`api/daily-room.ts`) for Daily.co credentials
- Supabase for auth and data persistence; no localStorage fallback for app data
- Landing page is locked to dark mode (ignores user theme preference)
