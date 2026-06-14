# Site Architecture — PragerU-Format Video Platform

Stack: **Next.js (App Router) + Sanity CMS + YouTube embeds**, hosted on Vercel. This mirrors PragerU's actual setup (Next.js on Vercel + headless CMS) at near-zero cost until you scale.

## 1. System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Next.js on Vercel                 │
│  (pages, carousels, search UI, account area)         │
└──────┬───────────┬───────────┬───────────┬──────────┘
       │           │           │           │
   Sanity CMS   YouTube     Postgres     Loops/Resend
   (content)    (video      (Neon —      (email capture
                 embeds)     accounts,    + drip courses)
                             favorites)
       │
   Shopify Lite / Stripe ──── shop & donate (offloaded,
                               just like PragerU does)
```

Principle: the site itself is a **catalog renderer**. Video delivery (YouTube), commerce (Shopify/Stripe), and email (Loops) are all offloaded to services — exactly how PragerU keeps a big-feeling site manageable.

## 2. Content Model (CMS schemas)

These five types power the entire site:

**Video**
- title, slug, description, duration
- youtubeId (the embed source)
- thumbnail (auto-pulled from YouTube or custom upload)
- show → reference to Show
- presenter → reference to Presenter (optional, multiple)
- audience: `main | young-adult | kids`
- tags, publishDate, featured (boolean), trending (boolean)

**Show** (= a series/channel, e.g. "5-Minute Videos")
- title, slug, description, artwork
- audience, featured, sortOrder

**Presenter**
- name, slug, bio, headshot, title/credential

**Playlist / Course**
- title, slug, description, coverImage
- videos: ordered array of Video references
- type: `playlist` (browse) | `course` (email drip — one video/day)

**Promo Block** (the "Buzzworthy" sections)
- headline, body, image, CTA label + URL, sortOrder, active

Plus a **Homepage** singleton: hero carousel items, which rows appear in what order, featured show/playlist picks.

## 3. Routes / Site Map

```
/                      Homepage (hero + carousels, all CMS-driven)
/videos/[slug]         Video page: embed, description, show/presenter links, related
/shows                 All shows grid (tabs: featured / young adult / kids)
/shows/[slug]          Show page: artwork, description, episode list
/@[presenter]          Presenter page: bio + their videos
/playlists             Browse playlists ("Start Here")
/playlists/[slug]      Playlist page with ordered videos
/courses/[slug]        Course landing page + email signup form
/kids                  Kids hub (filtered homepage: audience = kids)
/search                Search page
/about, /donate, /shop Static/redirect pages
/account               Logged-in: favorites, watch-later, course progress
```

## 4. Feature Architecture

### Video playback
YouTube embeds via `lite-youtube-embed` (loads a thumbnail, swaps in the real player on click — keeps pages fast, which matters when a homepage shows 50+ video cards). Store only the YouTube ID in the CMS; pull duration/thumbnail from the YouTube Data API at build time so editors never type them manually.

### Homepage carousels
Each row is a CMS query rendered into a horizontal scroll-snap carousel (CSS scroll-snap + buttons — no heavy carousel library needed). Rows: hero, latest, latest kids, shows (tabbed), themed playlist, trending, kids, courses, shop items, promo blocks, presenters. The Homepage singleton in the CMS controls order and visibility, so you rearrange the homepage without deploys.

### Search
Start with Sanity's GROQ full-text search over titles/descriptions (free, zero setup). If the catalog grows past ~1,000 videos or you want typo tolerance, swap in Algolia (free tier: 10k records) — the search page component stays the same.

### Email capture + drip courses
- Provider: **Loops** (or ConvertKit). Site posts email to provider API.
- Each Course = a Loop/sequence in the provider: day 1 → email with video 1 link, etc.
- Signing up for "Socialism 101" = adding the contact to that sequence with a tag.
- No custom email infrastructure; the CMS Course type just documents which videos belong to which sequence.

### Accounts
- **Auth.js (NextAuth)** with Google + email magic-link sign-in.
- **Neon Postgres** (free tier) with three tables: `users`, `favorites (user_id, video_slug)`, `watch_later (user_id, video_slug)`.
- Course progress optionally tracked here too.
- This is the only part requiring a database — everything else is CMS + static generation.

### Kids section
Not a separate site: `audience` field on Video/Show drives a filtered `/kids` hub with its own visual theme (brighter palette via a layout wrapper). Same components, different query + skin.

### Shop & donate
Mirror PragerU's approach — don't build commerce:
- **Shop**: Shopify Basic/Starter on a subdomain or Shopify Buy Buttons embedded in the shop carousel. Site just renders product cards (image, name, price, link).
- **Donate**: Stripe Payment Links or Donorbox embed. One page, zero backend.

## 5. Build Phases

**Phase 1 — Core catalog (1–2 weeks)**
Next.js project, Sanity schemas, video/show/presenter/playlist pages, homepage with carousels, kids filter, search (GROQ). *This alone is "the PragerU format."*

**Phase 2 — Growth layer (1 week)**
Email capture, drip courses via Loops, promo blocks, donate page.

**Phase 3 — Accounts (1–2 weeks)**
Auth.js + Neon, favorites/watch-later, account page.

**Phase 4 — Commerce + polish (ongoing)**
Shopify shop, Algolia search upgrade, OG images, analytics (Plausible/GA4), sitemap/SEO.

## 6. Monthly Cost

| Service | Tier | Cost |
|---|---|---|
| Vercel | Hobby | $0 |
| Sanity | Free (3 users) | $0 |
| YouTube | — | $0 |
| Neon Postgres | Free | $0 |
| Loops/ConvertKit | Free up to ~1k contacts | $0 |
| Domain | — | ~$12/yr |
| Shopify (only if shop) | Starter | $5/mo |
| Algolia (only if needed) | Free 10k records | $0 |

**$0–5/month** until real traffic.

## 7. Key Decisions Locked In

1. **YouTube as the video backbone** — your channel is the source of truth for video files; the site is the curated, branded front door (PragerU works the same way; their videos live on YouTube/Rumble too).
2. **Sanity over DatoCMS** — same headless pattern PragerU uses, but a more generous free tier and better Next.js tooling. (Payload CMS is the alternative if you want everything self-contained in the Next.js repo.)
3. **Static generation with ISR** — pages rebuild on CMS publish via webhook. Fast, cheap, no servers to manage.
4. **Offload everything transactional** — email, commerce, donations, auth providers. Custom code is only: rendering, taxonomy, and the favorites database.
