import Link from "next/link";
import { prisma } from "../lib/db";
import { getSettings, sectionPalette } from "../lib/settings";
import { fontStack, fontGoogleHref } from "../lib/fonts";
import { getSessionUser, isStaff } from "../lib/auth";
import CartButton from "./CartButton";
import AnalyticsInjector from "./AnalyticsInjector";

// Site chrome (html/head/body + themed header & footer) shared by every project.
// Projects render this from their own root layout, which owns the global CSS import.
export default async function RootChrome({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const user = await getSessionUser();
  const p = sectionPalette(s);

  // Type-based nav links appear only when content of that type is published.
  const presentRows = await prisma.item.findMany({
    where: { status: "published" },
    distinct: ["type"],
    select: { type: true },
  });
  const present = new Set(presentRows.map((r) => r.type));
  const hasPlans = (await prisma.plan.count()) > 0;
  const TYPE_NAV: Array<{ type: string; href: string; label: string }> = [
    { type: "blog", href: "/blog", label: "Blog" },
    { type: "link", href: "/links", label: "Links" },
    { type: "product", href: "/shop", label: "Shop" },
  ];
  const typeLinks = TYPE_NAV.filter((t) => present.has(t.type));

  const bodyStack = (s.bodyFontId && fontStack(s.bodyFontId)) || p.font;
  const headingStack = (s.headingFontId && fontStack(s.headingFontId)) || bodyStack;
  const scalePct = Math.round(Math.max(0.85, Math.min(1.25, s.fontScale || 1)) * 100);
  const fontHref = fontGoogleHref([s.headingFontId, s.bodyFontId]);
  const cardAspect = s.cardAspect === "square" ? "1 / 1" : s.cardAspect === "wide" ? "4 / 3" : "16 / 9";

  const cssVars = `:root{
    --brand:${p.brand};--brand-dark:${p.brandDark};--accent:${p.accent};--font:${bodyStack};--font-heading:${headingStack};font-size:${scalePct}%;
    --header-bg:${p.headerBg};--header-fg:${p.headerFg};
    --hero-from:${p.heroFrom};--hero-to:${p.heroTo};
    --page-bg:${p.pageBg};
    --band-bg:${p.bandBg};--band-fg:${p.bandFg};
    --topic-bg:${p.topicBg};--topic-fg:${p.topicFg};
    --footer-bg:${p.footerBg};--footer-fg:${p.footerFg};--card-aspect:${cardAspect};
  }`.replace(/\s+/g, " ");

  const initials = s.siteName.slice(0, 2).toUpperCase();

  return (
    <html lang="en" data-theme={s.theme} data-radius={s.radius} data-card-shadow={s.cardShadow}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {s.faviconImage && <link rel="icon" href={s.faviconImage} />}
        {fontHref && <link rel="stylesheet" href={fontHref} />}
      </head>
      <body style={{ background: "rgb(var(--page-bg))" }}>
        <a href="#main" className="skip-link">Skip to content</a>
        {s.analyticsHead && <AnalyticsInjector snippet={s.analyticsHead} />}
        <header className={s.headerSticky ? "sticky top-0 z-40" : ""} style={{ background: "rgb(var(--header-bg))", color: "rgb(var(--header-fg))" }}>
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold" style={{ color: "rgb(var(--header-fg))" }}>
              {s.logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoImage} alt={s.siteName} className="h-8 w-auto max-w-[180px] object-contain" />
              ) : (
                <>
                  <span className="grid h-7 w-7 place-items-center rounded bg-accent text-sm font-bold text-white">{initials}</span>
                  {s.siteName}
                </>
              )}
            </Link>
            {/* Desktop nav links */}
            <nav aria-label="Primary"
              className={`hidden items-center gap-5 text-sm font-medium md:flex ${s.headerNavAlign === "center" ? "mx-auto" : "ml-auto"}`}
              style={{ color: "rgb(var(--header-fg) / 0.9)" }}>
              <Link href="/" className="hover:text-white">Home</Link>
              <Link href="/topics" className="hover:text-white">Topics</Link>
              <Link href="/collections" className="hover:text-white">Paths</Link>
              <Link href="/presenters" className="hover:text-white">Presenters</Link>
              {typeLinks.map((t) => (
                <Link key={t.href} href={t.href} className="hover:text-white">{t.label}</Link>
              ))}
              {hasPlans && <Link href="/membership" className="hover:text-white">Membership</Link>}
              <Link href="/about" className="hover:text-white">About</Link>
              {s.bookingEnabled && <Link href="/book" className="hover:text-white">Book</Link>}
              {s.contactEnabled && <Link href="/contact" className="hover:text-white">Contact</Link>}
              <Link href="/search" className="hover:text-white" aria-label="Search">Search</Link>
            </nav>
            {/* Desktop actions (cart + account) */}
            <div className="hidden items-center gap-4 text-sm font-medium md:flex" style={{ color: "rgb(var(--header-fg) / 0.9)" }}>
              {s.commerceEnabled && <CartButton />}
              {isStaff(user) ? (
                <Link href="/admin" className="rounded-md bg-accent px-3 py-1.5 font-semibold text-white hover:opacity-90">Admin</Link>
              ) : user ? (
                <Link href="/account" className="rounded-md bg-accent px-3 py-1.5 font-semibold text-white hover:opacity-90">Account</Link>
              ) : (
                <>
                  <Link href="/login" className="hover:text-white">Sign in</Link>
                  {s.headerCtaLabel && <Link href={s.headerCtaHref || "/join"} className="rounded-md bg-accent px-3 py-1.5 font-semibold text-white hover:opacity-90">{s.headerCtaLabel}</Link>}
                </>
              )}
            </div>

            {/* Mobile nav (CSS-only disclosure) */}
            <details className="relative ml-auto md:hidden">
              <summary aria-label="Open menu" className="grid h-10 w-10 cursor-pointer place-items-center rounded-md text-xl" style={{ color: "rgb(var(--header-fg))" }}>
                <span aria-hidden="true">☰</span>
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-black/10 bg-white p-2 text-slate-700 shadow-xl">
                <nav aria-label="Mobile" className="flex flex-col">
                  {[
                    { href: "/", label: "Home" },
                    { href: "/topics", label: "Topics" },
                    { href: "/collections", label: "Paths" },
                    { href: "/presenters", label: "Presenters" },
                    ...typeLinks,
                    ...(hasPlans ? [{ href: "/membership", label: "Membership" }] : []),
                    { href: "/about", label: "About" },
                    ...(s.bookingEnabled ? [{ href: "/book", label: "Book" }] : []),
                    ...(s.contactEnabled ? [{ href: "/contact", label: "Contact" }] : []),
                    { href: "/search", label: "Search" },
                  ].map((l) => (
                    <Link key={l.href} href={l.href} className="rounded-md px-3 py-2.5 hover:bg-slate-100">{l.label}</Link>
                  ))}
                  {s.commerceEnabled && <Link href="/cart" className="rounded-md px-3 py-2.5 hover:bg-slate-100">Cart</Link>}
                  <div className="my-1 border-t border-slate-100" />
                  {isStaff(user) ? (
                    <Link href="/admin" className="rounded-md px-3 py-2.5 font-semibold text-brand hover:bg-slate-100">Admin</Link>
                  ) : user ? (
                    <Link href="/account" className="rounded-md px-3 py-2.5 font-semibold text-brand hover:bg-slate-100">Account</Link>
                  ) : (
                    <>
                      <Link href="/login" className="rounded-md px-3 py-2.5 hover:bg-slate-100">Sign in</Link>
                      {s.headerCtaLabel && <Link href={s.headerCtaHref || "/join"} className="rounded-md px-3 py-2.5 font-semibold text-brand hover:bg-slate-100">{s.headerCtaLabel}</Link>}
                    </>
                  )}
                </nav>
              </div>
            </details>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16" style={{ background: "rgb(var(--footer-bg))", color: "rgb(var(--footer-fg))" }}>
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm">
            {(s.footerColumns.length > 0 || s.footerSocial.length > 0) && (
              <div className="mb-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {s.footerColumns.map((col) => (
                  <div key={col.id}>
                    {col.title && <div className="mb-2 font-semibold" style={{ color: "rgb(var(--footer-fg))" }}>{col.title}</div>}
                    <ul className="space-y-1">
                      {col.links.map((l, i) => (
                        <li key={i}>
                          <a href={l.href} className="opacity-80 hover:opacity-100 hover:underline"
                            {...(/^https?:/i.test(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                            {l.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {s.footerSocial.length > 0 && (
                  <div>
                    <div className="mb-2 font-semibold" style={{ color: "rgb(var(--footer-fg))" }}>Follow</div>
                    <ul className="space-y-1">
                      {s.footerSocial.map((l, i) => (
                        <li key={i}>
                          <a href={l.href} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 hover:underline">{l.label}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className={(s.footerColumns.length > 0 || s.footerSocial.length > 0) ? "border-t border-white/15 pt-4 opacity-80" : ""}>{s.footerText}</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
