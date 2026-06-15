# Codelab 5 — A curated reading list (best articles & books on a topic)

**Goal:** a scholarly hub that collates the latest articles and the best books on
a topic — organized, annotated with why each matters, filterable, and pointing
readers to where they can read or buy each item.

**You'll use:** **link** items (articles) + **book** items, **topics** +
**collections** (syllabus / reading lists), **commentary**, **custom fields** with
filters, an **affiliate tag** for book links, and optionally **anonymous progress**
so students can track what they've read.

**You'll skip:** a full shopping cart (use affiliate links instead), booking, and
membership.

**Time:** ~35 minutes.

---

## Step 0 — Create your site

```bash
npm run create-project -- reading-list --name "Foundations of Cognitive Science"
cd projects/reading-list
./start.sh
```

Sign in at `/login`.

---

## Step 1 — Branding & your credentials

In **Settings → Appearance** set the **Site name** and an academic **Tagline**
("A curated path through the core literature."). Pick a readable preset and upload
a logo. Then write your bio and credentials on the **About** page (Admin → About)
so readers know who's curating.

---

## Step 2 — Organize by topic (Admin → Topics)

Create your subject areas (e.g. *Perception*, *Memory*, *Language*, *Methods*).
You'll tag every article and book.

---

## Step 3 — Set an affiliate tag for book links (Admin → Settings → Capabilities → Commerce)

You don't need a cart. Leave "I sell products" **off**, but set your **Amazon
affiliate tag** — it's auto-appended to Amazon links so book recommendations can
earn a commission while still sending readers out to buy.

---

## Step 4 — Add the best books (Admin → + Import book)

Use **Admin → + Import book** (paste an ISBN/URL to auto-fill cover, author,
description). Add your **commentary** ("Start here — the
clearest introduction to the field."), assign **topics**, and set the buy link.

**✅ Checkpoint:** books appear as cards with cover, author, your note, and a "Buy"
action that carries your affiliate tag.

---

## Step 5 — Add the latest articles as links (Admin → + New from link / Bulk import)

Paste article/paper URLs → **Fetch** → add **commentary** on relevance → tag with
a topic. Use **Bulk import** to add many at once. This keeps the "latest articles"
current with minimal effort.

---

## Step 6 — Add scholarly metadata with custom fields (Admin → Settings → Custom fields)

Define structured fields that fit a literature list, e.g.:

- **Year** (number) — mark **Use as a browse filter**.
- **Source type** (select: *Paper, Review, Book, Chapter*) — **filterable**.
- **Difficulty** (select: *Intro, Intermediate, Advanced*) — **filterable**.

These appear as a **Details** table on each item and as **filters** when browsing.
For books, add the schema.org property `isbn` to a field to enrich SEO rich
results.

**✅ Checkpoint:** items show a Details table; a topic page lets readers filter by
your fields (e.g. Year, Difficulty).

---

## Step 7 — Build the syllabus as a Collection (Admin → Paths)

Create a path/collection (e.g. "Core Reading Path"), add your key articles and books,
and **order them** into the sequence you'd assign. This becomes a guided reading
path at `/collections/<slug>`.

> Optional: turn on **Lesson progress & resume → Everyone (no login)** so students
> get a progress bar and a **Resume** button to track what they've read — no
> account required.

---

## Step 8 — Home page (Admin → Settings → Home page)

Order sections, e.g.:

1. **Hero** with an intro and a button to the reading path.
2. **Collections** (your reading paths / syllabi).
3. **New releases** (latest added articles) and **Browse by topic**.
4. Optionally a **Newsletter signup** so readers hear about new additions.

Set **commentary on cards → Excerpt** so your "why it matters" notes show while
browsing.

---

## Step 9 — Go live (Admin → Settings → SEO & analytics)

Set a meta description and social image, keep indexing on, optionally add
analytics. Book items emit schema.org structured data automatically, which helps
search. Set `APP_URL` and change owner credentials in `.env` before deploying.

---

## Recommended settings at a glance

| Capability | Setting | Why |
|---|---|---|
| Affiliate tag | **Set** | Earn from book links without running a store |
| Custom fields + filters | **On** | Year/type/difficulty browsing |
| Commentary on cards | **Excerpt** | Your annotations are the value |
| Collections | **Use them** | Turn a list into a guided syllabus |
| Lesson progress | Optional (Anonymous) | Let students track what they've read |
| Newsletter | Optional | Announce new additions |
| Commerce cart / Booking / Membership | Off | Use affiliate links; not a store or service |

**Where this lives (for the curious):** custom fields + filters + schema.org are
in the settings Custom-fields tab and `lib/fields.ts` / `lib/seo.ts`; affiliate
tagging is in the commerce settings; ordering uses `CollectionItem.position`.
