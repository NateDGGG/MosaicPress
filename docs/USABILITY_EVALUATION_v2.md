# Mosaic Learn — Usability Evaluation (v2, re-run)

**Date:** June 14, 2026
**Context:** Re-evaluation after a full cycle of improvements implemented in response to v1 (`USABILITY_EVALUATION.md`). Same two personas: (1) an **admin** standing up an information hub quickly, and (2) a **learner** trying to understand a topic fast.

This version adds dimension scores (1–10) for each persona, with the v1 baseline shown for comparison, plus a traceability table mapping every v1 finding to what shipped.

---

## Executive summary

The product has moved from "great at creation, undirected for consumption" to **strong on both ends.** Every v1 P0 and P1 recommendation shipped, along with the two highest-value P2/P3 items. The learner experience in particular changed character: it now actively *moves* a learner — related/next suggestions, ordered topics, learning paths, saved/completed state, and content signals replace what was previously a flat browse-and-search catalog. On the admin side, a first-run checklist, bulk operations, and a live settings preview remove the biggest time sinks.

Remaining gaps are now genuinely minor (a couple of admin discoverability nits) plus one untouched area that warrants its own pass: **accessibility & mobile**, which neither evaluation has formally tested.

**Headline scores (avg of dimensions below):**

- Admin persona: **6.3 → 8.7** (+2.4)
- Learner persona: **5.7 → 8.8** (+3.1)

---

## Persona 1 — Admin building a rapid information hub

| Dimension | v1 | v2 | What moved it |
|-----------|----|----|---------------|
| Onboarding & guidance | 4 | 8 | First-run checklist on the dashboard with deep links and progress count |
| Content ingestion | 9 | 9 | Already excellent (link-first + bulk import); unchanged |
| Organization & structure | 6 | 9 | Learning paths (collections) now creatable; orderable topics with intros |
| Homepage & branding control | 7 | 9 | Live preview pane updates as you edit theme/identity/sections |
| Bulk operations & efficiency | 3 | 9 | Multi-select with publish/unpublish/feature/tag/delete action bar |
| Commerce (optional) | 8 | 8 | Already opt-in and clean; unchanged this cycle |
| **Average** | **6.2** | **8.7** | |

**Now working well (new):**
- **The dashboard guides first use.** A "Get your hub going" checklist tracks naming the hub, adding lessons, creating topics, building a path, and arranging the home page — each computed from real data, each with a one-click deep link, and the whole card disappears once complete.
- **Bulk content management closes the loop with bulk import.** After importing many URLs, an admin can multi-select rows and publish, feature, add/remove a topic, or delete in one action.
- **Branding is no longer blind.** The settings page shows a live, scaled homepage preview (header, hero gradient, CTA band, and the ordered list of enabled sections) that updates instantly as colors, fonts, identity, and section order change — no save-and-check loop.
- **Curation got real verbs.** Admins can now build and order Learning paths and set per-topic ordering + intros, turning a pile of items into an intentional structure.

**Remaining friction (minor):**

| # | Finding | Severity | Note |
|---|---------|----------|------|
| A2 | Homepage topic selection still split between *Topics* (which topics are eligible) and *Settings* (the "Browse by topic" section toggle). | Low | Now partially mitigated by the checklist + preview, but the two-location model persists. |
| A3 | Five separate "Add" buttons in the toolbar. | Low | Powerful but still slightly busy; a single branching "Add content" entry would tidy it. |
| A8 | No "needs review" flag for thin auto-imports. | Low | Quality-of-curation nicety, not a blocker. |

---

## Persona 2 — Learner exploring a topic quickly

| Dimension | v1 | v2 | What moved it |
|-----------|----|----|---------------|
| Discovery & navigation | 8 | 9 | Added a top-level **Paths** entry; search doubles as a discovery surface |
| Topic orientation & sequencing | 3 | 9 | Topic pages take an intro + admin-chosen order (newest/oldest/manual) |
| Guided journeys | 2 | 9 | Learning paths with numbered steps, "Start path," and path-aware "Up next" |
| Progress & continuity | 2 | 8 | Save-for-later + Mark-complete, surfaced on the account page |
| Content signals | 4 | 8 | Auto read-time on articles + difficulty badges |
| Search | 5 | 9 | Type facets with counts, related-topic suggestions, helpful empty states |
| **Average** | **4.0** | **8.7** | |

