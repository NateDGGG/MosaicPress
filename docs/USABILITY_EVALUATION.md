# Mosaic Learn — Usability Evaluation

**Date:** June 14, 2026
**Scope:** Heuristic walkthrough of the running application from two goal-driven personas: (1) an **admin** standing up an information hub quickly, and (2) a **learner** trying to understand a topic fast. Findings are grounded in the actual shipped routes, admin tools, and content flows.

Severity scale: **High** (blocks or materially slows the goal), **Medium** (noticeable friction or repeated annoyance), **Low** (polish / nice-to-have).

---

## Executive summary

Mosaic Learn is unusually strong at the *creation* end: an admin can go from nothing to a themed, populated, PragerU-style hub in well under an hour, largely because content can be ingested from links in bulk rather than authored by hand. The configuration model (theme packages, a drag-to-order homepage builder, optional commerce) means most setup happens without touching code or the database.

The weaker end is *guided consumption*. The learner experience is excellent for browsing and searching, but it does not yet actively move a learner through a topic — there are no related/next suggestions, no learning paths, and no progress tracking. A motivated learner can find things; the product doesn't yet help a learner finish things.

Both personas are well served on the fundamentals (clear IA, fast theming, real content) and share the same biggest opportunity: **turning a pile of items into a sequenced journey.**

---

## Persona 1 — Admin building a rapid information hub

**Goal:** "I have a subject and a list of sources. Get me a credible, branded hub published today."

### What works well

- **Link-first ingestion is the standout feature.** "New from link" auto-extracts metadata from YouTube, Wikipedia, Amazon, and generic pages, and **Bulk import** accepts a pasted list of URLs at once. For an admin assembling a curated hub, this collapses the most expensive step (content entry) into paste-and-go. **Import a book** and **Add a product** extend the same pattern to other media.
- **No-code configuration.** Identity, theme package, colors, light/dark, and footer all live in Settings and apply site-wide instantly. An admin never edits a config file to rebrand.
- **The homepage builder matches the mental model of "arrange my hub."** Sections (New, Featured, Browse by topic, Collections, per-type rails) plus custom text blocks can be toggled and reordered, so the front page reflects editorial intent rather than a fixed template.
- **Sensible taxonomy primitives.** Presenters, Topics (with a default topic so nothing is ever untagged), Collections, and a "featured" flag give enough structure to organize a few hundred items without a heavyweight CMS.
- **Operational hygiene is built in.** A **Health** view surfaces link rot, **Media** centralizes uploads, scheduled publishing and draft/publish states exist, and full-text **Search** works in the admin's favor too.
- **Commerce and membership are opt-in.** The master "I sell products" toggle keeps the catalog clean for admins who only want an info hub, while still allowing a store later — a good progressive-disclosure decision.

### Friction & gaps

| # | Finding | Severity | Why it slows the goal |
|---|---------|----------|----------------------|
| A1 | **No first-run/onboarding guidance.** The admin dashboard opens on an item table; there's no checklist ("set your name → pick a theme → import your first links → arrange the homepage"). | Medium | A new admin has to discover the (excellent) ingestion tools on their own. The fastest path isn't signposted. |
| A2 | **Topic-on-homepage control is split across two screens.** Which topics appear under "Browse by topic" is set per-topic in *Topics*, but the section itself is toggled in *Settings → Home page*. | Medium | Admins reasonably expect to choose homepage topics where they build the homepage; the split causes "why isn't my topic showing?" confusion. |
| A3 | **Five separate "Add" entry points** (New, New from link, Import book, Bulk import, New product) in the toolbar. | Low–Medium | Powerful but cognitively heavy; a single "Add content" entry that branches by source would reduce choice paralysis. |
| A4 | **No bulk content management.** Items are imported in bulk but then edited one at a time — no multi-select to tag, assign a presenter, feature, publish, or delete. | Medium | After a 50-URL bulk import, organizing the result is slow and repetitive. |
| A5 | **Settings is one long form.** Identity, theme, homepage builder, and commerce all live on a single page. | Low | Scrolling/scanning cost; section tabs or anchored nav would help. |
| A6 | **No live preview of homepage/theme changes.** The builder and theme picker require save + visit home to see results. | Medium | Slows the iterate-on-look loop, which is exactly what a "rapid" admin does most. |
| A7 | **Inventory/commerce fields are quietly conditional.** Stock badges and the low-stock threshold only do anything once *Track inventory* is on; the editor's inventory field gives no hint of this. | Low | Minor "why isn't this working" moments. |
| A8 | **Trust depends on import quality.** Auto-extracted summaries/cover images vary by source; there's no flagging of "thin" imports needing review. | Low | For a credibility-sensitive hub, a "needs review" state would help. |

### Top recommendations (admin)

1. **Add a guided first-run checklist** on the dashboard that links directly to theming, bulk import, and the homepage builder. Highest leverage for the "today" goal.
2. **Add multi-select bulk actions** to the content table (tag, feature, set presenter, publish, delete). Pairs naturally with bulk import.
3. **Unify homepage topic selection** into the homepage builder (or cross-link the two screens with a clear note).
4. **Add a live preview** (split pane or "preview" button) for theme + homepage changes.

---

