# Mosaic Codelab — Build, run, and extend your own multimedia site

A hands-on tour. By the end you'll have Mosaic running locally and will have published
content, pulled in content from the web, sold a product, gated content behind a membership,
searched, scheduled a post, re-themed the site, run the tests, and deployed with Docker.
Each step ends with a **✅ Checkpoint** (what you should see) and an **🔍 Under the hood**
pointer to the code that made it happen.

- **Audience:** developers comfortable with a terminal and JavaScript/TypeScript.
- **Time:** ~45–60 minutes.
- **Prerequisites:** Node 18.17+ (20+ recommended). Docker only for the last step.

> Tip: keep `CODEBASE_GUIDE.md` open in another tab — the "Under the hood" notes reference it.

---

## Step 0 — Run it locally

```bash
cd site
npm install
cp .env.example .env      # a working .env is already included; this is the template
npm run setup             # prisma generate + db push + seed demo content/users/plans
npm run dev               # http://localhost:3000
```

**✅ Checkpoint:** `http://localhost:3000` shows a hero and a grid of cards.

**🔍 Under the hood:** `npm run setup` runs Prisma against SQLite (`prisma/schema.prisma`)
and `prisma/seed.ts`. The home page (`src/app/page.tsx`) is a server component that queries
the database directly — no API hop for reads (guide §3).

---

## Step 1 — See the core idea: hosted vs external, side by side

Open **Getting Started** in the nav (`/collections/getting-started`).

Notice every card looks the same, but the action differs: hosted items say *Read / Watch /
Buy*; external ones show their source and say *Read on Wikipedia →*, *Watch on YouTube ▸*,
*Buy on Amazon →*. One card has a 🔒 **Members** badge.

**✅ Checkpoint:** a single grid mixing your content and the web's, in one format.

**🔍 Under the hood:** this is the whole product thesis. An `Item` has two axes — `type`
(what it is) and `source` (where it lives). Rendering keys on `type`; only the action keys
on `source`. See `src/components/ItemCard.tsx` and `src/lib/types.ts#actionLabel` (guide §1, §8).

---

## Step 2 — Sign in to the admin

Click **Sign in** (top right) and use the seeded owner:

```
owner@example.com  /  changeme123
```

You land in the admin. Note the nav: Content, Media, Health, Orders, and (owner-only)
Plans, Settings, Users.

**✅ Checkpoint:** the admin dashboard lists all items with type/source/status.

**🔍 Under the hood:** auth is a scrypt-hashed password + an HMAC-signed cookie
(`src/lib/auth.ts`, pure parts in `auth-core.ts`). The admin layout redirects anyone who
isn't staff (guide §9). Two more seeded logins exist: `editor@example.com / editor123` and
`writer@example.com / writer123` — try them later to see role limits.

---

## Step 3 — Write an article with the WYSIWYG block editor

Admin → **+ New** → pick **article**, give it a title, **Create draft**. You're now in the
editor. In the **Body** section click **+ Paragraph**, type some text, select a few words,
and hit **B** (bold) or **🔗** (link). Add a **+ Heading**, a **+ List**, and an **+ Image**
(use the Upload button). Then **Save & publish**.

**✅ Checkpoint:** open the article from the homepage — your formatting renders, with the
heading, list, and image.

**🔍 Under the hood:** the body is a JSON array of typed blocks
(`src/lib/blocks.ts`). Paragraph/quote blocks use a `contentEditable` rich-text field
(`src/components/RichTextField.tsx`); the output HTML is allowlist-sanitized at render time
by `src/lib/sanitize.ts` inside `BlockRenderer.tsx` (guide §10). Try typing
`<script>alert(1)</script>` into a paragraph — it's stripped on render.

---

## Step 4 — Pull in content from the web

Admin → **+ New from link** → paste a URL, e.g. a YouTube video or a news article →
**Fetch**. Mosaic detects the type and pulls the title, image, and summary. Edit anything,
then **Save as draft** → **Publish**.

**✅ Checkpoint:** your linked item now sits in the grid next to hosted content, with the
source's name and an outbound action.

**🔍 Under the hood:** `src/lib/ingest.ts` validates the URL (SSRF guards), then tries
oEmbed → Open Graph → scrape, normalizing to the same `Item` shape (guide §7).

---

## Step 5 — Schedule a post for later

Edit any draft. In the **Schedule publish for** control pick a time a couple minutes in the
future and click **Schedule**. It won't appear on the public site yet.

Now simulate the cron that publishes due posts:

