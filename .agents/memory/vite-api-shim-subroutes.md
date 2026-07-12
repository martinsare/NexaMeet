---
name: Vite API shim sub-routes
description: How to handle nested API paths like /api/polls/123/vote in the Vite dev-server shim.
---

The Vite config auto-discovers `/api/*.ts` files, but the original regex tested the **full path** (e.g. `polls/123/vote`) against `^[a-zA-Z0-9_-]+$` and rejected anything with slashes.

**Fix applied (vite.config.ts):**
```ts
const fullPath = req.url.split("?")[0]!.replace(/^\/api\//, "");
const routeName = fullPath.split("/")[0]!;  // only the first segment
if (!/^[a-zA-Z0-9_-]+$/.test(routeName)) return next();
// then load /api/${routeName}.ts
```

**Why:** Each API file (polls.ts, questions.ts, whiteboard.ts) receives the full `req.url` and parses sub-paths itself using `url.pathname.replace(/^\/api\/polls\/?/, "").split("/")`.

**How to apply:** Any new API file that needs sub-routes (e.g. `/api/foo/123/action`) should: (1) be named `api/foo.ts`, (2) strip its own prefix and split on "/" to get the action segments. No changes to vite.config.ts needed beyond what's already there.
