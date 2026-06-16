# Mosaic — Source Code Guide

A guided tour of the codebase for a developer who wants to understand, modify, or
extend it. Read this top-to-bottom once; afterward use the "Where do I look for…?"
table at the end as a map.

---

## 1. The one idea to hold in your head

Everything in Mosaic is an **Item**, and an Item lives on **two independent axes**:

- **`type`** — *what it is*: `article`, `video`, `product`, or `link`. **This decides how it renders.**
- **`source`** — *where it lives*: `hosted` (you own it) or `external` (it lives elsewhere and you reference it). **This only decides the call-to-action** (read here vs. "Read on NYT →").

Because rendering is keyed on `type` and not `source`, a hosted video and a linked
YouTube video produce the *same card and the same page* — just a different action.
That is the product's core promise, and it falls out of one design decision in the data
model. If you understand this, the rest of the code is straightforward.

---

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, themed at runtime via CSS variables |
| ORM / DB | Prisma; SQLite by default, PostgreSQL for production |
| Payments | Stripe SDK, with a keyless "stub" fallback |
| Email | Nodemailer (SMTP), with a "stub" fallback that logs |
| Auth | Home-grown: scrypt password hashing + HMAC-signed cookies (Node `crypto`) |
| Deploy | Docker + docker-compose (app + Postgres) |

There is no separate backend service. Next.js serves the public site (server
components), the admin (mostly client components), and the API (route handlers) from a
single deployable.

---

## 3. How a request flows

Two kinds of server code handle requests:

**Server Components** (`src/app/**/page.tsx` without `"use client"`) render HTML on the
server. They query the database **directly** through Prisma — there is no API hop for
reads. Example: the home page calls `listItems()` and maps over `<ItemCard>`.

**Route Handlers** (`src/app/api/**/route.ts`) are the JSON API. The admin's client
components call these with `fetch`. Every handler that writes data calls `requireRole()`
first. Example: `POST /api/items` creates an Item.

**Client Components** (`"use client"`) run in the browser for interactivity — forms, the
cart, the block editor. They never touch Prisma; they call route handlers.

So: public pages read via Prisma in server components; all writes and admin reads go
through the API. Keep this split in mind when adding features.

---

## 4. Directory map

```
prisma/
  schema.prisma         The data model (single source of truth)
  seed.ts               Demo content, users, plans, settings
scripts/
  set-provider.mjs      Rewrites the Prisma provider from DATABASE_PROVIDER
  count-users.mjs       Used by Docker entrypoint to seed only when empty
  sync.ts               Cron entrypoint for the link-health worker
src/
  lib/                  All business logic (framework-agnostic where possible)
  components/           Reusable UI (server + client)
  app/                  Routes: pages (UI) and api/ (JSON handlers)
Dockerfile, docker-compose.yml, docker-entrypoint.sh   Deploy
```

The most important rule: **business logic lives in `src/lib`**, not in pages or route
handlers. Pages and handlers are thin; they call into `lib`. If you want to know how
something *works*, read `lib`. If you want to know how it's *exposed*, read `app`.

---

## 5. The data model (`prisma/schema.prisma`)

Read this file first — it's the spine of the app. Key models:

- **`Item`** — the unified content unit. Shared fields (`title`, `slug`, `summary`,
  `coverImage`, `status`, `access`, `featured`, `body`…) plus the two axis fields
  (`type`, `source`). Has optional 1:1 extensions, one per type/source:
  - `ExternalSource` — present only when `source = external`: the URL, cached metadata
    (`sourceName`, `favicon`, `embedHtml`), and health (`syncStatus`, `lastSyncedAt`).
  - `VideoMeta`, `ProductMeta`, `LinkMeta` — type-specific fields.
- **`Collection` / `CollectionItem`** — ordered groupings that mix any type and source.
  Used as **learning paths / courses**: `CollectionItem.position` defines lesson order.
