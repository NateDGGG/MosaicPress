# Codelab 1 — Professional portfolio (bio, career & services)

**Goal:** a polished personal site that shows who you are and what you do, builds
credibility, and turns visitors into inquiries and booked calls.

**You'll use:** branding + hero, the About page, **link** items (selected
work/press), a blog, **testimonials**, a **contact form**, and **booking**.

**You'll skip:** commerce, membership, and lesson-progress tracking — a portfolio
doesn't need them.

**Time:** ~30 minutes.

---

## Step 0 — Create your site

```bash
npm run create-project -- my-portfolio --name "Jordan Rivera"
cd projects/my-portfolio
./start.sh
```

Open http://localhost:3000 and sign in at `/login` (`owner@example.com` /
`changeme123` — change these in `.env`). You have an empty site and an admin.

**✅ Checkpoint:** the home page loads with your name and an empty content area.

---

## Step 1 — Make it look like *you* (Admin → Settings → Appearance)

1. **Style preset** — pick one (e.g. *Editorial* or *Minimal*) for an instant
   coherent look. Hover any **?** for guidance.
2. **Identity** — set your **Site name** (your name or studio) and a one-line
   **Tagline** ("Brand & product designer for early-stage teams").
3. Open **Advanced appearance → Branding & header** and **upload a logo** (or your
   wordmark) and a **favicon**.
4. **Hero banner** — choose the **split (gradient + your image)** or **full image**
   layout and upload a professional photo. Add a **Hero subtitle**.
5. **Header button** — set label **"Book a call"** linking to `/book` (you'll turn
   booking on in Step 5). Save.

**✅ Checkpoint:** the header shows your logo and a "Book a call" button; the hero
shows your photo and tagline. The live preview reflects every change.

---

## Step 2 — Write your bio (Admin → About)

Use the **About** editor for your story, experience and what you offer. This is
your career/bio page; link it from the hero or header if you like.

**✅ Checkpoint:** `/about` shows your bio.

---

## Step 3 — Add selected work & press as **link** items

For each project, case study, talk, or press mention, use **Admin → + New from
link**, paste the URL, and let Mosaic fetch the title and image. Add your own
**commentary** ("My role: end-to-end product design; outcome: 40% faster
onboarding"). Repeat for a handful.

Prefer to write full case studies? Use **+ New → article** with the block editor
(text, images, embedded video).

**✅ Checkpoint:** your work appears as uniform cards; linked items show their
source and open outward.

---

## Step 4 — Add thought leadership with the blog (optional)

**Admin → + Write blog** for articles/notes that show expertise. A blog rail
keeps the site fresh and helps SEO.

---

## Step 5 — Turn on the lead-capture features (Admin → Settings → Capabilities)

- **Contact form** — enable it; set a heading and your **notify email**. Adds a
  `/contact` page and a nav link; messages also appear in **Admin → Messages**.
- **Booking** — enable it. Use the **built-in request form**, or choose **embed**
  and paste your Calendly/Cal.com URL. Adds the `/book` page your header button
  points to.
- **Testimonials** — enable it and add 3–5 client quotes (**Admin →
  Testimonials**) for social proof.

Leave **Commerce**, **Membership**, and **Lesson progress** off.

**✅ Checkpoint:** `/contact` and `/book` work; a testimonials section can be shown
on the home page.

---

## Step 6 — Arrange the home page (Admin → Settings → Home page)

Order the sections to tell your story top-to-bottom, e.g.:

1. A **custom text block** intro ("I help teams ship better products.")
2. **Selected work** — a rail of your link/article items.
3. **Testimonials**.
4. **Blog** (latest posts).

Set the **hero** to show a specific flagship item or just your text + buttons
(Hero showcases → *Nothing*). Primary button "See my work", secondary "Get in
touch" → `/contact`.

**✅ Checkpoint:** the home page reads like a portfolio: intro → work → proof →
writing, with clear calls to action.

---

## Step 7 — Go live (Admin → Settings → SEO & analytics)

- **Default meta description** — a sharp sentence for search/social.
- **Default social share image** — upload your headshot or brand image.
- **Twitter/X handle**, and keep **Allow indexing** on.
- Optionally paste an **analytics snippet** to measure visits.

Before deploying: change the owner email/password in `.env`, set `APP_URL` to your
real domain (so share links and the sitemap are correct), and add SMTP keys if you
want contact/booking emails delivered (otherwise they're stored in admin).

**✅ Checkpoint:** sharing your URL shows a branded preview; `/sitemap.xml` lists
your pages.

---

## Recommended settings at a glance

| Capability | Setting | Why |
|---|---|---|
| Contact form | **On** | The #1 way to capture inquiries |
| Booking | **On** | Let prospects book a call directly |
| Testimonials | **On** | Social proof converts |
| Newsletter | Optional | Stay in touch with followers |
| Commerce | Off | Not selling goods (use booking/products only if you productize) |
| Membership | Off | No gated content |
| Lesson progress | Off | Not a course |

**Where this lives (for the curious):** branding/hero/header in
`CODEBASE_GUIDE.md` §15 + the settings form; contact/booking/testimonials are
opt-in capabilities; About is `app/admin/about`.
