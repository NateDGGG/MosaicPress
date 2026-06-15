#!/usr/bin/env node
// Two-surface launcher: serve the PUBLIC site and the ADMIN on separate ports.
//
//   node ../../core/scripts/serve.mjs dev     # next dev  (used by `npm run dev`)
//   node ../../core/scripts/serve.mjs start   # next start (used by `npm run start`)
//
// Next itself runs on a private internal port; two tiny reverse proxies sit in
// front of it:
//   • PUBLIC_PORT  (default 3000)      → the public site. `/admin*` is redirected
//                                         to the admin port, so admin never shows
//                                         up on the public surface.
//   • ADMIN_PORT   (default PORT+1)    → the admin. Anything that isn't an admin
//                                         path is redirected to `/admin`.
//
// Override with PORT (public) and optionally ADMIN_PORT. Cookies are not
// port-specific, so a session set on one port works on the other (same host).
//
// Note: this is for local dev and node self-hosting. On platforms that give you a
// single port (e.g. Vercel) these scripts aren't used and the admin stays at
// `/admin` on the one port — which still works.
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";

const mode = process.argv[2] === "start" ? "start" : "dev";
const PUBLIC_PORT = Number(process.env.PORT || 3000);
const ADMIN_PORT = Number(process.env.ADMIN_PORT || PUBLIC_PORT + 1);

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// Paths that belong to the admin surface (everything else on the admin port is
// bounced to /admin). Static assets and APIs must pass so admin pages render.
const isAdminPath = (p) =>
  p === "/admin" ||
  p.startsWith("/admin/") ||
  p.startsWith("/api/") ||
  p === "/login" ||
  p.startsWith("/_next/") ||
  p.startsWith("/uploads/") ||
  p === "/favicon.ico" ||
  p === "/robots.txt" ||
  p.startsWith("/sitemap") ||
  /\.[a-zA-Z0-9]+$/.test(p); // any file with an extension (css/js/images)

const hostOf = (req) => (req.headers.host || "localhost").split(":")[0];

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

// A reverse proxy to the internal Next server. `decide(req,res)` may send a
// redirect and return true to short-circuit; otherwise the request is forwarded.
function makeProxy(targetPort, decide) {
  const server = http.createServer((req, res) => {
    if (decide(req, res)) return;
    const fwd = http.request(
      { host: "127.0.0.1", port: targetPort, method: req.method, path: req.url, headers: req.headers },
      (up) => {
        res.writeHead(up.statusCode || 502, up.headers);
        up.pipe(res);
      }
    );
    fwd.on("error", () => {
      if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
      res.end("Upstream not ready yet — the dev server may still be starting. Refresh in a moment.");
    });
    req.pipe(fwd);
  });
  // Forward WebSocket upgrades (Next dev HMR).
  server.on("upgrade", (req, socket, head) => {
    const up = net.connect(targetPort, "127.0.0.1", () => {
      const headers = Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n");
      up.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers}\r\n\r\n`);
      if (head && head.length) up.write(head);
      socket.pipe(up);
      up.pipe(socket);
    });
    up.on("error", () => socket.destroy());
    socket.on("error", () => up.destroy());
  });
  return server;
}

const internalPort = await getFreePort();

const child = spawn("npx", ["next", mode, "-p", String(internalPort), "-H", "127.0.0.1"], {
  stdio: "inherit",
  env: { ...process.env, PORT: String(internalPort) },
});
const shutdown = () => {
  try { child.kill("SIGTERM"); } catch {}
  process.exit();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
child.on("exit", (code) => process.exit(code ?? 0));

// Public surface: keep admin off it.
const publicSrv = makeProxy(internalPort, (req, res) => {
  const path = (req.url || "/").split("?")[0];
  if (path === "/admin" || path.startsWith("/admin/")) {
    redirect(res, `http://${hostOf(req)}:${ADMIN_PORT}${req.url}`);
    return true;
  }
  return false;
});

// Admin surface: only admin paths; bounce everything else to /admin.
const adminSrv = makeProxy(internalPort, (req, res) => {
  const path = (req.url || "/").split("?")[0];
  if (!isAdminPath(path)) {
    redirect(res, `http://${hostOf(req)}:${ADMIN_PORT}/admin`);
    return true;
  }
  return false;
});

publicSrv.listen(PUBLIC_PORT);
adminSrv.listen(ADMIN_PORT, () => {
  console.log(`\n  ▸ Public site:  http://localhost:${PUBLIC_PORT}`);
  console.log(`  ▸ Admin:        http://localhost:${ADMIN_PORT}/admin`);
  console.log(`    (Next is running internally on port ${internalPort}.)\n`);
});
