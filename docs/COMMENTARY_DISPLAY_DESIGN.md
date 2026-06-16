# Design Doc — Surfacing Owner Commentary

**Date:** June 15, 2026
**Status:** Proposal (item-page display already implemented; home-page display open for decision)
**Author:** Engineering

## 1. Background

Every asset type now carries an optional **commentary** field — the site owner's own take ("why this matters," not just what it is). It's distinct from two existing fields:

- **summary** — a short, neutral description of the asset (used as card text).
- **body** — full long-form content (articles and blog posts only).

Commentary is markdown and renders on the **item page** as a themed "From the editor" callout (a left-accent-bordered, brand-tinted block placed above the body). That display is uncontroversial and is shipped.

The open question is the **home page**: how much commentary, if any, to surface there — balancing the owner's desire to transmit their perspective against the clean, scannable, PragerU-style aesthetic the home page depends on.

## 2. Goals & constraints

**Goals**
- Let the owner's voice reach visitors at the moment of browsing, not only after a click.
- Preserve the home page's visual rhythm: uniform cards, clear hierarchy, fast scanning.
- Give the owner control over intensity, since editorial voice is a matter of taste and brand.

**Constraints**
- Cards live in horizontally-scrolling rails with fixed widths; uneven text lengths break the grid.
- Commentary is markdown; raw markdown must never render unsanitized or as literal syntax in a card.
- Must work in light/dark themes and on mobile (small tap targets, narrow width).
- "summary" already occupies the card's description line — commentary competes for the same space.

## 3. The core tension

The home page optimizes for **breadth and scannability**; commentary optimizes for **depth and persuasion**. More commentary on cards means more of the owner's message per impression, but also taller/uneven cards, slower scanning, and a busier page that drifts from the catalog aesthetic. The design space is essentially *where on the breadth↔depth axis the owner wants each surface to sit* — and that's a per-owner, even per-section, decision.

## 4. Options (with trade-offs)

### A. Item page only (status quo) — commentary off the home page
- **Pros:** zero aesthetic cost; home stays a clean catalog; commentary gets full, well-formatted space where there's room for it.
- **Cons:** lowest reach; a visitor who never clicks never sees the owner's voice.

### B. Inline excerpt on cards
Show a short, plain-text commentary excerpt (1–3 clamped lines) under the title, either replacing or supplementing the summary.
- **Pros:** voice reaches every browse impression; minimal new UI.
- **Cons:** competes with summary; uneven card heights unless hard-clamped; markdown must be stripped to plain text (loses emphasis/links); can feel cluttered at scale.

### C. Progressive disclosure (hover / tap-to-expand)
Cards stay clean; a small "▾ Editor's note" affordance reveals commentary on hover (desktop) or tap (mobile).
- **Pros:** preserves the default aesthetic; depth on demand; opt-in per card by the reader.
- **Cons:** discoverability is weak (hidden by default); hover doesn't exist on touch; adds interaction complexity; many users never expand.

### D. Dedicated "Editor's notes / picks" band or rail
A distinct home section that highlights a curated set of items *with* their commentary, styled as an editorial strip (larger cards or a quote-style band), separate from the scannable catalog rails.
- **Pros:** strong, intentional voice in a contained, on-brand space; doesn't disturb the catalog rails; naturally limited in count so it stays tidy.
- **Cons:** another section to curate; only spotlights a few items; needs an owner signal for which items qualify.

### E. Hero / featured commentary only
Render commentary just for the hero item (and/or the Featured rail), where there's already visual room.
- **Pros:** high-impact placement; one or few items, so layout stays controlled; pairs with existing hero.
- **Cons:** limited to one/few items; not a general solution.

### F. Per-section control in the existing home builder
The home page is already an ordered, toggleable set of sections. Add a per-section "show commentary" option (and excerpt length) so the owner decides rail-by-rail — e.g., commentary on the "Editor's picks" rail, none on "New releases."
- **Pros:** maximum owner control with no global compromise; reuses the builder mental model; composes with B/D/E.
- **Cons:** more settings surface; owner must think per section.

## 5. Owner controls (the "how much" lever)

These compose; a sensible product offers a global default plus finer overrides:

1. **Global mode** (`homeCommentary`): `Hidden` · `Excerpt` · `Full`. One switch in Settings → Content. Default **Hidden** (keeps today's aesthetic; opt-in to more voice).
2. **Excerpt length**: a small number (e.g., 120–240 chars / 1–3 lines) when mode = Excerpt.
3. **Per-section toggle** (home builder): override the global per rail (Option F).
4. **Per-item "feature this note"**: a flag so an "Editor's notes" band (Option D) can pull only items the owner chose to spotlight.
5. **Placement**: replace-summary vs. append-below-summary, since some owners write commentary *as* the description and others in addition to it.

## 6. Theme & aesthetic guidance

- **Hierarchy:** title → summary (neutral) → commentary (voice). Differentiate commentary typographically — e.g., italic or a small "Editor's note" eyebrow label — so it reads as opinion, not description.
- **Color:** reuse the item-page treatment (subtle brand-tinted, left-accent border) sparingly; on dense cards prefer a one-line italic with an eyebrow rather than a full tinted box.
- **Layout integrity:** always hard-clamp on cards (`line-clamp`) so rails keep uniform heights; never let markdown blocks (headings/lists) render inside a card — strip to plain text for excerpts, render full markdown only on the item page and in a dedicated band.
- **Mobile:** prefer Hidden/Excerpt on cards; reserve Full/disclosure for the item page and the editorial band.
- **Restraint:** commentary everywhere reads as noise; commentary in one intentional place reads as editorial authority.

## 7. Recommendation

A phased approach that keeps the default clean and lets owners dial up voice deliberately:

1. **Phase 1 (now):** commentary on the **item page** only (done). Establishes the "From the editor" pattern and lets owners write commentary immediately.
2. **Phase 2 (recommended next):** add the **global `homeCommentary` mode** (`Hidden` default / `Excerpt` / `Full`) plus excerpt length, rendering a clamped, plain-text excerpt on cards when enabled. Lowest-effort way to give owners the "how much" lever without risking the default look.
3. **Phase 3 (highest editorial impact):** add an opt-in **"Editor's notes" home section** (Option D) driven by a per-item "feature this note" flag, rendered as an on-brand editorial band — the best balance of strong voice and contained aesthetics.
4. **Phase 4 (optional):** per-section commentary control in the home builder (Option F) for owners who want rail-by-rail precision.

This sequence ships safe value immediately, defers any aesthetic change behind an explicit owner choice, and reserves the boldest voice for a purpose-built, contained surface rather than diluting the catalog rails.

## 8. Open questions

- Should commentary, when shown on a card, **replace** the summary or **stack** with it? (Recommend owner-selectable; default replace when summary is empty, else append.)
- Does an "Editor's notes" band belong **above** the catalog (manifesto-forward) or **interleaved** (contextual)? (Recommend a single, orderable section via the existing builder.)
- Should commentary be **searchable/weighted** in search ranking? (Likely yes, low weight — it's owner-authored signal.)