## Persona 2 — Learner exploring a topic quickly

**Goal:** "I'm curious about a subject. Get me oriented and through the key ideas without friction."

### What works well

- **The front door is genuinely fast.** A hero, "New releases" / "Featured" rails, and "Browse by topic" chips let a learner self-route in one click. The five-minute-lesson framing sets the right expectation.
- **Strong scent of information on cards.** Each item card shows type, duration (for video), presenter/author, members-only lock, and source (hosted vs external) — a learner can predict the payoff before clicking.
- **Multiple navigation axes.** Topics, Presenters, full-text Search, and a filter sidebar mean a learner can come at a subject by theme, by voice, or by keyword.
- **Clean consumption pages.** Item pages embed video inline where allowed, render articles as structured blocks, and present books well; external items attribute their source clearly and open out safely.
- **Low barrier to start.** Most content is viewable without an account; membership gating is reserved for flagged items and shows a teaser rather than a hard wall.

### Friction & gaps

| # | Finding | Severity | Why it slows the goal |
|---|---------|----------|----------------------|
| L1 | **No "what next" on item pages.** After finishing an item there are no related items, no "more in this topic," and no next-in-sequence link. | **High** | This is the single biggest gap for "learn quickly." The product helps you *start* but not *continue*; the learner has to navigate back and re-orient every time. |
| L2 | **Topic pages are flat, unordered grids.** A topic shows its items in a generic grid with no sequencing (intro → core → advanced) and no sort control. | **High** | A learner landing on a topic can't tell where to begin or in what order to proceed — the core "learn a topic" path is undirected. |
| L3 | **Collections aren't surfaced to learners.** Collections exist and can appear on the homepage, but there's no top-level nav entry, so curated paths are easy to miss. | Medium | The one feature closest to a "learning path" is under-exposed. |
| L4 | **No progress, history, or save/bookmark.** Anonymous and logged-in learners alike can't mark items watched, resume, or save for later; the account page shows membership but not even order/learning history. | Medium | Multi-session learning has no memory; learners re-find rather than resume. |
| L5 | **Search rewards vocabulary, not curiosity.** Search is keyword full-text with no suggestions, "did you mean," or topic facets in results. | Medium | A learner who doesn't yet know the right terms gets weaker results — exactly the novice case. |
| L6 | **No difficulty/length signals beyond video duration.** Articles/books don't advertise read time or level. | Low | Harder to pick the right next item for the time available. |
| L7 | **Membership teaser can interrupt momentum.** A locked item mid-exploration breaks the quick-learn flow. | Low | Acceptable as a business decision, but worth A/B attention. |

### Top recommendations (learner)

1. **Add "Related" / "Next" to item pages** (same topic and/or same presenter, plus next-in-collection). Directly addresses L1 and is the highest-impact learner change.
2. **Make topic pages directable:** allow an admin-defined order (or at least sort by newest/oldest/recommended) and an optional short topic intro. Addresses L2.
3. **Promote Collections as "Learning paths"** with a nav entry and a progress indicator. Turns existing data into a guided journey (L3 + partial L1/L2).
4. **Add lightweight progress/bookmarking** ("watched," "save for later," "continue") for logged-in users. Addresses L4.

---

## Cross-cutting observations

- **The shared opportunity is sequencing.** Both personas converge on the same missing capability: the admin can *assemble* a hub but can't easily express an intended *order*, and the learner therefore can't *follow* one. Investing in ordered collections / learning paths simultaneously improves authoring (A-side) and consumption (L-side) — the best ROI on this list.
- **Progressive disclosure is done well.** Optional commerce, membership, and inventory are off by default and reveal their sub-options only when enabled. This keeps the info-hub use case uncluttered. Continue that pattern for any new features.
- **The data model is ahead of the UI in places.** Collections, presenters, and topics already exist and are richer than the learner UI currently exposes — several high-impact wins are surfacing existing data, not building new systems.
- **Accessibility & mobile** were not formally audited here; recommend a dedicated pass (focus states, color-contrast of theme packages, keyboard nav of the homepage builder, card tap targets) before a public launch.

## Prioritized roadmap (combined)

| Priority | Change | Personas served | Effort (est.) |
|----------|--------|-----------------|---------------|
| P0 | Related / Next on item pages | Learner | Low–Med |
| P0 | Orderable topic pages + topic intro | Learner, Admin | Med |
| P1 | Collections as nav-level "Learning paths" | Learner, Admin | Med |
| P1 | Admin first-run checklist | Admin | Low |
| P1 | Bulk content actions (multi-select) | Admin | Med |
| P2 | Live preview for theme/homepage | Admin | Med |
| P2 | Progress / bookmarking | Learner | Med |
| P2 | Unify homepage topic selection | Admin | Low |
| P3 | Search suggestions + result facets | Learner | Med |
| P3 | Read-time / difficulty signals | Learner | Low |

---

## Method & limitations

This is an expert heuristic evaluation based on a structured walkthrough of the application's admin tools and learner-facing routes, not a moderated study with real users. Findings reflect task flows and information architecture as built; severity reflects likely impact on each persona's stated goal. Quantitative validation (task-completion time, success rate, drop-off) and an accessibility audit are recommended next steps before launch.
