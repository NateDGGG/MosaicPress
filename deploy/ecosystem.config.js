// PM2 process file for running a Mosaic project on the VPS.
//
//   cd /srv/mosaic                      # your REMOTE_DIR
//   pm2 start deploy/ecosystem.config.js
//   pm2 save && pm2 startup             # survive reboots
//
// Edit REPO / PROJECT / PORT / ADMIN_URL below. `npm run start` launches the
// two-port server: public on PORT (3000), admin on PORT+1 (3001).
const REPO = "/srv/mosaic";
const PROJECT = "healthfreedomu";

module.exports = {
  apps: [
    {
      name: PROJECT,
      cwd: `${REPO}/projects/${PROJECT}`,
      script: "npm",
      args: "run start",
      autorestart: true,
      max_restarts: 10,
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: "3000",        // public :3000  ·  admin :3001 (PORT + 1)
        // External admin origin so cross-surface redirects are correct behind a
        // proxy. Match your nginx/Caddy admin host. Remove if admin isn't public.
        ADMIN_URL: "https://admin.example.com",
        // APP_URL, SESSION_SECRET, STRIPE_*, SMTP_* come from projects/<PROJECT>/.env
      },
    },
  ],
};
