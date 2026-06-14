# Mosaic

A self-hostable, all-in-one multimedia CMS. Articles, video, shopping, and links —
**hosted by you or linked from anywhere — rendered side-by-side in the same format.**

> "Mosaic" is the default name and is fully configurable in **Admin → Settings**.
> (The project folder is still `mosaic` from earlier; rename it freely.)

This is a working implementation covering Phase 0 + 1 **and** the later-phase systems:
the unified content model with the hosted/external **source axis**, URL ingestion, the
public site, a full admin, **auth & roles, media uploads (local or S3), Stripe checkout &
orders, transactional email with digital delivery, subscriptions/memberships with content
gating, a block-based WYSIWYG article editor, full-text search, scheduled publishing,
multi-theme packages, a sync/link-health worker, a PostgreSQL + Docker deploy path, and a
Vitest unit-test suite**.

> New here? Do the **[CODELAB.md](CODELAB.md)** hands-on tutorial, or read
> **[CODEBASE_GUIDE.md](CODEBASE_GUIDE.md)** for a full architecture tour.

## Quick start

```bash
cd site
npm install
cp .env.example .env     # then edit secrets (a default .env is also included)
npm run setup            # prisma generate + db push + seed demo content & users
npm run dev              # http://localhost:3000
```

> Requires Node 18.17+ (Node 20+ recommended).

### Default logins (from the seed)

| Role | Email | Password | Can… |
|---|---|---|---|
| Owner | `owner@example.com` | `changeme123` | everything: settings, users, sync, orders |
| Editor | `editor@example.com` | `editor123` | publish content, view orders |
| Contributor | `writer@example.com` | `writer123` | create/edit drafts only |

Change these immediately. Owner credentials come from `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`.

## What to try

1. **The core thesis.** `/collections/getting-started` — every card uses the same layout.
   Hosted items say *Read / Watch / Buy*; external items show the source (YouTube,
   Wikipedia, Amazon, MDN) and say *Read on … / Watch on … / Buy on … ↗*.
2. **Ingest a link.** Admin → **New from link** → paste a URL → auto-detect + metadata →
   review → publish. It renders next to hosted content.
3. **Buy something.** Open a hosted product → **Add to cart** → **Cart** → **Checkout**.
   Without Stripe keys it runs in **stub mode** (no charge) and still produces a real order.
4. **Configure the site.** Admin → **Settings** → change the name, colors, theme. Applies site-wide.
5. **Manage people.** Admin → **Users** (owner only) → add editors/contributors.
6. **Watch link health.** Admin → **Health** → **Run sync now** → external items get
   re-checked (dead links flagged, prices refreshed).
7. **Upload media.** Admin → **Media** → drag in images/PDFs, reuse as cover images.

## Systems & where they live

| System | Key files |
|---|---|
| Unified content model (`type` × `source`) | `prisma/schema.prisma`, `src/lib/types.ts` |
| Ingestion (oEmbed → OG/schema.org → scrape) + SSRF guards | `src/lib/ingest.ts` |
| Unified card / item page | `src/components/ItemCard.tsx`, `src/app/i/[slug]` |
| **Auth & roles** (scrypt + signed-cookie sessions) | `src/lib/auth.ts`, `src/app/login`, `src/app/api/auth/*` |
| **Settings & theming** (runtime CSS variables) | `src/lib/settings.ts`, `src/app/admin/settings`, root `layout.tsx` |
| **Media uploads** (local store, pluggable) | `src/lib/media.ts`, `src/app/api/media`, `src/app/admin/media` |
| **Commerce** (Stripe + stub fallback, cart, orders) | `src/lib/payments.ts`, `src/lib/cart.ts`, `src/app/cart`, `src/app/checkout/*`, `src/app/admin/orders` |
| **Email + digital delivery** (SMTP + stub, signed downloads) | `src/lib/email.ts`, `src/lib/download.ts`, `src/app/api/download` |
| **Memberships** (plans, subscriptions, content gating) | `src/lib/membership.ts`, `src/app/membership`, `src/app/account`, `src/app/admin/plans` |
| **Block + WYSIWYG editor** | `src/lib/blocks.ts`, `src/components/BlockEditor.tsx`, `src/components/RichTextField.tsx`, `src/lib/sanitize.ts` |
| **Full-text search** | `src/lib/search.ts`, `src/app/search`, `src/app/api/search` |
| **Scheduled publishing** | `src/lib/schedule.ts`, `scripts/publish-due.ts` |
| **Media storage** (local or S3) | `src/lib/media.ts` |
| **Multi-theme packages** | `src/lib/themes.ts`, `src/components/SettingsForm.tsx`, root `layout.tsx` |
| **Sync / link-health worker** | `src/lib/sync.ts`, `scripts/sync.ts`, `src/app/api/sync`, `src/app/admin/health` |
| **Deploy** (Docker + Postgres) | `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh`, `scripts/set-provider.mjs` |
| **Unit tests** | `tests/`, `vitest.config.ts` |

