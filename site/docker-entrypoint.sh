#!/bin/sh
set -e

echo "[entrypoint] provider=${DATABASE_PROVIDER:-sqlite}"
node scripts/set-provider.mjs
npx prisma generate >/dev/null 2>&1 || true

# Wait briefly for the database, then sync the schema.
echo "[entrypoint] applying schema (prisma db push)…"
ATTEMPTS=0
until npx prisma db push --skip-generate --accept-data-loss; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ "$ATTEMPTS" -ge 10 ]; then
    echo "[entrypoint] database not reachable after $ATTEMPTS attempts; exiting."
    exit 1
  fi
  echo "[entrypoint] db not ready, retrying in 3s ($ATTEMPTS/10)…"
  sleep 3
done

# Seed only on a fresh database (the seed is destructive, so guard it).
USERS=$(node scripts/count-users.mjs 2>/dev/null || echo 0)
if [ "$USERS" = "0" ]; then
  echo "[entrypoint] empty database — seeding…"
  npm run db:seed || echo "[entrypoint] seed skipped/failed (continuing)"
else
  echo "[entrypoint] $USERS users present — skipping seed."
fi

echo "[entrypoint] starting Next.js on :3000"
exec npx next start -p 3000
