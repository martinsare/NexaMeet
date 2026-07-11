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

All data lives in `src/lib/data/demo-data.ts` and is accessed through `src/lib/backend.ts`. To connect Supabase: replace the `auth` and `meetings` implementations in `backend.ts` — no component changes needed.

## User preferences

- No backend/server — pure frontend, serverless-deployable
- Supabase integration planned for later (API key not yet set up)
- Demo data is centralised so it's easy to swap when Supabase is connected
