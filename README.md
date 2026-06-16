# MosaicPress

**A minimal, batteries-included website builder for non-programmers — stand up a real content site in minutes, not a weekend.**

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-SQLite%20%2F%20Postgres-2D3748?logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

MosaicPress is a compact publishing platform for portfolios, courses, news hubs,
shops, and curated link/reading collections. Everything is built around one idea:
your content and the web's content live side by side in a single, consistent
format — write an article, embed a video, sell a product, or link out to an
external article, and they all render as the same clean card and page.

It ships with the things real sites need **already built in** — commerce,
memberships, contact and newsletter forms, booking, a self-paced course player,
SEO, and a live-preview theme editor — all behind simple on/off toggles. No
plugins to hunt for, install, or keep patched.

---

## Why MosaicPress instead of WordPress?

WordPress is powerful and has an enormous ecosystem. MosaicPress makes a different
trade: **less to assemble, less to maintain, faster to launch.**

| | **MosaicPress** | **WordPress** |
|---|---|---|
| **Get started** | One command creates a new site; one command runs it | Install PHP + MySQL, or buy managed hosting, then configure |
| **Database** | SQLite by default (just a file) — Postgres for production | Requires a MySQL/MariaDB server |
| **Core features** | Shop, memberships, forms, newsletter, booking, courses **built in** | Mostly added via third-party plugins |
| **Maintenance** | One small codebase; update once | Core **plus** every plugin/theme needs ongoing security updates |
| **Footprint** | One compact app, fast by default | Heavier; performance depends on plugin sprawl |
| **Content model** | Your content **and** external links/videos/products in one format | Post/page centric; mixing in external content needs plugins |
| **Customizing** | A guided Settings panel with live preview and tooltips | Theme/plugin settings vary widely in quality |
| **Run many sites** | Shared core + thin per-site projects (update core once) | Multisite is possible but heavier to operate |

**It's the better fit when** you want a clean, modern site live quickly without
becoming a webmaster — a creator, professional, small business, educator, or
curator who'd rather publish than administer.

> **When WordPress may be the better choice:** if you need its vast plugin/theme
> marketplace, one-click managed hosting from countless providers, or a large pool
> of existing WordPress developers. MosaicPress is opinionated and newer — you (or
> a developer) self-host it on Vercel, a container host, or your own server.

---

## Quick start

> **First time only** (requires Node 18.17+, 20+ recommended):
> ```bash
> git clone https://github.com/NateDGGG/MosaicPress.git && cd MosaicPress && npm install
> ```

**1. Create a new site**

```bash
npm run create-project -- my-site --name "My Site"
```

Scaffolds `projects/my-site/` with its own branding, config, and **its own
database** — completely separate from any other site in the repo.

**2. Set it up and run it**

```bash
cd projects/my-site
./start.sh
```

`start.sh` is idempotent: it installs dependencies the first time, generates the
site from the shared core, creates the database, seeds an owner account, and
starts **two servers** — the public site and a separate admin. Re-run it any time.

**3. Open it and sign in**

| | URL |
|---|---|
| **Public site** | http://localhost:3000 |
| **Admin** | http://localhost:3001/admin |

The admin runs on the next port up (public port + 1). Sign in with the default
owner account:

```
Email:    owner@example.com
Password: changeme123
```

> **Change these before going live** — edit `SEED_OWNER_EMAIL` /
> `SEED_OWNER_PASSWORD` in `projects/my-site/.env` (and re-seed), or update the
> account from the admin. To use a different public port: `PORT=8080 ./start.sh`
> (admin then runs on `8081`).

You now have an empty site with a full admin, ready to brand and fill in.

> Want a guided, click-by-click build for a specific kind of site? See the
> [codelabs](docs/codelabs/).

---

## What you can build

Step-by-step, click-by-click walkthroughs (no coding) live in
[`docs/codelabs/`](docs/codelabs/) — each starts from a fresh project:

1. [**Professional portfolio**](docs/codelabs/1-professional-portfolio.md) — bio, work, services, bookings.
2. [**A course / lesson series**](docs/codelabs/2-lesson-series-course.md) — ordered multimedia lessons that remember where each learner left off.
3. [**A news / updates hub**](docs/codelabs/3-news-hub.md) — curate links + publish posts, with email signup.
4. [**A small-business shop**](docs/codelabs/4-small-business-shop.md) — products, cart, checkout, orders.
5. [**A curated reading list**](docs/codelabs/5-professor-reading-list.md) — best articles and books on a topic.

## Features

- **Content types:** articles (block editor), blog posts (markdown), videos
  (hosted or embedded), products, curated links, and books — plus add-from-link
  that auto-fetches titles and images.
- **Organize:** topics, authors/presenters, and ordered collections (used as
  courses, reading paths, or a shop).
- **Capabilities (opt-in toggles):** commerce (cart, checkout, inventory, orders,
  Stripe), memberships, contact form, newsletter, booking, testimonials, and a
  self-paced **course player** with resume — optionally **without requiring login**.
- **Design without code:** one-click style presets, logo/colors/fonts, hero
  builder, footer builder, and a **live preview** — every setting has a help
  tooltip.
- **Found & shared:** automatic SEO meta + Open Graph, `sitemap.xml`, `robots.txt`,
  and a paste-in analytics field.

---

## How it works (for the curious)

MosaicPress is a small monorepo: a shared **core** powers any number of thin
**projects** (sites).

```
core/                     Shared package (@mosaic/core): lib, components, routes, schema, tests
projects/<your-site>/     A thin site: its own .env, branding, database, and uploads
package.json              npm workspaces: ["core", "projects/*"]
```

Each project's pages, API routes, database schema, and base styles are **generated
from core** by `npm run sync`, so every site shares identical, up-to-date features
while keeping its own content and look. Update core once; refresh each site with a
single command. Each site has its **own database** (SQLite file by default;
Postgres for production), so sites are fully isolated.

### Everyday commands (inside a project)

```bash
./start.sh            # set up (if needed) and run the dev server
npm run setup         # sync from core + prisma generate + db push + seed
npm run dev           # run the dev server
npm run build         # production build
```

### Deploy

SQLite is perfect for local and small sites. For production, set
`DATABASE_PROVIDER=postgresql` and a Postgres `DATABASE_URL` in the project's
`.env`, add your `STRIPE_*` / `SMTP_*` keys as needed, and deploy to Vercel or via
the included Docker setup. See the guides below.

---

## Docs

- [**docs/codelabs/**](docs/codelabs/) — build-it walkthroughs for each kind of site.
- [**docs/CODEBASE_GUIDE.md**](docs/CODEBASE_GUIDE.md) — architecture tour and a "where do I look for…?" map.
- [**docs/CODELAB.md**](docs/CODELAB.md) — a developer-oriented hands-on tour.
- [**docs/DEPLOY.md**](docs/DEPLOY.md) — deploy to a VPS (`deploy/deploy.sh` + pm2/nginx/Caddy templates in `deploy/`).

## Tests

```bash
npm test        # runs the core Vitest suite
```

## License

[MIT](LICENSE) © 2026 Nate D

---

Built with Next.js, TypeScript, Prisma, and Tailwind CSS.
