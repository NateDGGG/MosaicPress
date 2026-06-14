# Mosaic Learn — a PragerU-style demo built on Mosaic

A working demo that uses **[Mosaic](../site)** as its base and models the format of a
short-form educational video site: five-minute lessons, organized into series, hosted by
presenters, browsable by topic, with a membership tier for supporters.

The content is **neutral educational** material (history, economics, science, civics,
philosophy) and is seeded by **really ingesting** live pages through Mosaic's ingestion
pipeline — not hand-written fixtures.

## Quick start

```bash
cd mosaic_learn
npm install
npm run setup     # generate + db push + seed (ingests real content — needs internet)
npm run dev       # http://localhost:3000
```

Owner login: `owner@example.com / changeme123` (also `editor@example.com / editor123`).

## What's seeded

- **4 presenters** (a historian, economist, physicist, civics writer) with bios and profile pages.
- **5 topics** (History, Economics, Science, Civics, Philosophy).
- **4 series** (History in Five, Economics 101, How Science Works, Foundations of Civics).
- **14 lessons** — headlined by **8 real educational videos** ingested live from YouTube
  (CrashCourse, Veritasium, Kurzgesagt, 3Blue1Brown, TED-Ed, Harvard) that play inline,
  plus a few ingested reference articles, a hosted welcome video, and a hosted block-editor
  article. One lesson is **members-only** to show gating. Every video ID was verified
  through the ingestion pipeline before seeding.
- A **Supporter** membership plan (monthly + annual).

## What it shows off

- **Rich homepage** — hero + horizontally-scrolling rails (New releases, Featured, one per series) + topic chips.
- **Themed section colors** — each band (header, gradient hero, content, accent CTA strip, footer)
  gets a distinct color derived from the selected theme, so the whole stack recolors when you
  switch themes (see `sectionPalette` in `src/lib/settings.ts` and `src/components/Band.tsx`).
- **Presenters** — `/presenters` and `/presenters/[slug]` profile pages listing each host's lessons.
- **Topics** — `/topics` and `/topics/[slug]` subject pages.
- **Membership gating** — members-only lessons show a paywall to non-members (sign in / subscribe).
- Everything Mosaic already provides: search, the WYSIWYG block editor, scheduling, themes,
  cart/checkout, admin, etc.

## Extensions this demo adds to Mosaic

These are the only additions on top of the Mosaic base — each is small and could be
upstreamed into Mosaic itself:

| Extension | Files |
|---|---|
| Presenter model + profile pages | `prisma/schema.prisma` (Presenter), `src/lib/taxonomy.ts`, `src/app/presenters/*`, `src/app/admin/presenters` |
| Topic taxonomy (tags) + topic pages | `prisma/schema.prisma` (Tag/ItemTag), `src/lib/taxonomy.ts`, `src/app/topics/*`, `src/app/admin/topics` |
| Rich homepage with rails | `src/app/page.tsx`, `src/components/Rail.tsx` |
| Item editor: assign presenter + topics | `src/app/admin/items/[id]/page.tsx`, `src/app/api/items/[id]/route.ts` |
| APIs | `src/app/api/presenters`, `src/app/api/tags` |

`Item` gained `presenterId` (→ `Presenter`) and a `tags` relation (→ `ItemTag` → `Tag`);
`itemInclude` now loads both so cards/pages can show a presenter byline and topic chips.

## Relationship to Mosaic

This is a **fork** of the Mosaic base in `../site`, with its own database and seed. The
architecture, admin, auth, commerce, search, scheduling, theming, tests, and Docker setup
are all inherited from Mosaic — see Mosaic's `CODEBASE_GUIDE.md` and `CODELAB.md` for the
underlying system. Add real videos any time via **Admin → New from link**.