## Roles

Enforced at the API (not just the UI). Hierarchy: `contributor < editor < owner`.
Contributors create/edit drafts; editors publish and see orders; owners manage settings,
users, and sync.

## Commerce notes

- Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` to enable real Stripe Checkout.
  Point a Stripe webhook at `POST /api/webhooks/stripe` (event `checkout.session.completed`).
- With no keys, checkout runs in **stub mode**: orders are created and marked fulfilled via
  `/api/checkout/stub-complete` so you can develop the full flow safely.
- Only **hosted** products go through checkout; **external** products link out to their source.
- Prices are always recomputed server-side from the DB — never trusted from the client.

## Email & digital delivery

Order fulfillment sends a receipt and delivers digital products via **signed,
order-scoped download links** (`/api/download`) — links are HMAC-tied to the order and
re-checked against order status, so they can't be guessed or reused for other items.

- Set `SMTP_HOST` (+ `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`) to send real mail.
- With no SMTP config, email runs in **stub mode**: messages are logged, not sent, so the
  whole flow is testable locally.

## Deploy with Docker + PostgreSQL

```bash
docker compose up --build      # app on http://localhost:3000, Postgres alongside
```

Compose builds the app image (targeting PostgreSQL), starts Postgres with a persistent
volume, waits for it to be healthy, applies the schema, seeds on first run only, and
starts the server. Media uploads persist in a named volume.

**How the provider switch works:** Prisma can't read its `provider` from an env var, so
`scripts/set-provider.mjs` rewrites the schema's `provider` from `DATABASE_PROVIDER`
(`sqlite` default, `postgresql` in Docker) before generate/push. To run Postgres without
Docker:

```bash
export DATABASE_PROVIDER=postgresql
export DATABASE_URL="postgresql://user:pass@localhost:5432/mosaic?schema=public"
npm run db:provider && npx prisma generate && npx prisma db push && npm run db:seed
npm run build && npm start
```

The schema is provider-agnostic; the same models run on SQLite and PostgreSQL (verified
end-to-end on both).

## Media storage (local or S3)

Uploads use a pluggable backend (`src/lib/media.ts`). Default is the local filesystem
(`public/uploads`). Set `MEDIA_BACKEND=s3` plus the `S3_*` env vars to store on AWS S3 or
any S3-compatible service (Cloudflare R2, MinIO, DigitalOcean Spaces) — set `S3_ENDPOINT`
(and usually `S3_FORCE_PATH_STYLE=true`) for non-AWS providers.

## Themes

Pick a packaged theme (Classic, Editorial, Midnight, Sunrise) at **Admin → Settings** —
each bundles a color palette, light/dark mode, and typography, applied site-wide via CSS
variables. Individual colors and font can still be fine-tuned. Add themes in
`src/lib/themes.ts`.

## Tests

```bash
npm test            # run the Vitest unit suite once
npm run test:watch  # watch mode
```

Covers the pure logic: the type/source action model, color helpers, auth (password
hashing, session signing, role hierarchy), block parsing, signed downloads, SSRF guards,
receipt rendering, slug/price/duration formatting, and the theme registry.

## Search & scheduled publishing

Full-text search ranks published items across title, summary, author, source, and article
body — `/search` (page) and `/api/search?q=` (JSON). Scheduled publishing: set an item to
**scheduled** with a future time in the editor; it stays hidden until due. Flip due items
with `npm run publish:due` (cron, e.g. every minute) — it also runs inside `POST /api/sync`.

## Background sync

Re-fetches external metadata, flags dead/paywalled links, and detects product price drift.

```bash
npm run sync          # one-off; schedule via cron, e.g. hourly:
# 0 * * * *  cd /path/to/app && npm run sync
```

Or trigger from **Admin → Health → Run sync now** (owner), or `POST /api/sync`.

## Configuration (`.env`)

| Var | Purpose |
|---|---|
| `DATABASE_URL` | SQLite by default; swap to PostgreSQL by changing the Prisma `datasource`. |
| `APP_URL` | Public base URL (Stripe redirects, sync). |
| `SESSION_SECRET` | Signs session cookies — set a strong random value. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Enable real payments. |
| `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` | First owner account. |

## Security

- Passwords hashed with scrypt; sessions are HMAC-signed httpOnly cookies.
- API authorization is role-checked server-side.
- Outbound fetching (ingestion + sync) blocks private/internal addresses (SSRF) and caps size/time.
- External items use canonical tags to their source and attribution + outbound links
  (no wholesale republishing).

## Not yet built (future)

Collaborative editing, content versioning/revisions, and a richer analytics dashboard.
The data model and provider interfaces leave room for each.
