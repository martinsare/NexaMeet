# NexaMeet

A video conferencing and meeting management web app built with React + Vite + TypeScript. Pure frontend — no server required, deployable to serverless platforms like Vercel.

## Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **UI components:** Radix UI primitives + custom shadcn-style components
- **Routing:** React Router v7
- **Animations:** Framer Motion, lottie-web (direct — bypasses lottie-react's React 19 incompatibility)
- **Forms:** React Hook Form + Zod
- **State/data:** TanStack Query + localStorage (Supabase-ready abstraction in `src/lib/backend.ts`)

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

Unauthenticated guests (via "Continue as guest") are still stored in `localStorage` under `nexameet.guest_session`. They don't have a Supabase account, so they can join meeting rooms but cannot create or view persistent meetings.

## User preferences

- No backend/server — pure frontend, serverless-deployable
- Supabase for auth and data persistence
- Landing page is locked to dark mode (ignores user theme preference)
