# Codelab 3 — A news / updates hub for a topic

**Goal:** a site people visit regularly for the latest on a topic — a fast-moving
mix of your own posts and curated links from around the web, with email signup so
readers come back.

**You'll use:** **link** items (curated, with your commentary) + **blog** posts,
fast capture via **New from link** and **bulk import**, the **New releases** rail,
**scheduled publishing**, a **newsletter**, and SEO/analytics.

**You'll skip:** commerce, booking, and lesson-progress tracking. (Membership only
if you add a paid tier.)

**Time:** ~30 minutes.

---

## Step 0 — Create your site

```bash
npm run create-project -- topic-news --name "AI Weekly"
cd projects/topic-news
./start.sh
```

Sign in at `/login`.

---

## Step 1 — Branding (Admin → Settings → Appearance)

Set the **Site name** and a punchy **Tagline** ("Your weekly briefing on applied
AI."). Pick a clean **Style preset**; upload a logo. A simple, text-forward look
suits a news hub.

In **Content** (Settings → Home page area), set **Show your commentary on
home-page cards** to **Excerpt** — your editorial take is what makes a curated hub
worth visiting.

---

## Step 2 — Set up topics (Admin → Topics)

Create the sub-topics you'll track (e.g. *Research*, *Policy*, *Tools*,
*Industry*). Readers use these to filter; you tag each update.

---

## Step 3 — Curate fast with links (Admin → + New from link)

This is your core workflow. Paste an article/video URL → **Fetch** (Mosaic pulls
the title, image, summary, and source) → add a one-line **commentary** ("Why it
matters: first credible benchmark for…") → assign a **topic** → **Publish**.

Got a batch? Use **Admin → Bulk import** to paste many URLs at once. Keep
**Auto-fetch preview images** on (Settings → Content) so covers appear
automatically.

**✅ Checkpoint:** linked updates appear as cards showing the source and your take,
opening out to the original.

---

## Step 4 — Publish your own posts (Admin → + Write blog)

Use **blog** for original write-ups (weekly roundups, analysis). Markdown/HTML
with an image and topics. Mix these with your curated links.

---

## Step 5 — Schedule ahead (optional)

Drafting a roundup for Monday? In the editor set **Schedule publish for** a future
time and **Schedule**. It stays hidden until then. On a server, the `publish:due`
job (run on a cron) flips scheduled posts live automatically.

**✅ Checkpoint:** a scheduled post is hidden now and appears at its time.

---

## Step 6 — Capture subscribers (Admin → Settings → Capabilities → Newsletter)

Enable **Newsletter** with a compelling heading ("Get the briefing every
Monday"). Subscribers appear in **Admin → Subscribers** and export as CSV for your
email tool.

---

## Step 7 — Home page tuned for "what's new" (Admin → Settings → Home page)

Order sections for a returning reader:

1. **Hero** — set *Hero showcases → Latest / featured item* so the top story
   updates itself.
2. **New releases** — the freshest items (set a preview count).
3. **Browse by topic**.
4. **Newsletter signup**.

Optionally add an **Editor's notes** section to spotlight a few items with your
full commentary, and turn on the **left sidebar** for type/topic filtering if your
volume is high.

**✅ Checkpoint:** the home page always leads with the latest update and invites a
signup.

---

## Step 8 — Go live & measure (Admin → Settings → SEO & analytics)

Set a meta description and social image, keep **indexing on**, and paste an
**analytics snippet** (GA/Plausible/Fathom) to watch traffic. A **sitemap** is
served at `/sitemap.xml` automatically. Set `APP_URL` and change owner credentials
in `.env` before deploying.

---

## Recommended settings at a glance

| Capability | Setting | Why |
|---|---|---|
| Newsletter | **On** | Bring readers back regularly |
| Commentary on cards | **Excerpt** | Your take is the value-add |
| Scheduled publishing | **Use it** | Line up updates in advance |
| Analytics | **On** | Know what readers engage with |
| Commerce / Booking / Progress | Off | Not relevant to a news hub |
| Membership | Optional | Only for a paid premium tier |

**Where this lives (for the curious):** link ingestion is `CODEBASE_GUIDE.md` §7;
commentary is §10c; scheduling is §10b; newsletter/analytics are opt-in
capabilities + the SEO section.
