# Mosaic Codelabs — build the site you need

These are click-by-click walkthroughs that each start from a **brand-new, empty
project** and guide you to a finished site for a specific goal. They focus on the
admin UI and Settings — no coding required — and call out which features to turn
**on**, which to **skip**, and why.

Every codelab begins the same way:

```bash
npm run create-project -- <slug> --name "<Your Site Name>"
cd projects/<slug>
./start.sh
```

`start.sh` sets everything up and starts the site at http://localhost:3000. Sign
in at `/login` with the seeded owner (`owner@example.com` / `changeme123` —
change these in the project's `.env` before anything real). Each project gets its
own database, so you can build several of these side by side.

> Each codelab uses a different `<slug>` so they don't collide. Run one site at a
> time, or give each a different port: `PORT=3001 ./start.sh`.

## Pick your journey

1. [**Professional portfolio**](./1-professional-portfolio.md) — promote your bio,
   career and services; capture inquiries and bookings.
2. [**A series of lessons (course)**](./2-lesson-series-course.md) — teach a topic
   as ordered, multimedia lessons that remember where each learner left off.
3. [**A news / updates hub**](./3-news-hub.md) — curate and publish regular updates
   on a topic that people come back to, with email signup.
4. [**A small-business shop**](./4-small-business-shop.md) — sell a handful of
   products or services online with cart, checkout and orders.
5. [**A curated reading list**](./5-professor-reading-list.md) — collate the best
   articles and books on a topic, organized and annotated.

New to the platform overall? The developer-oriented tour is
[`../CODELAB.md`](../CODELAB.md), and the architecture reference is
[`../CODEBASE_GUIDE.md`](../CODEBASE_GUIDE.md).

## The building blocks (shared vocabulary)

- **Items** are your content. Every item has a **type** (article, blog post,
  video, product, link, book) and a **source** (hosted by you, or external/linked).
- **Topics** group items by subject; **Collections** are *ordered* groups (used as
  learning paths / courses / reading lists / a shop).
- **Settings** (Admin → Settings) has five tabs — **Appearance**, **Home page**,
  **Capabilities**, **Custom fields**, **SEO & analytics** — and every control has
  a **?** tooltip explaining what it does.
- **Capabilities** are opt-in: commerce, membership, contact form, newsletter,
  booking, and lesson-progress tracking. Turn on only what your goal needs.
