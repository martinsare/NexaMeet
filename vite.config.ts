import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Dev-only shim for the Vercel-style serverless functions under `api/*.ts`
 * (daily-room, transcribe, summarize, …). Lets `npm run dev` behave like a
 * Vercel deployment (single command, no separate server process) without
 * changing the production handlers. Any request to /api/<name> is routed to
 * api/<name>.ts's default export, loaded live through Vite's module graph.
 */
function apiDevShim(): Plugin {
  return {
    name: "api-dev-shim",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const routeName = req.url.split("?")[0]!.replace(/^\/api\//, "");
        if (!/^[a-zA-Z0-9_-]+$/.test(routeName)) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${routeName}.ts`);
          await mod.default(req, res);
        } catch (err) {
          server.config.logger.error(String(err));
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Internal error" }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevShim()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
  },
});
