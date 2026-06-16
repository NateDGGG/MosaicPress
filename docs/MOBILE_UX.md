# Mobile UX Assessment

**Date:** June 16, 2026
**Scope:** How the public-facing site (the Mosaic/MosaicPress framework) behaves on phones, plus the new admin mobile preview.

## Summary

The framework is **responsive by default** and reads well on phones — the header collapses to a menu, the hero stacks, content rows become swipeable, grids reflow, and the footer condenses. There are no separate "mobile templates"; every page uses fluid, breakpoint-driven layout. The main things to keep an eye on are full-bleed bands (now guarded) and tap-target sizing.

## What works well on mobile

- **Header → hamburger menu.** Above `md`, the desktop nav shows inline; below it, everything (nav links, content-type links, Membership, About, Book/Contact, Search, and the account/CTA actions) collapses into a CSS-only `☰` disclosure menu. No JS required.
- **Hero stacks.** The two-column hero (text + image) collapses to a single column; the split-layout side image is hidden on small screens so the headline/tagline/CTAs get full width. The **hero height** and **hero emphasis** settings apply on mobile too.
- **Content rails are swipeable.** "New releases / Featured / type" rails are horizontal scrollers with fixed-width cards — natural thumb-swipe on touch. The New-releases **auto-scroll pauses on touch** and respects reduced-motion.
- **Topic browser reflows.** "Browse by topic" tiles use a responsive grid (1 → 2 → N columns) and the topic tabs wrap to multiple rows.
- **Feature / "What is" section** is centered with a max-width, so it stays readable at narrow widths; its body/footer inherit the band color for contrast.
- **Footer condenses** to two columns with a centered copyright.
- **Forms** (contact, booking, newsletter, search) and the cart/checkout use full-width inputs and stack cleanly.
- **Accessibility carried over:** visible focus rings, a skip-to-content link, and `prefers-reduced-motion` honored (auto-scroll and transitions back off).

## Watch-outs (and current state)

- **Full-bleed bands and 100vw — guarded.** Hero and alternating section bands break out to full width with `width: 100vw`, which can exceed the content width on mobile (scrollbar) and cause a sliver of horizontal scroll. `globals.css` sets `html { overflow-x: hidden; overflow-x: clip; }` to prevent this; `clip` is used where supported so the **sticky header is unaffected**. Verify on a real device after major layout changes.
- **Tap targets.** Header menu rows, topic tabs, and card actions should stay ≥ ~44px tall for comfortable tapping. The menu rows (`py-2.5`) and buttons are close to this; worth a real-device pass if you tighten spacing.
- **Auto-scrolling carousel.** Gentle continuous motion can distract some users; it's slow, pauses on touch/focus, and disables under reduced-motion. Acceptable, but consider turning it off for content-dense pages if it feels busy.
- **Dense tables/admin.** The public site is phone-friendly; the **admin** is intentionally desktop-oriented (dense settings, multi-column editors). Admins typically use a desktop. The new mobile preview is for previewing the *public* site, not for operating the admin on a phone.
- **Long site names in title-first hero.** With "Hero emphasis = Site name," a very long site name renders large; check it doesn't overflow awkwardly on the narrowest screens (it wraps, but keep names concise).

## Admin mobile preview

The live preview in **Admin → Settings** now has a **🖥 Desktop / 📱 Mobile** toggle. Mobile mode renders the preview inside a ~340px phone frame and switches the mock to its mobile layout: the header collapses to a `☰` menu, the hero goes full-width (side image hidden), and rails render as a horizontal-scroll peek. It updates live as you edit, so you can check branding, hero, and section composition at phone width before saving.

> Note: the preview is a faithful *schematic*, not a pixel-perfect render of the live page. For final sign-off, view the real site on a phone (or your browser's device-emulation mode).

## Suggested follow-ups (optional)

1. Real-device QA pass on iOS Safari and Android Chrome for the watch-outs above.
2. Consider a per-site toggle to disable hero/section full-bleed if any embed forces width.
3. Add an explicit min tap-height utility to nav/menu rows if QA shows any are too small.