```bash
npm run publish:due
```

(or set the time to the past first, then run it). Reload the homepage.

**✅ Checkpoint:** after its time passes and `publish:due` runs, the item appears publicly.

**🔍 Under the hood:** scheduling sets `status="scheduled"` + a future `publishedAt`; the
public site lists only `published`. `publishDue()` (`src/lib/schedule.ts`) flips due items.
It also runs inside `POST /api/sync` (guide §10b).

---

## Step 6 — Sell something (cart → checkout → receipt)

On the public site open a hosted product (e.g. **Starter Workbook**) → **Add to cart** →
**Cart** → enter an email → **Checkout**. With no Stripe keys, checkout runs in safe **stub
mode** and completes instantly.

**✅ Checkpoint:** you land on a success page; Admin → **Orders** shows the order as
*fulfilled*. Watch your `npm run dev` terminal — a receipt email was "sent" in stub mode.

**🔍 Under the hood:** prices are recomputed server-side (`src/lib/payments.ts`), the order
is fulfilled, and `fulfillOrder` emails a receipt (`src/lib/email.ts`) with a **signed
download link** for digital products (`src/lib/download.ts`). Add real `STRIPE_*` keys to go
live; the webhook is `/api/webhooks/stripe` (guide §11, §13).

---

## Step 7 — Gate content behind a membership

1. As the owner: Admin → **Plans** → add a plan (or use the seeded "Supporter").
2. Edit an item → set **Access: Members only** → save. It now shows a 🔒 badge.
3. Sign out. Click **Join**, create a member account, then **Membership** → **Subscribe**
   (stub mode activates instantly).
4. Open the gated item.

**✅ Checkpoint:** before subscribing the gated item shows a paywall teaser; after
subscribing it unlocks. (As the owner you could always preview it.)

**🔍 Under the hood:** members are `User`s with role `member` (rank 0 — no admin access).
Subscriptions live in `src/lib/membership.ts`; the item page checks `isActiveMember` before
rendering gated content (guide §12).

---

## Step 8 — Search

Click **Search** in the nav, query something from your content (a word in a title or body).

**✅ Checkpoint:** ranked results render as the same cards.

**🔍 Under the hood:** `src/lib/search.ts` ranks published items (title > summary > author >
source > body), reaching inside article block text. Provider-agnostic by design (guide §10a).

---

## Step 9 — Re-theme the whole site

Admin → **Settings** → under **Theme** click **Midnight** (or **Editorial** / **Sunrise**)
→ **Save settings** → reload any page.

**✅ Checkpoint:** colors, light/dark mode, and typography change site-wide.

**🔍 Under the hood:** themes are token packages (`src/lib/themes.ts`); the selection is
stored in settings and injected as CSS variables by the root layout (guide §6, §15).

---

## Step 10 — Run the maintenance jobs

```bash
npm run sync          # re-check external links, refresh metadata, detect price drift
npm run publish:due   # publish any scheduled items whose time has come
```

Check **Admin → Health** to see external items' status and last-checked times.

**🔍 Under the hood:** `src/lib/sync.ts` + `src/lib/schedule.ts`. Schedule both on cron in
production (examples in the script headers).

---

## Step 11 — Run the tests

```bash
npm test
```

**✅ Checkpoint:** the Vitest suite passes (70+ tests).

**🔍 Under the hood:** pure logic is tested without a DB or browser — the action model,
auth primitives, block parsing, the sanitizer, search ranking, signed downloads, and more
(`tests/`, guide §15a). Pure logic lives in Next-free modules (e.g. `auth-core.ts`) so it
imports cleanly under Vitest.

---

## Step 12 — Deploy with Docker + PostgreSQL

```bash
docker compose up --build
```

This starts Postgres and the app together (app on `http://localhost:3000`), applies the
schema, and seeds on first run.

**✅ Checkpoint:** the same site, now backed by Postgres in a container.

**🔍 Under the hood:** `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh`. Prisma
can't read its provider from an env var, so `scripts/set-provider.mjs` rewrites it from
`DATABASE_PROVIDER` before generate/push (guide §15). For production also set
`MEDIA_BACKEND=s3` + `S3_*` and real `STRIPE_*` / `SMTP_*` values.

---

## Where to go next

- Read **CODEBASE_GUIDE.md** for the full architecture and a "where do I look for…?" map.
- Try extending it: add a content type, a block type, a payment/email provider, or swap
  media storage to S3 — each is a short, localized change (guide §16).

You now understand the whole system end to end. Happy building.