- **`ItemProgress`** — per-learner state (`saved`, `completed`) for one Item. Belongs to
  **either** a signed-in `User` (`userId`) **or** an anonymous device (`anonId`); see §10d.
- **`User`** — staff (`owner`/`editor`/`contributor`) **and** customers (`member`), one table.
- **`Setting`** — a single key/value row holding site config (name, theme, currency).
- **`Media`** — uploaded files.
- **`Order` / `OrderLine`** — commerce.
- **`Plan` / `Subscription`** — memberships.

> SQLite has no enums, so "enum" columns are plain strings validated in app code
> (`src/lib/types.ts`). The schema is otherwise provider-agnostic and runs identically on
> SQLite and PostgreSQL.

`body` (on articles) is a JSON string of "blocks" — see §10.

---

## 6. The `lib` layer, module by module

Each file has a single responsibility. Most expose a small set of functions and hide a
provider behind an interface so it can be swapped.

| File | What it does | Notable design point |
|---|---|---|
| `db.ts` | The shared Prisma client | Singleton to survive dev hot-reload |
| `types.ts` | Allowed values for string "enums" + `actionLabel()` | `actionLabel(type, source)` produces "Read" vs "Read on X →" |
| `items.ts` | Item queries, `slugify`/`uniqueSlug`, `createFromDraft`, formatters | `itemInclude` is the canonical relation set used everywhere |
| `ingest.ts` | Turn a URL into a normalized Item draft | SSRF guards + oEmbed → Open Graph → scrape fallback |
| `settings.ts` | Read/write site settings, hex→rgb helpers | Defaults live here; DB overrides them |
| `themes.ts` | Packaged theme presets (color + mode + type) | Selecting one bulk-sets settings tokens |
| `auth-core.ts` | Pure auth primitives (hash, sign, roles) | No Next deps → unit-testable |
| `auth.ts` | Cookie-bound session helpers, `requireRole`, `authenticate` | Builds on `auth-core`; `requireRole` throws a `Response` |
| `media.ts` | Pluggable file storage (local **or** S3) | `activeBackend()` picks via `MEDIA_BACKEND` |
| `payments.ts` | Stripe checkout + `fulfillOrder` | `getStripe()` returns null → stub mode |
| `membership.ts` | Subscriptions + `isActiveMember` | Mirrors payments; stub fallback |
| `email.ts` | Transactional email + receipt template | `getTransport()` null → logs instead of sends |
| `download.ts` | Signed digital-download links | HMAC over `order:item`, re-checked at the endpoint |
| `sync.ts` | Re-fetch external metadata, link health, price drift | `syncAll()` used by cron, API, and admin |
| `blocks.ts` | Article block model + `parseBlocks` + `embedSrc` | Shared by editor and renderer |
| `sanitize.ts` | Allowlist HTML sanitizer for rich text | Render-time XSS boundary (cheerio) |
| `search.ts` | Ranked full-text search over published items | In-memory scoring → provider-agnostic |
| `schedule.ts` | `publishDue()` flips scheduled items live | Run on a cron / from the maintenance API |
| `cart.ts` | Client-only cart (localStorage + events) | The only `lib` file that runs in the browser |

### The "provider with a stub" pattern

`payments.ts`, `membership.ts`, and `email.ts` all follow the same shape: a real
implementation (Stripe / SMTP) that activates when env vars are present, and a **stub**
that simulates success when they aren't. This is why you can run the entire checkout,
subscription, and receipt flows locally with zero external accounts. When you add a
provider (e.g. SES, PayPal), follow this pattern so local dev stays keyless.

---

## 7. Ingestion — how a pasted URL becomes an Item (`lib/ingest.ts`)

This is the heart of the "external content" feature.

1. **`assertSafeUrl`** validates the URL and blocks SSRF: no non-HTTP(S) schemes, no
   localhost/`.local`, no private IP ranges (checked after DNS resolution).
