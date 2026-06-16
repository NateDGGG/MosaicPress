# Deploying to a VPS

Model: you develop locally and run the live site on a VPS. Code is pushed up and
rebuilt; the **live database, uploaded media, and the server's `.env` are never
overwritten** by a deploy.

## One-time server setup

```bash
# on the VPS
git clone <your-repo-url> /srv/mosaic && cd /srv/mosaic
npm install
cd projects/<project>

# production env: set your real domain + a strong secret + any Stripe/SMTP keys
cp .env .env.bak && nano .env        # set APP_URL=https://example.com, SESSION_SECRET=..., etc.

npm run setup                        # sync from core + prisma generate/push + seed (first run only)
```

Run it persistently with **PM2** (uses `deploy/ecosystem.config.js`):

```bash
cd /srv/mosaic
# edit deploy/ecosystem.config.js: REPO, PROJECT, PORT, ADMIN_URL
pm2 start deploy/ecosystem.config.js
pm2 save && pm2 startup              # restart on reboot
```

`npm run start` serves the **public site on `PORT` (3000)** and the **admin on
`PORT + 1` (3001)**.

## Reverse proxy + HTTPS

Put nginx or Caddy in front (templates in `deploy/`):

- **nginx:** `deploy/nginx.conf.example` → public domain → `:3000`, `admin.example.com` → `:3001`. HTTPS via `certbot --nginx`.
- **Caddy:** `deploy/Caddyfile.example` → same mapping, automatic HTTPS.

Then make redirects proxy-aware:
- `projects/<project>/.env` → `APP_URL=https://example.com`
- pm2 env → `ADMIN_URL=https://admin.example.com`

> **Don't want the admin on the public internet?** Omit the admin proxy block and
> reach it over an SSH tunnel: `ssh -L 3001:127.0.0.1:3001 you@vps` → `http://localhost:3001/admin`.
> (Note: when admin is on a separate subdomain, its login session is scoped to
> that subdomain — fine for staff admin. If you rely on **member accounts on the
> public site**, keep those on the public domain.)

## Deploying updates

From your local machine:

```bash
SSH_HOST=deploy@1.2.3.4 REMOTE_DIR=/srv/mosaic PROJECT=<project> ./deploy/deploy.sh
```

`deploy/deploy.sh` rsyncs source up (excluding `node_modules`, `.next`, `data`,
`public/uploads`, `.env`), then on the server runs install → `npm run sync` →
`db:generate` → `db:push` → `build`, and restarts via PM2.

Useful flags:
- `--pull-db` — download a timestamped backup of the live DB to `./backups/` first (recommended before every deploy).
- `--with-uploads` — additively push local uploads up (never deletes server images).
- `--dry-run` — preview the rsync, change nothing.

## Notes & cautions

- **`db:push` applies schema changes in place.** It's safe for additive changes
  but a destructive schema change could drop a column on the live DB — keep the
  `--pull-db` backups.
- **SQLite is fine for small/medium sites.** For higher traffic or easier backups,
  switch to Postgres: set `DATABASE_PROVIDER=postgresql` + a Postgres `DATABASE_URL`
  in `.env`, run `npm run db:provider && npx prisma db push`.
- **First deploy** assumes the repo is already cloned at `REMOTE_DIR` with a
  production `.env`; `deploy.sh` intentionally won't overwrite `.env`.
