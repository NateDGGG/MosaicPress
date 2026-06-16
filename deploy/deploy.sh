#!/usr/bin/env bash
#
# deploy.sh — push this repo to the production VPS, rebuild, and restart.
#
# Model: you develop locally and run the live site on a VPS. This script syncs
# your *source* up, then builds and restarts on the server. It deliberately does
# NOT overwrite the things that are authoritative on the live server:
#   • the database  (projects/<PROJECT>/data)         — your live content
#   • uploaded media (projects/<PROJECT>/public/uploads) — images added via the live admin
#   • the server's .env                                — production URL/secret/keys
#
# Usage (run from the repo root):
#   ./deploy/deploy.sh                 # sync source, build, restart
#   ./deploy/deploy.sh --with-uploads  # also push local uploads (additive, never deletes remote)
#   ./deploy/deploy.sh --pull-db       # download a timestamped backup of the live DB first
#   ./deploy/deploy.sh --dry-run       # show what rsync would do; make no changes
#   ./deploy/deploy.sh --help
#
# Configure via environment variables (or edit the defaults below):
#   SSH_HOST     ssh target, e.g. deploy@203.0.113.10
#   REMOTE_DIR   path to the repo on the VPS, e.g. /srv/mosaic
#   PROJECT      project folder under projects/, e.g. healthfreedomu
#   RESTART_CMD  command run on the VPS to restart the app (see notes at bottom)
#
set -euo pipefail

SSH_HOST="${SSH_HOST:-deploy@your-vps}"
REMOTE_DIR="${REMOTE_DIR:-/srv/mosaic}"
PROJECT="${PROJECT:-healthfreedomu}"
RESTART_CMD="${RESTART_CMD:-pm2 restart $PROJECT}"

WITH_UPLOADS=0
PULL_DB=0
DRY=""

for a in "$@"; do
  case "$a" in
    --with-uploads) WITH_UPLOADS=1 ;;
    --pull-db)      PULL_DB=1 ;;
    --dry-run)      DRY="--dry-run" ;;
    -h|--help)
      sed -n '2,31p' "$0"; exit 0 ;;
    *) echo "Unknown option: $a (try --help)"; exit 1 ;;
  esac
done

if [ "$SSH_HOST" = "deploy@your-vps" ]; then
  echo "!! Set SSH_HOST / REMOTE_DIR / PROJECT first (env vars or edit deploy/deploy.sh)."
  echo "   e.g.  SSH_HOST=deploy@1.2.3.4 REMOTE_DIR=/srv/mosaic PROJECT=healthfreedomu ./deploy/deploy.sh"
  exit 1
fi

# This script lives in deploy/, so the repo root is one level up.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Target: $SSH_HOST:$REMOTE_DIR   project: $PROJECT   ${DRY:+(dry run)}"

# 1) Optional: back up the live database to ./backups/ before doing anything.
if [ "$PULL_DB" = "1" ]; then
  ts="$(date +%Y%m%d-%H%M%S)"
  mkdir -p backups
  echo "==> Backing up live DB -> backups/dev-$ts.db"
  rsync -avz $DRY "$SSH_HOST:$REMOTE_DIR/projects/$PROJECT/data/dev.db" "backups/dev-$ts.db" \
    || echo "   (no remote DB found yet — skipping)"
fi

# 2) Sync source up. --delete keeps the remote in step with local, but the
#    excludes below are never created or deleted, so live data/media/.env survive.
echo "==> Syncing source…"
rsync -avz --delete $DRY \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'data' \
  --exclude 'public/uploads' \
  --exclude '.env' \
  --exclude 'backups' \
  --exclude '.DS_Store' --exclude '._*' \
  ./ "$SSH_HOST:$REMOTE_DIR/"

# 3) Optional: push local uploads up (additive — never removes server images).
if [ "$WITH_UPLOADS" = "1" ]; then
  echo "==> Syncing uploads (additive)…"
  rsync -avz $DRY \
    --exclude '.DS_Store' --exclude '._*' \
    "projects/$PROJECT/public/uploads/" \
    "$SSH_HOST:$REMOTE_DIR/projects/$PROJECT/public/uploads/"
fi

if [ -n "$DRY" ]; then
  echo "==> Dry run complete (no build/restart performed)."
  exit 0
fi

# 4) Install deps, regenerate from core, apply schema, and build — on the VPS.
echo "==> Building on the VPS…"
ssh "$SSH_HOST" bash -se <<EOF
set -euo pipefail
cd "$REMOTE_DIR"
npm install --include=dev          # build needs next/tailwind/typescript (dev deps)
cd "projects/$PROJECT"
npm run sync                        # regenerate routes + schema.prisma + globals.css from core
npm run db:generate                # Prisma client
npm run db:push                    # apply schema changes (does not wipe content)
npm run build                      # production build
EOF

# 5) Restart the running app.
echo "==> Restarting ($RESTART_CMD)…"
ssh "$SSH_HOST" "$RESTART_CMD"

echo "==> Deploy complete."

# -----------------------------------------------------------------------------
# Running the app persistently on the VPS (one-time setup; pick one):
#
#   PM2 (recommended):
#     cd $REMOTE_DIR/projects/$PROJECT
#     PORT=3000 pm2 start "npm run start" --name $PROJECT   # public :3000, admin :3001
#     pm2 save
#     # then RESTART_CMD="pm2 restart $PROJECT" (the default)
#
#   systemd:
#     create /etc/systemd/system/$PROJECT.service running `npm run start`
#     with WorkingDirectory=$REMOTE_DIR/projects/$PROJECT and Environment=PORT=3000
#     # then RESTART_CMD="sudo systemctl restart $PROJECT"
#
# Put a reverse proxy (nginx/Caddy) in front: proxy your domain -> :3000 (public)
# and, if you want remote admin, an admin host/path -> :3001. Set APP_URL in the
# server's .env to your real https domain. The first deploy assumes the repo is
# already cloned at $REMOTE_DIR with a production .env in projects/$PROJECT/.
# -----------------------------------------------------------------------------