2. **`ingestUrl`** tries adapters in order of quality:
   - **oEmbed** for known providers (YouTube, Vimeo) → richest data, real embed HTML.
   - **Open Graph / Twitter Card / schema.org** via Cheerio → title, image, price, author.
   - **Generic scrape** fallback → at least a title + linkable card.
3. The result is a `NormalizedDraft` — the *same shared fields every Item has*, plus
   `external` metadata. `createFromDraft` (in `items.ts`) persists it as a draft Item.

The type is auto-detected from the URL and `og:type`/price signals. The admin
"New from link" page (`app/admin/new-from-link`) drives this: it POSTs to `/api/ingest`
for a preview, lets the owner edit, then POSTs to `/api/items` to save.

---

## 8. Rendering — one card, one page, any source

- **`components/ItemCard.tsx`** is the unified card. It picks a layout by `type`, shows a
  "Hosted" or source-name tag, a "Members" lock if gated, and an action from
  `actionLabel(type, source)`. External `link` items point straight out; everything else
  links to the internal item page.
- **`app/i/[slug]/page.tsx`** is the unified item page. It branches on `type` to render a
  video player / product buy box / article body, and on `source` to show native controls
  vs. an attributed outbound action. It also enforces **members-only gating** at the top:
  staff preview freely, active members pass, everyone else gets a teaser + CTA.
- **`components/BlockRenderer.tsx`** renders hosted article bodies from the block JSON.

Because all three read the same `Item` shape, hosted and external content of the same
type are visually identical except for the action — the product thesis, enforced in code.

---

## 9. Auth & roles (`lib/auth.ts`)

- **Passwords**: scrypt with a per-user salt, stored as `salt:hash`. Verified with a
  constant-time compare.
- **Sessions**: stateless. The cookie is `base64url(json).hmac`, signed with
  `SESSION_SECRET`. `getSessionUser()` reads and verifies it; there is no session table.
- **Roles**: ranked `member(0) < contributor(1) < editor(2) < owner(3)`. `hasRole(user,
  min)` compares ranks. `requireRole(min)` throws a `Response` (401/403) that route
  handlers catch and return. `isStaff()` distinguishes customers from staff.
- **Two kinds of account, one table**: staff are created in the admin
  (`/api/users`, owner-only); customers self-register as `member` via `/api/auth/register`.
  The login page routes members to `/account` and staff to `/admin`.

Gating points: the admin layout redirects non-staff to `/login`; every write API calls
`requireRole`; publishing requires `editor`, settings/users/plans/sync require `owner`.

---

## 10. The block editor (`lib/blocks.ts`, `components/BlockEditor.tsx`, `BlockRenderer.tsx`)

Article bodies are an array of typed blocks stored as JSON in `Item.body`:

```
heading | paragraph | quote | list | image | embed | code | divider
```

- `blocks.ts` defines the `Block` union, `parseBlocks()` (tolerant of legacy/plain-text
  bodies), `emptyBlock()`, and `embedSrc()` (URL → iframe src).
- `BlockEditor.tsx` (client) edits the array — add/reorder/delete blocks, per-type inputs,
  image upload via `/api/media` — and reports changes as a JSON string.
- `BlockRenderer.tsx` (server) renders that JSON to styled HTML.

