import Link from "next/link";
import { prisma } from "../lib/db";
import { getSettings, sectionPalette } from "../lib/settings";
import { getSessionUser, isStaff } from "../lib/auth";
import CartButton from "./CartButton";

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
  const TYPE_NAV: Array<{ type: string; href: string; label: string }> = [
    { type: "blog", href: "/blog", label: "Blog" },
    { type: "link", href: "/links", label: "Links" },
    { type: "product", href: "/shop", label: "Shop" },
  ];
  const typeLinks = TYPE_NAV.filter((t) => present.has(t.type));

  const cssVars = `:root{
    --brand:${p.brand};--brand-dark:${p.brandDark};--accent:${p.accent};--font:${p.font};
    --header-bg:${p.headerBg};--header-fg:${p.headerFg};
    --hero-from:${p.heroFrom};--hero-to:${p.heroTo};
    --page-bg:${p.pageBg};
    --band-bg:${p.bandBg};--band-fg:${p.bandFg};
    --topic-bg:${p.topicBg};--topic-fg:${p.topicFg};
    --footer-bg:${p.footerBg};--footer-fg:${p.footerFg};
  }`.replace(/\s+/g, " ");

  const initials = s.siteName.slice(0, 2).toUpperCase();

  return (
    <html lang="en" data-theme={s.theme}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body style={{ background: "rgb(var(--page-bg))" }}>
        <a href="#main" className="skip-link">Skip to content</a>
        <header style={{ background: "rgb(var(--header-bg))", color: "rgb(var(--header-fg))" }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold" style={{ color: "rgb(var(--header-fg))" }}>
              <span className="grid h-7 w-7 place-items-center rounded bg-accent text-sm font-bold text-white">{initials}</span>
              {s.siteName}
            </Link>
            {/* Desktop nav */}
            <nav aria-label="Primary" className="hidden items-center gap-5 text-sm font-medium md:flex" style={{ color: "rgb(var(--header-fg) / 0.9)" }}>
              <Link href="/" className="hover:text-white">Home</Link>
              <Link href="/topics" className="hover:text-white">Topics</Link>
              <Link href="/collections" className="hover:text-white">Paths</Link>
              <Link href="/presenters" className="hover:text-white">Presenters</Link>
              {typeLinks.map((t) => (
                <Link key={t.href} href={t.href} className="hover:text-white">{t.label}</Link>
              ))}
              <Link href="/membership" className="hover:text-white">Membership</Link>
              <Link href="/about" className="hover:text-white">About</Link>
              <Link href="/search" className="hover:text-white" aria-label="Search">Search</Link>
              {s.commerceEnabled && <CartButton />}
              {isStaff(user) ? (
                <Link href="/admin" className="rounded-md bg-accent px-3 py-1.5 font-semibold text-white hover:opacity-90">Admin</Link>
              ) : user ? (
                <Link href="/account" className="rounded-md bg-accent px-3 py-1.5 font-semibold text-white hover:opacity-90">Account</Link>
              ) : (
                <>
                  <Link href="/login" className="hover:text-white">Sign in</Link>
                  <Link href="/join" className="rounded-md bg-accent px-3 py-1.5 font-semibold text-white hover:opacity-90">Join</Link>
                </>
              )}
            </nav>

            {/* Mobile nav (CSS-only disclosure) */}
            <details className="relative md:hidden">
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
                    { href: "/membership", label: "Membership" },
                    { href: "/about", label: "About" },
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
                      <Link href="/join" className="rounded-md px-3 py-2.5 font-semibold text-brand hover:bg-slate-100">Join</Link>
                    </>
                  )}
                </nav>
              </div>
            </details>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16" style={{ background: "rgb(var(--footer-bg))", color: "rgb(var(--footer-fg))" }}>
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm">{s.footerText}</div>
        </footer>
      </body>
    </html>
  );
}
