# Healthfreedomu

A site built on **Mosaic**. This is a thin project that shares the Mosaic core
(`../../core`); its pages, API routes, database schema and base styles are
generated from core by `npm run sync`.

## Quick start

```bash
cd projects/healthfreedomu
./start.sh
```

That installs dependencies (first run), generates the routes/schema from core,
creates the database, seeds an owner account, and starts the dev server at
http://localhost:3000. Sign in at `/login` with the credentials printed at the
end of seeding (default `owner@example.com` / `changeme123` — change these in
`.env` before first run for anything real).

Prefer npm scripts? `npm run setup && npm run dev` does the same (minus the
dependency install, which you run once with `npm install` at the repo root).

## What's mine to edit

- `.env` — site URL, session secret, seed owner, Stripe/SMTP keys.
- `prisma/seed.ts` — starter data for a fresh database.
- `src/app/layout.tsx` — the root layout (kept; not overwritten by sync).
- Any generated route can be customized: copy it from core into the same path
  here and add a `// MOSAIC:OVERRIDE` comment so `sync` leaves it alone.

Everything else (routes, `schema.prisma`, `src/app/globals.css`) is regenerated
by `npm run sync` — don't hand-edit those unless you mark them as overrides.
