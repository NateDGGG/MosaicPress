# Mosaic — monorepo

A shared **core** powering multiple **projects** (sites). Update core once; every
project benefits. Each project has its own branding, content, database, and uploads.

```
core/                     The shared package (@mosaic/core)
  src/lib/*               business logic
  src/components/*        UI (incl. RootChrome site shell)
  src/app/*               route implementations (pages + API handlers)
  src/styles/globals.css  base styles
  prisma/schema.prisma    the single source-of-truth data model
  scripts/                sync-routes generator, sync/publish/seed helpers
  tests/                  Vitest unit tests
projects/
  mosaic-learn/           a PragerU-style education demo
  base/                   the general-purpose starter
package.json              npm workspaces: ["core", "projects/*"]
```

## Run a project

```bash
npm install                      # once, at the repo root (hoists deps)
cd projects/mosaic-learn         # or projects/base
npm run setup                    # sync core -> project, generate client, db push, seed
npm run dev                      # http://localhost:3000
```

`npm run setup` runs `npm run sync` (regenerate route stubs + copy schema + base
globals from core), then Prisma generate/push, then the project seed.

Default logins (from the seed): `owner@example.com / changeme123`,
`editor@example.com / editor123`.

## Rebuild from scratch

The source tree is the source of truth, but `node_modules/`, the generated Prisma
client, and each project's SQLite database (`projects/*/data/dev.db`) are **not**
committed/synced — recreate them on a fresh machine or after a clean checkout:

```bash
npm install                      # repo root — installs + hoists all workspaces
cd projects/mosaic-learn         # or projects/base
npm run setup                    # sync + prisma generate + db push + seed
npm run dev                      # http://localhost:3000
```

That's the whole bootstrap. `npm run setup` is idempotent, so it's also safe to
re-run after pulling changes. If you only changed core code (not the schema),
`npm run sync` alone is enough; run `npm run db:push` too if the schema changed.

To wipe a project's data and reseed from scratch:

```bash
rm -f projects/mosaic-learn/data/dev.db && npm --workspace @mosaic/project-mosaic-learn run setup
```

## Commentary (owner notes)

Every asset (article, blog, video, product, link, book) has an optional
**commentary** field — the site owner's own take, written in markdown. It's
distinct from `summary` (a neutral one-line description) and `body` (full
long-form, articles/blog only).

- **Author it** in the item editor ("Your commentary") or in the create flows
  for links, products, and blog posts.
- **Item page:** always shown as a themed "From the editor" callout above the body.
- **Home cards:** controlled by Settings → Content → *Show your commentary on
  home-page cards* — `Hidden` (default), `Excerpt` (short note + length), or
  `Full`. Each home section can override this in the Home-page builder
  (Default / Hidden / Excerpt / Full).
- **Editor's notes band:** flag an item with "Feature this commentary" and add
  the *Editor's notes* section (in the default layout) to spotlight your picks
  with fully-rendered commentary.
- Commentary is also indexed by search (low weight).

## How sharing works

A project's `src/app` is **generated** from core by `npm run sync`
(`core/scripts/sync-routes.mjs`): each route is a one-line re-export of the
corresponding `@mosaic/core` route, so all projects run identical core features.
Next transpiles core via `transpilePackages: ["@mosaic/core"]`.

The schema (`schema.prisma`) and `src/app/globals.css` are also copied from core
on sync. The project owns only: `.env`, `src/app/layout.tsx`, its seed, its
`data/` (SQLite) and `public/uploads/`.

## Overriding core in a project

To customize a route/file for one project, edit the generated file and add a
`// @override` comment at the top. `npm run sync` will then leave it untouched
while still updating everything else.

## Update core, refresh projects

```bash
# edit anything under core/ ...
cd projects/<name> && npm run sync     # pull the latest stubs/schema/globals
npm run db:push                        # if the schema changed
npm run dev
```

## Add a new project

Copy an existing project folder, then:
1. Change `name` in its `package.json` and the branding in `.env`.
2. Give it its own `SESSION_SECRET` and (optionally) a custom `prisma/seed.ts`.
3. `npm install` (root) → `cd projects/<name>` → `npm run setup` → `npm run dev`.

## Runtime data (sharded per project)

Each project keeps its own SQLite database at `projects/<name>/data/dev.db` and
uploads at `projects/<name>/public/uploads/`. For PostgreSQL, set
`DATABASE_PROVIDER=postgresql` + a Postgres `DATABASE_URL` in the project `.env`
(see `core/scripts/set-provider.mjs`).

## Tests

```bash
npm test        # runs the core Vitest suite
```

See **CODEBASE_GUIDE.md** for an architecture tour and **CODELAB.md** for a
hands-on walkthrough (paths there refer to the code now living in `core/`).
