"use client";

import type { SiteSettings } from "../lib/settings";

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
};

export default function SettingsPreview({ s }: { s: SiteSettings }) {
  const dark = s.theme === "dark";
  const pageBg = dark ? "#0b1220" : "#f8fafc";
  const cardBg = dark ? "#111a2e" : "#ffffff";
  const fg = dark ? "#e6edf6" : "#1e293b";
  const subFg = dark ? "#9fb0c5" : "#64748b";
  const headerBg = darken(s.primaryColor, dark ? 0.5 : 0.6);
  const heroStyle = { backgroundImage: `linear-gradient(135deg, ${s.primaryColor}, ${darken(s.primaryColor, 0.6)})` };
  const bandBg = dark ? darken(s.primaryColor, 0.4) : tint(s.accentColor, 0.85);
  const sections = s.homeSections.filter((x) => x.enabled);
  const initials = (s.siteName || "ML").slice(0, 2).toUpperCase();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 shadow-sm" style={{ fontFamily: s.fontFamily }}>
      {/* fake browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[11px] text-slate-400">home</span>
      </div>

      <div style={{ background: pageBg }}>
        {/* header */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: headerBg, color: "#fff" }}>
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded text-[10px] font-bold" style={{ background: s.accentColor, color: "#fff" }}>{initials}</span>
            <span className="text-sm font-bold">{s.siteName || "Your site"}</span>
          </div>
          <div className="flex gap-2 text-[10px] opacity-80">
            <span>Home</span><span>Topics</span><span>Paths</span><span>About</span>
          </div>
        </div>

        {/* hero */}
        <div className="px-4 py-5 text-white" style={heroStyle}>
          <div className="text-[9px] font-semibold uppercase tracking-wide text-white/70">{s.siteName}</div>
          <div className="mt-1 text-base font-bold leading-snug">{s.tagline || "Your tagline here"}</div>
          <div className="mt-3 flex gap-2">
            <span className="rounded-md bg-white px-3 py-1 text-[10px] font-semibold" style={{ color: s.primaryColor }}>Start exploring</span>
            <span className="rounded-md border border-white/50 px-3 py-1 text-[10px] font-semibold text-white">Become a member</span>
          </div>
        </div>

        {/* homepage sections, in order */}
        <div className="space-y-2 p-4">
          {sections.length === 0 && (
            <p className="rounded-md border border-dashed border-slate-300 p-3 text-center text-[11px]" style={{ color: subFg }}>
              No sections enabled — only the hero will show.
            </p>
          )}
          {sections.map((sec) => (
            sec.kind === "text" ? (
              <div key={sec.id} className="rounded-md border p-3" style={{ background: cardBg, borderColor: dark ? "#22304a" : "#e2e8f0" }}>
                {sec.title && <div className="text-xs font-bold" style={{ color: fg }}>{sec.title}</div>}
                {sec.body && <div className="mt-0.5 line-clamp-2 text-[11px]" style={{ color: subFg }}>{sec.body}</div>}
                {!sec.title && !sec.body && <div className="text-[11px] italic" style={{ color: subFg }}>Empty text block</div>}
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
            ) : (
              <div key={sec.id}>
                <div className="mb-1 text-xs font-bold" style={{ color: fg }}>
                  {sec.kind === "type" ? (sec.itemType || "Content") : SECTION_DESC[sec.kind]}
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-12 flex-1 rounded-md" style={{ background: dark ? "#1b2740" : "#e8edf4" }} />
                  ))}
                </div>
              </div>
            )
          ))}

          {/* CTA band */}
          <div className="mt-2 rounded-md p-3 text-center" style={{ background: bandBg, color: fg }}>
            <div className="text-xs font-bold">Create your free account</div>
          </div>
        </div>
      </div>
    </div>
  );
}
