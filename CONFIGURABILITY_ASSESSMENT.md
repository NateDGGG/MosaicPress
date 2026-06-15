# Assessment — What to Make Configurable vs. Keep as Sane Defaults

**Date:** June 15, 2026
**Purpose:** A principled view of where owner configuration adds real value versus where a good default serves better — so the product stays powerful without becoming a control panel.

## The guiding principle

Make something configurable when **(a)** owners legitimately differ, **(b)** the wrong value visibly hurts their goal, and **(c)** we can't infer a good value automatically. Keep it a default (or derive it) when there's a defensible "best" answer, when variance is cosmetic, or when exposing it mostly adds decision fatigue and ways to break the page.

Three tiers result:
- **Configure (surface it):** high variance + high impact.
- **Default + Advanced (hide it):** sensible default, override available for the minority who need it.
- **Derive / fixed (don't expose):** compute it or pick one good answer; exposing it is net-negative.

A practical rule of thumb already used here: **content, money, and identity are configurable; correctness, safety, and consistency are defaults.**

## What's already configurable (today)

Identity (name, tagline, logo, favicon, footer), full appearance (presets, colors + roles, fonts + scale, radius, card style, hero layout/image/overlay), **hero content** (source, featured item, primary + secondary CTAs — now), home-page composition (section builder, order, counts, per-section commentary, per-rail filters), optional capabilities (commerce, membership, contact, newsletter, booking, testimonials), custom fields per item type, topics/presenters/collections, About page, currency, affiliate tag, SMTP/notify emails. That's already broad and, importantly, the risky parts sit behind presets + an "Advanced" expander with contrast guardrails.

## Recommendations by tier

### A. Worth making configurable (real variance, real impact) — not yet done

1. **Header CTA(s) & the "Join" button.** The header still hard-codes Admin/Account/Join. A site with no membership shows a dead-end "Join." Make the header's primary action configurable (label + link, or hide), mirroring what we just did for the hero. *High impact, low effort.*
2. **Footer content.** Still a single text line. Owners genuinely differ here (links, social, columns, legal). A small footer builder (or at least configurable link list + social icons) is the most-requested "make it mine" gap. *Medium.*
3. **SEO / social defaults.** Default OG image, meta description template, and a sitemap/robots toggle. Owners differ and the wrong/empty value hurts reach. Per-item SEO exists; site-level defaults don't. *Medium, high SEO value.*
4. **"Members/Join" visibility.** Auto-hide membership UI (hero secondary default, header Join, account vs. membership) when no plans exist — partly a *derive* (see C) but the override should exist.
5. **Analytics hook.** A single "analytics snippet / measurement ID" field. Pure pass-through, universally wanted, can't be defaulted. *Low effort.*
6. **Per-page hero/banner** (topics, collections) — extends an existing pattern; owners with a few flagship topics want it. *Medium.*

### B. Default + keep under "Advanced" (good default, override for the few)

7. **Density / spacing** (comfortable vs compact) — one token; most never touch it. Default comfortable.
8. **Button shape/fill, section-band alternation, motion on/off** — cosmetic refinements; defaults are fine, expose in Advanced.
9. **Reading-time / difficulty display, commentary on cards** — already defaulted off/derived; keep as toggles, don't promote.
10. **Custom CSS escape hatch** — powerful but dangerous; Advanced-only, sandboxed, with reset.

### C. Should be derived or stay fixed (don't add a knob)

- **Per-section colors, hover states, focus rings, contrast text color.** Derived from primary/accent (with the contrast checker). Exposing every shade is the classic "too many knobs" trap — the explicit header/hero/band/footer overrides we added are the right ceiling.
- **Card hover elevation, transitions, breakpoints, container width.** Consistency matters more than choice; keep fixed.
- **Slugs, read-time math, related/next ranking, search weighting.** Derive; a wrong manual value only hurts.
- **Empty-state copy, "Skip to content," ARIA labels.** Correctness/accessibility — fixed.
- **Membership/commerce/contact UI presence.** Prefer to **derive from existence** (no plans → hide membership CTAs; no products → hide cart — already done for cart/nav) rather than add separate visibility toggles. Derivation beats a toggle when the signal is reliable.

## Cross-cutting guidance

- **Prefer derive-from-data over a toggle** when the signal is reliable (we already gate nav links and the cart by content existence). It's one less setting and never goes stale.
- **Two-layer disclosure is the scaling mechanism:** presets up front, everything else in "Advanced." Keep new appearance knobs in Advanced by default; only promote a setting to the top level when most owners change it.
- **Every new knob needs a sane default + a guardrail** (clamp, contrast check, or reset). A setting that can produce a broken page without a safety net shouldn't ship to the top level.
- **Watch the settings budget.** The settings object is large; group by purpose (Identity / Appearance / Home / Capabilities / SEO) and consider tabs/sections so the page stays navigable. This is itself a usability lever.

## Recommended next steps (priority order)

1. **Configurable header action + auto-hide membership UI when no plans** (A1, A4) — removes dead-end CTAs; pairs with the hero work just shipped.
2. **Footer builder** (A2) — biggest remaining "make it mine" gap.
3. **Site-level SEO defaults + sitemap/robots** (A3) — broad reach value for every persona.
4. **Analytics field** (A5) — trivial, universally useful.
5. Group the Settings page into labeled tabs/sections as the knob count grows (cross-cutting).

**Bottom line:** the platform is at a healthy point — the high-variance/high-impact things (look, hero content, capabilities, content structure) are configurable, and the correctness/consistency things are sensibly fixed or derived. The clearest remaining "configure it" wins are the **header action, footer, and SEO/analytics defaults**; almost everything else should stay a smart default behind presets and the Advanced expander, with a few more items moved to *derive-from-data*.
