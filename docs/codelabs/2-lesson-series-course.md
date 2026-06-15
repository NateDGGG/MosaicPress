# Codelab 2 — Teach a topic as a series of lessons (a course)

**Goal:** a self-paced course — ordered, multimedia lessons where finishing one
leads to the next, and the site remembers where each learner left off **without
requiring a login**.

**You'll use:** **collections** (as the course), **article** lessons with mixed
media (text + images + embedded video), **lesson-progress tracking**
(anonymous), topics, and an optional newsletter.

**You'll skip:** commerce and booking. (Turn on membership only if some lessons
are paid.)

**Time:** ~35 minutes.

---

## Step 0 — Create your site

```bash
npm run create-project -- my-course --name "Learn Astronomy"
cd projects/my-course
./start.sh
```

Sign in at `/login`. You have an empty site.

---

## Step 1 — Branding (Admin → Settings → Appearance)

Set the **Site name** and a learning-focused **Tagline** ("Understand the night
sky in short lessons."), pick a **Style preset**, and optionally upload a logo.
Set the **header button** to "Start learning" pointing at your course (you'll get
its link in Step 4).

---

## Step 2 — Add topics (Admin → Topics)

Create a few subject areas (e.g. *The Solar System*, *Stars*, *Galaxies*). Topics
let learners browse and help you organize lessons.

---

## Step 3 — Create lesson pages with mixed media (Admin → + New)

For each lesson:

1. **+ New** (an article), give it a title (e.g. "Lesson 1 — What is a star?"),
   **Create draft**.
2. In the **Body**, combine blocks: **Paragraph** text, an **Image** (Upload), and
   an **Embed** block with a YouTube/Vimeo URL for video. Add a **Heading** and a
   **List**. This is your multimedia lesson page.
3. Optionally set **Difficulty** and let read-time auto-calculate.
4. **Save & publish.** Repeat for each lesson.

> Tip: you can also create **video** items if a lesson is mostly a single video.

**✅ Checkpoint:** opening a lesson shows your text, image and an inline video
player on one page.

---

## Step 4 — Assemble the course as a Collection (Admin → Paths)

1. **Admin → Paths → New** (a "Path" is a collection); name it (e.g. "Astronomy 101") with a short
   description and cover image.
2. **Add your lessons** to it and **drag them into order** — this order is the
   path learners follow.
3. Visit `/collections/<your-collection>` to see the course page.

**✅ Checkpoint:** the collection page lists lessons 1..N in order with a "Start
path" button.

---

## Step 5 — Turn on resume-where-you-left-off (Admin → Settings → Capabilities → Lesson progress & resume)

Set **Who gets progress tracking** to **"Everyone — no login needed (saved on the
device)."**

Now, on a lesson page learners get **"Complete & continue →"** (marks the lesson
done and jumps to the next), and the course page shows a **progress bar** with a
**Resume** button that returns them to the first unfinished lesson — all without
an account. If a learner later signs in, their device progress merges into their
account.

> Prefer to require accounts? Choose "Signed-in visitors only." Don't want any
> tracking? Choose "No tracking."

**✅ Checkpoint:** complete a lesson, return to the course page — it shows "1 of N
complete" and the button now says **Resume**.

---

## Step 6 — Home page (Admin → Settings → Home page)

Order sections so a newcomer knows where to start:

1. **Hero** — set *Hero showcases → A specific item* and pick your course's first
   lesson, or point the hero button at the collection.
2. **Collections** rail (your course/learning paths).
3. **New releases** (latest lessons).
4. Optionally a **Newsletter signup** section (Step 7).

---

## Step 7 — Keep learners coming back (optional)

- **Newsletter** (Capabilities) — collect emails to announce new lessons;
  subscribers export as CSV.
- **Membership** (Capabilities) — only if you want some lessons paid: add a plan
  in **Admin → Plans**, then set a lesson's **Access: Members only**.

---

## Step 8 — Go live (Admin → Settings → SEO & analytics)

Set a meta description and social image, keep indexing on, optionally add
analytics. Set `APP_URL` and change the owner credentials in `.env` before
deploying.

---

## Recommended settings at a glance

| Capability | Setting | Why |
|---|---|---|
| Lesson progress | **Anonymous** | Resume without forcing sign-up — lowest friction |
| Newsletter | **On** | Announce new lessons |
| Membership | Optional | Only if lessons are paid |
| Commerce | Off | Not a shop (use membership for paid courses) |
| Booking | Off | Not relevant |

**Where this lives (for the curious):** the course player is documented in
`CODEBASE_GUIDE.md` §10d (progress/learner, "Complete & continue", Resume);
ordering comes from `CollectionItem.position`.
