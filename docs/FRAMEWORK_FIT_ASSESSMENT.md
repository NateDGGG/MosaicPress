# Framework Fit Assessment — Five Use Cases

**Date:** June 15, 2026
**Subject:** How well the current platform (Mosaic / "Prager Learn" core) serves five distinct site types — what's present, what's missing, and how easy it is to stand up.

## What the framework provides today (baseline)

- **Asset types:** article (block editor), blog (markdown/HTML), video (hosted or embedded), product (hosted checkout *or* external/affiliate), link (curated, with commentary + date + image), book.
- **Organization:** topics (tags), presenters (authors/hosts with pages), collections / "learning paths" (ordered, with progress).
- **Home page:** drag-order section builder (new, featured, topic rails, type rails, custom text, "Editor's notes"), per-section preview counts & commentary, hero (gradient / full image / split).
- **Commerce (optional toggle):** cart, Stripe checkout (stub without keys), physical/digital products, shipping step, inventory + low-stock, orders (admin + customer pages), ship-notification email; external/affiliate products with Amazon tag auto-append and a "recommended" shop section.
- **Membership:** plans, recurring subscriptions, members-only gating, join/account pages.
- **Editorial voice:** owner commentary on every asset ("From the editor" + a home Editor's-notes band).
- **Authoring speed:** add-from-link (auto-detect type + auto-fetch preview image), bulk import (with type override), book import, media uploads (local/S3).
- **Learner/visitor features:** full-text search (with facets), related/next, save-for-later, mark-complete + progress, read-time, difficulty.
- **Pages:** home, topics, presenters, collections, shop, blog, links, search, customizable About, item pages, account.
- **Customization:** one-click style presets + hero, logo/favicon, fonts, radius, color roles, card style (all with a live preview).
- **Platform:** roles (owner/editor/contributor/member), scheduled publishing, transactional email, Docker/Postgres deploy, accessibility/mobile pass, per-item SEO title/description.

**Recurring gaps (matter to most personas below):** no **contact / lead-capture form**, no **newsletter/email-list capture**, no **booking/scheduling**, no **testimonials/reviews** component, no **structured recipe** type, and limited **SEO depth** (no sitemap / schema.org structured data) and **no analytics**.

---

## 1) Professional portfolio (promote services)

**Goal:** showcase work, establish credibility, convert visitors to inquiries.

**Fit: 3.5 / 5 · Ease: 4.5 / 5**

**Present & strong**
- Branding gets to "looks professional" fast: presets + hero image + logo + fonts + live preview.
- About page for bio; blog for thought leadership; **link** items (with commentary + image + date) are an excellent "selected work / press / case studies" feed.
- Collections to group projects into a portfolio set; presenters to represent the person.
- SEO title/description per item.

**Missing / friction**
- **No contact form** — the #1 gap; a portfolio must capture inquiries. Today you can only link out (email/Calendly) via a link or text block.
- **No testimonials** component (social proof) — would be faked with text blocks.
- **No case-study template** (gallery, problem→solution layout); articles/blog approximate it but aren't project-shaped.
- No services/pricing table beyond using products or text.

**Verdict:** Great for a polished content+work showcase; the missing contact form is the main blocker to "promote services."

---

## 2) Small business — info + a limited shop of services

**Goal:** explain services, sell a few of them, be reachable.

**Fit: 4 / 5 · Ease: 4 / 5**

**Present & strong**
- **Commerce is opt-in and quick:** flip "I sell products," add a handful of services as products (digital kind skips shipping), and the shop/cart/checkout/orders flow works end-to-end (Stripe or safe stub).
- Topics to organize service categories; blog/About for info; presets for a credible look.
- Orders admin + customer order pages; email receipts.

**Missing / friction**
- **No booking/appointment scheduling** — service businesses usually sell *time*; products model packages but not calendar slots.
- **No contact form / business hours / map** (NAP info) — important for local trust/SEO.
- "Product" vocabulary is goods-flavored (shipping, inventory) — works for services but isn't service-native.
- No reviews.

**Verdict:** Strong for "info + a small catalog of paid services." Add a contact form and (optionally) booking and it's a complete small-business site.

---

## 3) Life-coaching professional (offer coaching)

**Goal:** sell coaching packages/retainers, nurture leads, deliver client resources.

**Fit: 4 / 5 · Ease: 4 / 5**

**Present & strong**
- **Membership is a natural fit:** recurring plans = retainers/monthly coaching; members-only gating = a client resource area; account page for clients.
- Products for one-off packages/sessions; checkout + receipts.
- Blog + commentary establish authority and voice; collections = a coaching curriculum with progress tracking (clients can mark complete).
- Save-for-later/progress give a light "client journey."

**Missing / friction**
- **No booking/scheduling** — the core coaching action (book a call). Must offload to Calendly via a link/embed.
- **No intake/lead form** (free-consult capture).
- **No testimonials** (coaching sells heavily on transformation stories).
- Member tiers are content-gating; not true 1:1 client management (notes, per-client files).

**Verdict:** The membership + curriculum + progress stack is a genuinely good coaching backbone. Booking and lead capture are the missing revenue-critical pieces.

---

## 4) Ethnic-cooking recipes hub + affiliate ingredient links

**Goal:** publish recipes by cuisine, recommend ethically-sourced ingredients via affiliate links, monetize.

**Fit: 4.5 / 5 · Ease: 4.5 / 5** (best-fit of the five)

**Present & strong**
- **Affiliate model is first-class:** external/affiliate **products** + Amazon-tag auto-append + a "recommended" shop section; and **link** items with commentary are perfect for "this ingredient, sourced ethically because…".
- **Topics = cuisines**, collections = meal plans / recipe series, related/next keeps people cooking.
- Fast content ops: add-from-link, bulk import, auto-fetched images; commentary gives editorial warmth; search + facets for discovery.
- Optional commerce if they later sell their own spice kits.

**Missing / friction**
- **No structured "recipe" type** — ingredients list, steps, prep/cook time, servings, yield; recipes are currently a blog/article (works, but unstructured).
- **No recipe schema.org / rich-results markup** — big for cooking SEO (Google recipe cards). Per-item SEO text exists, but not structured data.
- **No recipe-specific filters** (by diet, time, ingredient) beyond topics/search.
- **No ratings** / "made it" engagement.
- No newsletter capture (recipe sites live on email).

**Verdict:** Closest fit out of the box — affiliate + commentary + topics nail the model. A dedicated recipe type with structured fields + recipe schema would take it from "great" to "category-leading."

---

## 5) Health education — reducing toxins

**Goal:** teach via credible, structured content; recommend non-toxic products; build an audience.

**Fit: 4 / 5 · Ease: 4 / 5**

**Present & strong**
- **Learning paths + difficulty + read-time + progress** make a real "reduce toxins" curriculum, not just a blog.
- **Link** items = cite studies/sources with your commentary on why they matter (credibility); related/next for guided reading.
- Affiliate products/links for vetted non-toxic product recommendations.
- Membership for premium guides; commentary/Editor's-notes for an authoritative editorial voice; search.

**Missing / friction**
- **No newsletter / email-list capture** — health/education audiences are built on email; only transactional email exists today.
- **No citation/reference system** (footnotes, source lists) beyond link items — evidence-heavy content wants structured references.
- **No medical-disclaimer / trust scaffolding** (author credentials, "reviewed by," last-updated badges). Presenters have pages but not a credentials/credential-badge model.
- Limited SEO depth (no structured data/sitemap) for a competitive health niche.

**Verdict:** Solid education backbone (paths, difficulty, sources-as-links, membership). Newsletter capture and lightweight citation/credibility features are the main gaps for trust and growth.

---

## Cross-cutting summary

| Capability | Portfolio | Small biz | Coaching | Recipes | Health |
|---|:--:|:--:|:--:|:--:|:--:|
| Content authoring & look (presets) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sell products/services | ➖ | ✅ | ✅ | ➖ | ➖ |
| Affiliate monetization | ➖ | ➖ | ➖ | ✅ | ✅ |
| Membership / recurring | ➖ | ➖ | ✅ | ➖ | ✅ |
| Structured curriculum / progress | ➖ | ➖ | ✅ | ✅ | ✅ |
| **Contact / lead form** | ❌ | ❌ | ❌ | ➖ | ➖ |
| **Newsletter capture** | ➖ | ➖ | ❌ | ❌ | ❌ |
| **Booking / scheduling** | ➖ | ❌ | ❌ | — | — |
| **Testimonials / reviews** | ❌ | ➖ | ❌ | ➖ | ➖ |
| **Structured recipe + schema** | — | — | — | ❌ | — |
| SEO structured data / sitemap | ➖ | ➖ | ➖ | ❌ | ❌ |

✅ strong · ➖ workable but not native · ❌ missing & important · — not relevant

### Highest-leverage gaps to close (ranked by how many personas they unblock)

1. **Contact / lead-capture form** (a simple form builder → email/stored submissions). Helps 4 of 5. Single biggest unlock.
2. **Newsletter signup + list export/integration.** Helps recipes, health, coaching.
3. **Booking/scheduling** (native or a first-class embed block). Critical for coaching and service businesses.
4. **Testimonials / reviews** component (and item ratings). Broadly useful social proof.
5. **Structured recipe type + schema.org rich data** (and a general structured-data/sitemap pass). Transformative for the recipes hub; SEO lifts all.

### Ease-of-use (overall)

Setup is genuinely approachable for non-developers: **style presets** + **add-from-link** + **live preview** + the **first-run checklist** mean a credible, populated site in well under an hour, and the optional-commerce/membership toggles keep complexity hidden until needed. The friction is **not** configuration — it's **capability gaps** (forms, booking, newsletter) that currently force owners to bolt on third-party tools via links/embeds. Closing the top-two gaps (contact form + newsletter) would make four of these five personas fully self-serve.

**Bottom line:** the platform is already a strong fit for **content + affiliate + membership** sites (recipes, health, coaching lean this way) and a good fit for a **small service shop**; it's weakest where a site needs **interaction back from visitors** (contact, booking, newsletter, reviews). Those interaction primitives are the clear next investment.
