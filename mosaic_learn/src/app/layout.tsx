import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSettings, sectionPalette } from "@/lib/settings";
import { getSessionUser, isStaff } from "@/lib/auth";
import CartButton from "@/components/CartButton";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: { default: s.siteName, template: `%s · ${s.siteName}` }, description: s.tagline };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const user = await getSessionUser();
  const p = sectionPalette(s);

  // Coordinated per-section color tokens, all derived from the selected theme.
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
        <header style={{ background: "rgb(var(--header-bg))", color: "rgb(var(--header-fg))" }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold" style={{ color: "rgb(var(--header-fg))" }}>
              <span className="grid h-7 w-7 place-items-center rounded bg-accent text-sm font-bold text-white">{initials}</span>
              {s.siteName}
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium" style={{ color: "rgb(var(--header-fg) / 0.85)" }}>
              <Link href="/" className="hover:text-white">Home</Link>
              <Link href="/topics" className="hover:text-white">Topics</Link>
              <Link href="/presenters" className="hover:text-white">Presenters</Link>
              <Link href="/membership" className="hover:text-white">Membership</Link>
              <Link href="/search" className="hover:text-white" aria-label="Search">Search</Link>
              <CartButton />
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
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16" style={{ background: "rgb(var(--footer-bg))", color: "rgb(var(--footer-fg))" }}>
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm">{s.footerText}</div>
        </footer>
      </body>
    </html>
  );
}
