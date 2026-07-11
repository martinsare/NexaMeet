---
name: NexaMeet serverless integrations
description: How Daily.co and Supabase are wired into this pure-frontend Vite app, and constraints discovered while setting them up.
---

## Daily.co (WebRTC)
Sensitive API keys for third-party services (e.g. Daily.co) must never be prefixed `VITE_` or referenced from client code — they'd be bundled into the browser. For a Vite app with no persistent backend that still needs a secret-holding endpoint, the pattern used here: a Vercel-style `api/<name>.ts` file exporting `handler(req, res)`, plus a Vite `configureServer` middleware that loads it via `server.ssrLoadModule` so `npm run dev` behaves the same as the eventual serverless deploy (no separate server process needed locally).

**Why:** keeps the "pure frontend, deploy to Vercel" architecture intact while still hiding secrets server-side.

**How to apply:** when a project needs a secret-gated API call but has no backend and targets serverless hosting (Vercel), reach for this pattern before adding a persistent Express server.

Daily-specific gotcha: their REST API (create room/token) can succeed with a valid key even when the *account* is blocked from actually joining calls — join fails client-side with `account-missing-payment-method` until a payment method is added in the Daily dashboard. Room creation succeeding is not proof that live calls will work.

Also: creating a Daily room by name races under React dev double-effects/HMR remounts — a "GET room, else POST create" flow needs to treat a create-time "already exists" error as success and re-fetch, not as a hard failure.

## Supabase
No Supabase CLI/project-link access is available from this environment — only the browser-usable URL + anon key (via Replit secrets). Deploying or configuring Supabase Edge Functions (which would need `supabase secrets set` + CLI login) is not possible without the user doing it themselves or granting CLI credentials.

**Why:** avoids assuming Edge Functions are a viable delivery path for secret-gated logic in Supabase-backed Replit projects.

**How to apply:** if a task calls for server-side logic in a Supabase-backed frontend-only project, default to a Vercel-style `/api` serverless function (see above) rather than proposing Supabase Edge Functions, unless the user confirms they can supply CLI/deploy access.

## Verifying third-party API keys (Groq and similar)
When a newly-set secret still causes "invalid API key" from a provider, curl the provider's API directly with that env var (e.g. `curl provider.com/v1/models -H "Authorization: Bearer $KEY"`) before assuming a code bug — it isolates whether the key itself is bad vs. a request-shape issue. Also, after a secret is updated, the running dev workflow must be restarted before it picks up the new value — retesting against the stale process gives a false "still invalid" result.

**Why:** repeatedly saved time diagnosing a Groq key that was actually invalid/stale on the provider side, and once avoided a false-negative retest caused by not restarting the workflow after the secret was replaced.

**How to apply:** any time a freshly-provided API key is rejected, verify directly against the provider first, and restart the app workflow before re-testing after a secret change.
