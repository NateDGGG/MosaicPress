# Assessment — UI Settings & Customization Opportunities

> **Status update (June 15, 2026):** The Tier‑1 and Tier‑2 items below are now **shipped**,
> plus one‑click **style presets** (Classic, Editorial, Bold, Minimal, Midnight) as the
> default surface with everything else under an "Advanced appearance" expander.
> Shipped: hero banner (gradient / image / split + overlay + subtitle), logo & favicon upload,
> sticky header, header nav alignment, corner‑radius personality, heading/body font pairing +
> type scale, expanded color roles (header / hero / CTA band / footer with contrast checks),
> and card style (image ratio + shadow). The live preview reflects all of it.
> **Still open:** density control, footer builder, custom‑CSS escape hatch, motion controls,
> per‑page banners, and richer search facets.


**Date:** June 15, 2026
**Status:** Hero banner shipped; remainder is a prioritized proposal

## Where we are today

Owners can already customize: site name, tagline, footer text, **hero banner** (new — gradient / full background image / split-with-image, overlay strength, subtitle), packaged themes, primary & accent colors (with WCAG contrast warnings), light/dark mode, font family, currency, the home-page section builder (order, visibility, preview counts, per-section commentary), and the About page.

That's a strong base. The gaps below are what stand between "configurable" and "feels like *my* modern site."

## Prioritized recommendations

### Tier 1 — high impact, low effort (recommended next)

1. **Logo upload.** The header currently shows two-letter initials in an accent square. Letting owners upload a logo (and pick a wordmark-only / icon+wordmark option) is the single biggest "this is my brand" win. Add `logoImage`; render in `RootChrome` with the initials as fallback. Also add a **favicon** upload.
2. **Header style.** A few switches with outsized effect: **sticky/transparent-over-hero header**, header background = solid brand vs. transparent vs. light, and centered vs. left nav. Modern sites lean on a sticky, semi-transparent header.
3. **Corner radius & density tokens.** One "Rounded / Soft / Sharp" control mapped to a `--radius` token, plus a "Comfortable / Compact" density toggle for padding. Instantly modernizes or tightens the whole UI from one setting.
4. **Card style.** Aspect ratio (16:9 / 4:3 / square), shadow depth (flat / subtle / raised), and image position (top vs. side) — cards are the most-repeated element, so small changes read site-wide.

### Tier 2 — medium impact / medium effort

5. **Typography pairing.** Separate heading and body fonts from a curated Google-Fonts-style list (e.g., a display serif + clean sans), plus a base font-size/scale control. Currently it's a single `fontFamily`.
6. **Expanded color roles.** Today: primary + accent, with per-section colors derived. Add optional explicit overrides for header, hero, CTA band, and footer so owners aren't locked to the derived palette. Keep the contrast checker on each.
7. **Section background alternation & dividers.** Let owners choose how stacked home sections alternate (tinted bands vs. plain) and divider styles — this is core to the PragerU "stacked color blocks" aesthetic.
8. **Button style.** Shape (pill / rounded / square) and fill (solid / outline / soft) for the primary CTA, applied globally.
9. **Footer builder.** Columns, links, social icons, and a tagline — currently a single text line.

### Tier 3 — high effort or niche

10. **Custom CSS / theme tokens escape hatch.** A sanitized custom-CSS field (or editable token set) for power users. High flexibility, but needs guardrails and a reset.
11. **More packaged themes / "style presets."** Bundle the Tier-1/2 choices into one-click looks (e.g., "Editorial," "Bold," "Minimal") so non-designers get a coherent result instantly.
12. **Animation & motion controls.** Subtle card hover/reveal on/off (respecting `prefers-reduced-motion`, which is already honored).
13. **Per-page hero/banner.** Topic and collection pages could take their own banner image — extends the hero pattern beyond the home page.

## Cross-cutting guidance

- **Preview everything.** The Settings page already has a live preview pane — extend it to reflect logo, radius, density, and card style so owners see changes before saving. This is what makes heavy customization feel safe.
- **Guardrails over freedom.** Keep the contrast checker, clamp ranges (radius, density, overlay), and offer a "reset to theme" so customization can't produce a broken or illegible page.
- **Tokens, not one-offs.** Implement radius/density/typography as CSS variables in `RootChrome`'s injected `:root` block (same mechanism as colors today) so one setting cascades everywhere consistently.
- **Presets tie it together.** Most owners want a good look, not a control panel. Packaging Tier-1/2 settings into a few named presets gives reach without overwhelming.

## Suggested sequence

1. Logo + favicon upload (Tier 1.1)
2. Header style: sticky + transparent-over-hero + nav alignment (Tier 1.2)
3. Radius + density tokens (Tier 1.3) wired into the live preview
4. Card style options (Tier 1.4)
5. Typography pairing + type scale (Tier 2.5)
6. Expanded color roles with contrast checks (Tier 2.6)
7. Package the above into 2–3 style presets (Tier 3.11)

This order front-loads the biggest perceived-modernity gains (logo, header, radius, cards) at low cost, then deepens control, then makes it approachable via presets.