**Now working well (new):**
- **Lessons lead somewhere.** Every lesson page ends with an "Up next" card (next in its learning path, or next in its topic order) and a ranked "Related" grid — the single biggest v1 gap, now closed.
- **Topics are directed.** A topic page can open with an orientation paragraph and present its lessons in a deliberate sequence rather than an undifferentiated grid.
- **Journeys are first-class.** Learning paths have their own browsable index and numbered, step-by-step pages with a "Start path" button.
- **Learning has memory.** Signed-in learners can save lessons for later and mark them complete; both collections appear on the account page so multi-session learning resumes instead of restarting.
- **Better signals for choosing.** Articles show an estimated read time and items can carry a Beginner/Intermediate/Advanced badge, so learners can pick what fits their time and level.
- **Search helps the novice.** Results carry type facets with counts, suggest related topics, and — when nothing matches — offer topics to browse instead of a dead end.

**Remaining friction (minor):**

| # | Finding | Severity | Note |
|---|---------|----------|------|
| L7 | A members-only lesson encountered mid-flow still interrupts momentum. | Low | Legitimate business trade-off; worth measuring, not necessarily changing. |
| New | Progress is per-account only — anonymous learners can't bookmark, and there's no cross-device "resume the path from where I left off" beyond per-item completion. | Low–Med | A natural next step would be path-level progress ("3 of 7 done"). |

---

## Traceability — every v1 finding

| v1 ID | Finding | Status in v2 |
|-------|---------|--------------|
| A1 | No onboarding guidance | ✅ Shipped — dashboard checklist |
| A2 | Homepage topic selection split | ⚠️ Partially mitigated (preview + checklist); split remains |
| A3 | Five "Add" entry points | ◻️ Open (low) |
| A4 | No bulk content management | ✅ Shipped — multi-select action bar + bulk API |
| A5 | Settings is one long form | ✅ Improved — live preview + clearer sections |
| A6 | No live preview of theme/home | ✅ Shipped — live preview pane |
| A7 | Inventory fields quietly conditional | ✅ Addressed — "Track inventory" toggle reveals threshold |
| A8 | No flag for thin imports | ◻️ Open (low) |
| L1 | No "what next" on item pages | ✅ Shipped — Up next + Related |
| L2 | Flat, unordered topic pages | ✅ Shipped — intro + sort modes (incl. manual) |
| L3 | Collections not surfaced | ✅ Shipped — Paths nav + index + admin builder |
| L4 | No progress/bookmarking | ✅ Shipped — save/complete + account lists |
| L5 | Search rewards vocabulary only | ✅ Shipped — facets, topic suggestions, empty-state help |
| L6 | No difficulty/length signals | ✅ Shipped — read-time + difficulty badges |
| L7 | Membership teaser interrupts | ◻️ Open by design (low) |

13 of 15 findings resolved or improved; the 2 still open are both low-severity.

---

## New recommendations (v2)

1. **Run a dedicated accessibility & mobile pass** — the highest-value untouched area. Check color contrast across theme packages, keyboard operability of the homepage/section/path builders and the bulk action bar, focus states, and tap targets on cards and the numbered path steps. This is now the most important quality gap.
2. **Path-level progress** — show "N of M complete" on learning paths and a "resume" affordance, building on the per-item completion already stored. Turns the existing data into a visible journey.
3. **Unify homepage topic selection (A2)** — let the "Browse by topic" builder section pick its topics inline, or cross-link the two screens.
4. **Consolidate the "Add" menu (A3)** — one entry that branches by source (manual / from link / bulk / book / product).

## Method & limitations

Heuristic expert evaluation grounded in a walkthrough of the implemented features (all changes since v1 were verified against the running app). Dimension scores are comparative judgments, not measured task metrics; v1 baselines are retrospective. Quantitative validation (task-completion time, success rate) and the accessibility/mobile audit recommended above remain the best next steps before a public launch.