To **add a block type**: extend the `Block` union and the helpers in `blocks.ts`, add an
input case in `BlockEditor`, and a render case in `BlockRenderer`. Three files, no schema
change (it's all JSON in `body`).

**WYSIWYG (rich text).** Paragraph and quote blocks are edited with
`components/RichTextField.tsx` — a `contentEditable` surface with a bold/italic/underline/
link toolbar (built on `document.execCommand`, dependency-free). It's deliberately
*uncontrolled*: the initial HTML is set once on mount and changes only flow outward, so the
caret never jumps. The stored block text is now a small subset of HTML. The security
boundary is at render time: `BlockRenderer` runs every rich block through
`sanitizeRichText` (`lib/sanitize.ts`), an allowlist sanitizer that keeps `b/strong/i/em/
u/code/a/br`, strips scripts/event handlers/styles, and forces `rel`/`target` on links.
Plain-text (legacy) bodies pass through untouched.

## 10a. Search (`lib/search.ts`, `app/search`, `app/api/search`)

`searchItems(query)` loads published items and ranks them in memory: title matches score
highest, then summary, author, external source name, and finally the article body (block
text with inline HTML stripped). This keeps search identical on SQLite and Postgres and
lets it reach inside article bodies. `/search` is the public page; `/api/search?q=` is the
JSON endpoint. For a large catalog, swap the in-memory scan for Postgres full-text search
or a dedicated index — `searchItems`'s signature stays the same, so nothing else changes.

## 10b. Scheduled publishing (`lib/schedule.ts`)

An Item with status `scheduled` and a future `publishedAt` is hidden from the public site
(which lists only `published`). `publishDue()` flips any whose time has arrived to
`published`. It runs three ways: `npm run publish:due` (cron, e.g. every minute), inside
`POST /api/sync`, and you can wire it anywhere else. The editor's schedule control
(`app/admin/items/[id]`) sets `status: "scheduled"` + a `publishedAt` ISO time; scheduling
requires the `editor` role, same as publishing. No schema change was needed — it reuses
`status` + `publishedAt`.

---

## 10c. Owner commentary (`Item.commentary`, `lib/blog.ts`)

`Item.commentary` (markdown, nullable) holds the site owner's own take on any
asset — separate from `summary` (short description) and `body` (long-form).

- **Render:** `renderCommentaryHtml(md)` in `lib/blog.ts` reuses the markdown
  renderer + `sanitizeArticleHtml`, so commentary is always sanitized.
- **Item page** (`app/i/[slug]`): a "From the editor" callout for every type.
- **Cards** (`components/ItemCard.tsx`): `commentaryMode` prop
  (`hidden` | `excerpt` | `full`) + `commentaryChars`. Excerpts are plain-text
  (markdown stripped) and line-clamped so rails keep uniform heights. When a
  card has no `summary`, commentary becomes the blurb; otherwise it appends as a
  "Note:" line.
- **Home control:** global `settings.homeCommentary` + `commentaryExcerptChars`;
  per-section override via `HomeSection.commentary` (passed as
  `sec.commentary || cm` to each `Rail`).
- **Editor's notes band:** `HomeSection` kind `editorsNotes` renders published
  items where `featuredNote && commentary`, with fully-rendered markdown. The
  `Item.featuredNote` flag is set from the item editor.
- **Search:** `scoreItem` indexes commentary at low weight (`lib/search.ts`).
- **Design rationale:** see `COMMENTARY_DISPLAY_DESIGN.md` in `docs/`.

## 10d. Lesson progress & resume — the "course player" (`lib/progress.ts`, `lib/learner.ts`)

Collections double as **self-paced courses**: ordered lessons, per-lesson completion, a
path-level progress bar, a **Resume** button that jumps to the first unfinished lesson, and
a **"Complete & continue →"** button that marks a lesson done and advances to the next one.
The sequencing itself is `nextItem()` in `lib/taxonomy.ts` (next published item in the same
collection by `position`, falling back to topic order).

The key idea is the **`Learner`** — *who progress is recorded for*. It's either a signed-in
user or an anonymous device, so resume can work **without a formal login**:

- **`lib/learner.ts`** resolves identity from the `settings.progressTracking` mode:
  - `getLearner()` — read-only (safe in server components): returns the user, else (in
    `anonymous` mode) the `ml_anon` cookie holder, else `null`. **Never sets a cookie.**
  - `getOrCreateLearnerForWrite()` — for route handlers/server actions: in `anonymous` mode
    it **mints and sets** the `ml_anon` cookie (a random UUID, httpOnly, 1-year) on first
    write. Cookie-setting only works outside render, which is why this is separate.
  - `currentAnonId()` / `clearAnonCookie()` — used by the login/register flow to merge.
- **`lib/progress.ts`** is `Learner`-keyed throughout (`getProgress`, `setProgress`,
  `listSaved`, `listCompleted`, `completedItemIds`). It builds the query from the learner
  (`{userId}` or `{anonId}`) and uses the matching compound-unique selector
  (`userId_itemId` or `anonId_itemId`) for upserts. **`mergeAnonProgress(userId, anonId)`**
  folds anonymous device rows into a user's on login (OR-merging `saved`/`completed`), then
  deletes the anon rows.

**The setting** — `settings.progressTracking: "login" | "anonymous" | "off"` (default
`"login"`, set under Admin → Settings → Capabilities):

| Mode | Who is tracked | UI shown to |
|---|---|---|
| `login` | signed-in users only (legacy behavior) | signed-in visitors |
| `anonymous` | users **and** anonymous devices (cookie) | everyone; merges into an account on login |
| `off` | nobody | hidden everywhere |

**Where it surfaces:** the item page (`app/i/[slug]`) computes `showProgress` from the mode
and renders `<ItemActions>` (Save / Mark complete / Complete & continue) accordingly; the
path pages (`app/collections/[slug]` and the index) read progress via `getLearner()` so the
bar/Resume work for anonymous visitors too. Writes go through `POST /api/progress`, which
resolves the learner with `getOrCreateLearnerForWrite()` and `401`s when tracking is `off`
or login-required-but-logged-out. Login/register (`app/api/auth/*`) call `mergeAnonProgress`.

**Schema note:** `ItemProgress.userId` is nullable and `anonId` was added, with two compound
uniques (`@@unique([userId,itemId])`, `@@unique([anonId,itemId])`). NULLs are distinct in
SQLite/Postgres unique indexes, so the two never collide. Adding the field needs a
`prisma db push`. **Caveat:** anonymous progress is per-device/per-browser and resets if the
visitor clears cookies — the inherent tradeoff of "no login."

## 11. Commerce flow (products & orders)

1. Public product page → `AddToCartButton` writes to the localStorage cart (`lib/cart.ts`).
2. `/cart` → `POST /api/checkout` with line item IDs (never prices).
3. `lib/payments.ts#createCheckout` **recomputes prices from the DB**, creates a pending
   `Order`, then either a Stripe Checkout Session or a stub URL.
4. On success: Stripe calls `POST /api/webhooks/stripe` (verified by signature) → marks
   the order paid → `fulfillOrder`. In stub mode, `/api/checkout/stub-complete` does the
   same thing locally.
5. `fulfillOrder` (in `payments.ts`) marks the order fulfilled, then **emails a receipt**
   with **signed download links** for digital products.

Only **hosted** products check out; **external** products link to their source.

---

## 12. Membership flow (`lib/membership.ts`)

Parallel to commerce, but recurring:

1. A visitor self-registers (`/join`) → becomes a `member`.
2. `/membership` → `POST /api/subscribe` → Stripe subscription Checkout or stub URL.
3. Activation: Stripe webhook (`customer`/`checkout.session.completed` in subscription
   mode) or `/api/subscribe/stub-complete` calls `activateSubscription`.
4. `isActiveMember(userId)` (status `active` and not past `currentPeriodEnd`) gates
   members-only Items on the item page.
5. `/account` shows status and cancels (`/api/subscription/cancel`, which also cancels in
   Stripe when configured).

Owners create plans in `/admin/plans`; any Item can be flagged `access: "members"` in the
item editor.

---

## 13. Digital delivery & email

- `lib/download.ts` signs an order+item token (HMAC). `GET /api/download` verifies the
  token **and** that the order is paid/fulfilled **and** that the item is in that order,
  then streams the file (or redirects if it's a remote URL). Links can't be guessed or
  reused across items.
- `lib/email.ts` renders an HTML receipt and sends via SMTP, or logs in stub mode. Swap
  the transport here for SES/Resend.

---

## 14. The sync / link-health worker (`lib/sync.ts`)

`syncAll()` walks every external Item and, per item: checks the link's HTTP status
(→ `ok`/`broken`/`paywalled`), refreshes cached metadata via `ingestUrl`, and updates
product prices (recording drift). It's invoked three ways: `npm run sync` (cron,
`scripts/sync.ts`), `POST /api/sync` (owner), and the **Admin → Health** page's button.
Status and last-checked time are stored on `ExternalSource` and surfaced in the admin.

---

## 15. Configuration & deployment

- **Settings** (name, colors, theme, currency) live in the DB (`Setting` row) and are
  editable at **Admin → Settings**. The root layout reads them and injects CSS variables,
  so theme changes apply site-wide without a rebuild.
- **Env** (`.env`, see `.env.example`): `DATABASE_URL`, `SESSION_SECRET`, Stripe keys,
  SMTP, seed owner credentials, and `DATABASE_PROVIDER`.
- **Provider switch**: Prisma can't read its provider from an env var, so
  `scripts/set-provider.mjs` rewrites the schema's `provider` from `DATABASE_PROVIDER`
  (`sqlite` locally, `postgresql` in Docker) before generate/push.
- **Docker**: `docker compose up --build` runs Postgres + the app. The entrypoint sets the
  provider, applies the schema, seeds only on a fresh DB (`count-users.mjs`), and starts
  the server. Media and DB persist in named volumes.

---

## 15a. Tests (`tests/`, `vitest.config.ts`)

Run `npm test`. The suite uses **Vitest** and focuses on pure logic that needs no DB or
browser: the `type`/`source` action model, color/theme helpers, auth primitives (hashing,
session signing, role hierarchy), block parsing, signed-download tokens, SSRF rejections,
receipt rendering, and formatters. This is why `auth-core.ts` exists separately from
`auth.ts` — the primitives have no `next/headers` dependency, so they import cleanly under
Vitest. When you add logic, prefer putting the pure part in a Next-free module so it can be
tested directly. `tests/` is excluded from the Next build in `tsconfig.json`.

## 15b. Creating a new project (`core/scripts/create-project.mjs`)

Mosaic is a monorepo: `core/` holds all shared code and each site is a thin
workspace under `projects/`. To start a brand-new, empty site:

```bash
npm run create-project -- my-site --name "My Site"
cd projects/my-site
./start.sh
```

`create-project.mjs` scaffolds `projects/<slug>/` with its own config
(`package.json`, `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`), its
own `.env` (with a freshly generated `SESSION_SECRET` and
`DATABASE_URL="file:./data/dev.db"` — **a database private to that project**),
the hand-written root `src/app/layout.tsx`, and a **minimal, idempotent seed**
(`prisma/seed.ts`) that creates one owner (from `.env`) plus default settings and
a "General" topic — and no demo content, so the creator starts clean. The route
tree, `schema.prisma` and `globals.css` are **not** written by the scaffolder;
they're generated from core by the project's `npm run sync` (the `.gitignore`
excludes them for that reason).

`start.sh` is the one-command, idempotent starter: it installs workspace deps the
first time (only when the project isn't yet linked into the root `node_modules`),
runs `npm run sync`, prepares the DB (`db:generate` + `db:push`), seeds **only if
the DB has no users**, then runs `npm run dev`. `npm run setup && npm run dev` is
the equivalent via npm scripts.

**Two-surface serving.** `dev` and `start` run through `core/scripts/serve.mjs`,
which launches Next on a private internal port and puts two tiny reverse proxies
in front of it: the **public site** on `PORT` (default 3000) and the **admin** on
`PORT + 1` (default 3001). `/admin*` on the public port redirects to the admin
port, and non-admin paths on the admin port redirect to `/admin`, so the two
surfaces stay cleanly separated. Sessions still work across both because cookies
aren't port-specific. This applies to local/self-hosted node only; on a
single-port host (e.g. Vercel) the scripts aren't used and the admin stays at
`/admin` on the one port.

Because each project carries its own `.env` and `data/dev.db`, sites are fully
isolated — separate content, settings and users — while sharing one copy of core.
New projects are picked up automatically by the root `workspaces: ["core",
"projects/*"]` glob, so no root edits are needed. Change the default
`owner@example.com` / `changeme123` in `.env` before any real use.

> Persona-oriented, click-by-click walkthroughs that start from a fresh project
> live in `docs/codelabs/` (portfolio, course, news hub, shop, reading list).

## 16. How to extend it

**Add a content type** (e.g. `audio`): add it to `ITEM_TYPES` in `types.ts`, add a meta
table in the schema + relation on `Item`, handle it in `ItemCard`, the item page, the
"new" form, and `actionLabel`. Ingestion auto-detection is in `ingest.ts`.

**Add a payment/email provider**: implement alongside Stripe/Nodemailer in
`payments.ts`/`email.ts` behind the existing function signatures; keep the stub fallback.

**Swap media storage to S3**: reimplement `storeFile` in `media.ts`; nothing else changes.

**Add a block type**: see §10 — three files in `blocks.ts` / `BlockEditor` / `BlockRenderer`.

**Move to PostgreSQL**: set `DATABASE_PROVIDER=postgresql` + a Postgres `DATABASE_URL`,
run `npm run db:provider && npx prisma db push`. The schema is already portable.

---

## 17. Where do I look for…?

| I want to… | Look at |
|---|---|
| Understand the core model | `prisma/schema.prisma`, `src/lib/types.ts` |
| Change how a card/page looks | `src/components/ItemCard.tsx`, `src/app/i/[slug]/page.tsx` |
| Change URL ingestion | `src/lib/ingest.ts`, `src/app/admin/new-from-link/page.tsx` |
| Touch auth / permissions | `src/lib/auth.ts` (+ `requireRole` calls in `app/api/**`) |
| Work on checkout / orders | `src/lib/payments.ts`, `src/app/api/checkout/*`, `src/app/cart` |
| Work on memberships | `src/lib/membership.ts`, `src/app/membership`, `src/app/account` |
| Work on lesson progress / resume / courses | `src/lib/progress.ts`, `src/lib/learner.ts`, `src/components/ItemActions.tsx`, `src/app/collections/[slug]` |
| Scaffold a brand-new site | `core/scripts/create-project.mjs` (`npm run create-project`), generated `projects/<slug>/start.sh` |
| Edit the article editor | `src/lib/blocks.ts`, `src/components/BlockEditor.tsx`, `src/components/RichTextField.tsx` |
| Change HTML sanitization | `src/lib/sanitize.ts` |
| Work on search | `src/lib/search.ts`, `src/app/search`, `src/app/api/search` |
| Work on scheduled publishing | `src/lib/schedule.ts`, `scripts/publish-due.ts`, `src/app/admin/items/[id]` |
| Change emails / downloads | `src/lib/email.ts`, `src/lib/download.ts`, `src/app/api/download` |
| Configure the site / theme | `src/lib/settings.ts`, `src/app/admin/settings`, `src/app/layout.tsx` |
| Change deploy / database | `Dockerfile`, `docker-compose.yml`, `scripts/set-provider.mjs` |
| Add demo data | `prisma/seed.ts` |

---

## 18. Conventions & gotchas

- **Reads in server components, writes through the API.** Don't call Prisma from client code.
- **All money is integer cents**; format with `priceFormat` (`lib/items.ts`).
- **String "enums"** are validated in `lib/types.ts`, not by the DB.
- **`itemInclude`** is the standard relation bundle — use it so type-specific fields are present.
- **Stub modes** keep local dev keyless — preserve them when adding providers.
- **`requireRole` throws a `Response`**; in a route handler, `try { requireRole(...) } catch (r) { if (r instanceof Response) return r; throw r }`.
- **Route handlers that also serve a non-GET** should `export const dynamic = "force-dynamic"` to avoid being statically optimized into a GET-only route.
