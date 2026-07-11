import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Dev-only shim for the Vercel-style serverless function in `api/daily-room.ts`.
 * Lets `npm run dev` behave like a Vercel deployment (single command, no
 * separate server process) without changing the production handler.
 */
function dailyApiDevShim(): Plugin {
  return {
    name: "daily-api-dev-shim",
    configureServer(server) {
      server.middlewares.use("/api/daily-room", async (req, res) => {
        try {
          const mod = await server.ssrLoadModule("/api/daily-room.ts");
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
  plugins: [react(), dailyApiDevShim()],
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
