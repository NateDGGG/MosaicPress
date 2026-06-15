#!/usr/bin/env bash
# One command to set up and run this project from a clean checkout.
# Idempotent: re-run any time. Pass a port with: PORT=3001 ./start.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$PROJECT_DIR/../.." && pwd)"
cd "$PROJECT_DIR"

# 1) Install workspace dependencies (hoisted to the repo root) the first time,
#    or whenever this project hasn't been linked into node_modules yet.
if [ ! -e "$REPO_ROOT/node_modules/@mosaic/project-healthfreedomu" ]; then
  echo "==> Installing dependencies (first run)…"
  (cd "$REPO_ROOT" && npm install)
fi

# 2) Generate the route tree, Prisma schema and global CSS from core.
echo "==> Syncing routes from core…"
npm run sync

# 3) Prisma client + database file.
echo "==> Preparing the database…"
npm run db:generate
npm run db:push

# 4) Seed an owner + defaults only if the database has no users yet.
NEED_SEED="$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(c=>{process.stdout.write(c===0?'yes':'no');return p.\$disconnect();}).catch(()=>process.stdout.write('yes'));")"
if [ "$NEED_SEED" = "yes" ]; then
  echo "==> Seeding owner + defaults…"
  npm run db:seed
else
  echo "==> Database already has data; skipping seed."
fi

# 5) Start the dev server.
echo ""
echo "==> Starting Healthfreedomu at http://localhost:${PORT:-3000}  (admin: /login)"
npm run dev
