"use client";

import type { SiteSettings } from "../lib/settings";
import { fontStack } from "../lib/fonts";

// Self-contained color helpers (no server imports — keep prisma out of the bundle).
function hx(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return Number.isNaN(n) ? [29, 78, 216] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgb = (t: number[]) => `rgb(${t[0]}, ${t[1]}, ${t[2]})`;
const darken = (hex: string, f: number) => rgb(hx(hex).map((c) => Math.round(c * f)));
const tint = (hex: string, a: number) => rgb(hx(hex).map((c) => Math.round(c + (255 - c) * a)));

const SECTION_DESC: Record<string, string> = {
  new: "New releases", featured: "Featured", topics: "Browse by topic",
  collections: "Learning paths", type: "Content rail", text: "Text block",
  editorsNotes: "Editor's notes",
};

export default function SettingsPreview({ s }: { s: SiteSettings }) {
  const dark = s.theme === "dark";
  const pageBg = dark ? "#0b1220" : "#f8fafc";
  const cardBg = dark ? "#111a2e" : "#ffffff";
  const fg = dark ? "#e6edf6" : "#1e293b";
  const subFg = dark ? "#9fb0c5" : "#64748b";
  const headerBg = s.headerColor || darken(s.primaryColor, dark ? 0.5 : 0.6);
  const bandBg = s.bandColor || (dark ? darken(s.primaryColor, 0.4) : tint(s.accentColor, 0.85));
  // Alternating section tones (page bg → primary tint → accent tint).
  const secTones = [pageBg, dark ? darken(s.primaryColor, 0.34) : tint(s.primaryColor, 0.93), dark ? darken(s.accentColor, 0.34) : tint(s.accentColor, 0.93)];
  const sections = s.homeSections.filter((x) => x.enabled);
  const initials = (s.siteName || "ML").slice(0, 2).toUpperCase();

  // Reflect the corner-radius personality.
  const bodyFam = (s.bodyFontId && fontStack(s.bodyFontId)) || s.fontFamily;
  const headFam = (s.headingFontId && fontStack(s.headingFontId)) || bodyFam;
  const rad = s.radius === "sharp" ? 2 : s.radius === "soft" ? 14 : 6;
  const r = (n = rad) => ({ borderRadius: n });
  const cardAR = s.cardAspect === "square" ? "1 / 1" : s.cardAspect === "wide" ? "4 / 3" : "16 / 9";
  const cardShadow = s.cardShadow === "raised" ? "0 8px 18px -6px rgba(2,6,23,.25)" : s.cardShadow === "flat" ? "none" : "0 1px 2px rgba(2,6,23,.08)";

  // Reflect the hero layout.
  const imageHero = s.heroLayout === "image" && !!s.heroImage;
  const o = Math.max(0, Math.min(90, s.heroOverlay)) / 100;
  const heroStyle: React.CSSProperties = imageHero
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(2,6,23,${o}), rgba(2,6,23,${Math.min(o + 0.18, 0.92)})), url(${s.heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundImage: `linear-gradient(135deg, ${s.heroColor || s.primaryColor}, ${darken(s.heroColor || s.primaryColor, 0.6)})` };
  const sideImage = s.heroLayout === "split" ? s.heroImage : "";

  return (
    <div className="overflow-hidden border border-slate-300 shadow-sm" style={{ ...r(12), fontFamily: bodyFam }}>
      {/* fake browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[11px] text-slate-400">home{s.headerSticky ? " · sticky" : ""}</span>
      </div>

      <div style={{ background: pageBg }}>
        {/* header */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: headerBg, color: "#fff" }}>
          <div className="flex items-center gap-2">
            {s.logoImage ? (
              <span className={s.logoSolidBg ? "inline-flex rounded p-1" : "inline-flex"}
                style={s.logoSolidBg ? { backgroundColor: "#ffffff", backgroundImage: "linear-gradient(#ffffff,#ffffff)", colorScheme: "only light" } : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.logoImage} alt="" className={`${s.logoSize === "large" ? "h-7" : s.logoSize === "small" ? "h-4" : "h-6"} w-auto max-w-[120px] object-contain`} />
              </span>
            ) : (
              <>
                <span className="grid h-5 w-5 place-items-center text-[10px] font-bold" style={{ ...r(4), background: s.accentColor, color: "#fff" }}>{initials}</span>
                <span className="text-sm font-bold">{s.siteName || "Your site"}</span>
              </>
            )}
          </div>
          <div className={`flex gap-2 text-[10px] opacity-80 ${s.headerNavAlign === "center" ? "mx-auto" : "ml-auto"}`}>
            <span>Home</span><span>Topics</span><span>Paths</span><span>About</span>
          </div>
          <span className="text-[10px] font-semibold" style={{ background: s.accentColor, color: "#fff", padding: "2px 8px", ...r(4) }}>Join</span>
        </div>

        {/* hero */}
        <div className={`flex items-center gap-3 px-4 text-white ${s.heroHeight === "xl" ? "py-12" : s.heroHeight === "tall" ? "py-8" : "py-5"}`} style={heroStyle}>
          <div className="flex-1">
            {s.heroEmphasis === "tagline" ? (
              <>
                <div className="text-[9px] font-semibold uppercase tracking-wide text-white/70">{s.siteName}</div>
                <div className="mt-1 text-base font-bold leading-snug" style={{ fontFamily: headFam }}>{s.tagline || "Your tagline here"}</div>
              </>
            ) : (
              <>
                <div className="text-lg font-extrabold leading-tight" style={{ fontFamily: headFam }}>{s.siteName || "Your site"}</div>
                {s.tagline && <div className="mt-0.5 text-[11px] font-medium text-white/90">{s.tagline}</div>}
              </>
            )}
            {s.heroSubtitle && <div className="mt-1 line-clamp-2 text-[10px] text-white/75">{s.heroSubtitle}</div>}
            <div className="mt-3 flex gap-2">
              {s.heroShowPrimaryCta && <span className="bg-white px-3 py-1 text-[10px] font-semibold" style={{ ...r(6), color: s.primaryColor }}>{s.heroCtaLabel || "Start exploring"}</span>}
              {s.heroCta2Label && <span className="border border-white/50 px-3 py-1 text-[10px] font-semibold text-white" style={r(6)}>{s.heroCta2Label}</span>}
            </div>
          </div>
          {sideImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sideImage} alt="" className="hidden h-16 w-28 object-cover sm:block" style={r(10)} />
          )}
        </div>

        {/* homepage sections, in order */}
        <div className="space-y-2 p-4">
          {sections.length === 0 && (
            <p className="border border-dashed border-slate-300 p-3 text-center text-[11px]" style={{ ...r(), color: subFg }}>
              No sections enabled — only the hero will show.
            </p>
          )}
          {sections.map((sec, idx) => {
            const node = (
            sec.kind === "text" ? (
              <div key={sec.id} className="border p-3" style={{ ...r(), background: cardBg, borderColor: dark ? "#22304a" : "#e2e8f0" }}>
                {sec.title && <div className="text-xs font-bold" style={{ color: fg }}>{sec.title}</div>}
                {sec.body && <div className="mt-0.5 line-clamp-2 text-[11px]" style={{ color: subFg }}>{sec.body}</div>}
                {!sec.title && !sec.body && <div className="text-[11px] italic" style={{ color: subFg }}>Empty text block</div>}
              </div>
            ) : sec.kind === "editorsNotes" ? (
              <div key={sec.id}>
                <div className="mb-1 text-xs font-bold" style={{ color: fg }}>From the editor</div>
                <div className="border-l-4 p-2 text-[10px] italic" style={{ ...r(6), borderColor: s.primaryColor, background: dark ? "#10203a" : tint(s.primaryColor, 0.92), color: subFg }}>
                  Your spotlighted commentary appears here.
                </div>
              </div>
            ) : sec.kind === "topics" ? (
              <div key={sec.id}>
                <div className="mb-1 text-xs font-bold" style={{ color: fg }}>Browse by topic</div>
                <div className="flex flex-wrap gap-1">
                  {["History", "Economics", "Civics"].map((t) => (
                    <span key={t} className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: cardBg, color: subFg, border: `1px solid ${dark ? "#22304a" : "#e2e8f0"}` }}>{t}</span>
                  ))}
                </div>
              </div>
            ) : sec.kind === "feature" ? (
              <div key={sec.id} className="text-center">
                <div className="text-sm font-bold" style={{ color: fg }}>{sec.title || "What is …?"}</div>
                {sec.body && <div className="mx-auto mt-1 line-clamp-2 max-w-[85%] text-[10px]" style={{ color: subFg }}>{sec.body}</div>}
                <div className="mx-auto mt-2 h-16 w-[85%]" style={{ ...r(8), backgroundColor: sec.image ? undefined : (dark ? "#1b2740" : "#e8edf4"), backgroundImage: sec.image ? `url(${sec.image})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }} />
                {sec.footer && <div className="mt-1 text-[9px]" style={{ color: subFg }}>{sec.footer}</div>}
              </div>
            ) : (
              <div key={sec.id}>
                <div className="mb-1 text-xs font-bold" style={{ color: fg }}>
                  {sec.kind === "type" ? (sec.itemType || "Content") : SECTION_DESC[sec.kind]}
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex-1" style={{ ...r(), aspectRatio: cardAR, boxShadow: cardShadow, background: dark ? "#1b2740" : "#e8edf4" }} />
                  ))}
                </div>
              </div>
            )
            );
            if (!s.alternateSections || idx % secTones.length === 0) return <div key={sec.id}>{node}</div>;
            return <div key={sec.id} className="-mx-4 px-4 py-1.5" style={{ background: secTones[idx % secTones.length] }}>{node}</div>;
          })}

          {/* CTA band */}
          <div className="mt-2 p-3 text-center" style={{ ...r(), background: bandBg, color: fg }}>
            <div className="text-xs font-bold">Create your free account</div>
          </div>
        </div>
      </div>
    </div>
  );
}
