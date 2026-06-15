"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteSettings, HomeSection } from "../lib/settings";
import { THEMES } from "../lib/themes";
import SettingsPreview from "./SettingsPreview";

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [s, setS] = useState<SiteSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addPick, setAddPick] = useState("text");

  function set<K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  // ---- Contrast checking (WCAG) for picked colors ----
  function _lin(c: number) { const x = c / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }
  function _lum(hex: string) {
    const h = hex.replace("#", ""); const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(f, 16); if (Number.isNaN(n)) return 0;
    return 0.2126 * _lin((n >> 16) & 255) + 0.7152 * _lin((n >> 8) & 255) + 0.0722 * _lin(n & 255);
  }
  // Contrast of white text on the given background color.
  const contrastWhite = (hex: string) => 1.05 / (_lum(hex) + 0.05);

  // ---- Home-page section builder ----
  const rid = () => Math.random().toString(36).slice(2, 9);
  const TYPE_LABEL: Record<string, string> = {
    article: "Articles", blog: "Blog", video: "Videos", product: "Products", link: "Links", book: "Books",
  };
  function setSections(next: HomeSection[]) { set("homeSections", next); }
  function moveSection(i: number, dir: -1 | 1) {
    const a = [...s.homeSections]; const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; setSections(a);
  }
  function patchSection(i: number, patch: Partial<HomeSection>) {
    setSections(s.homeSections.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeSection(i: number) { setSections(s.homeSections.filter((_, idx) => idx !== i)); }
  function addSection(spec: string) {
    let sec: HomeSection;
    if (spec === "text") sec = { id: rid(), kind: "text", enabled: true, title: "", body: "" };
    else if (spec.startsWith("type:")) sec = { id: rid(), kind: "type", enabled: true, itemType: spec.slice(5) };
    else sec = { id: rid(), kind: spec as HomeSection["kind"], enabled: true };
    setSections([...s.homeSections, sec]);
  }
  function sectionLabel(sec: HomeSection): string {
    switch (sec.kind) {
      case "new": return "New releases";
      case "featured": return "Featured";
      case "topics": return "Browse by topic";
      case "collections": return "Collections";
      case "type": return TYPE_LABEL[sec.itemType || ""] || "Content type";
      case "text": return sec.title ? `Text: ${sec.title}` : "Custom text block";
      default: return sec.kind;
    }
  }
  const ADDABLE: Array<{ spec: string; label: string }> = [
    { spec: "new", label: "New releases" },
    { spec: "featured", label: "Featured" },
    { spec: "topics", label: "Browse by topic" },
    { spec: "collections", label: "Collections" },
    { spec: "type:article", label: "Articles" },
    { spec: "type:blog", label: "Blog posts" },
    { spec: "type:video", label: "Videos" },
    { spec: "type:product", label: "Products" },
    { spec: "type:link", label: "Links" },
    { spec: "type:book", label: "Books" },
    { spec: "text", label: "Custom text block" },
  ];
  const hasSpec = (spec: string) =>
    spec.startsWith("type:")
      ? s.homeSections.some((x) => x.kind === "type" && x.itemType === spec.slice(5))
      : s.homeSections.some((x) => x.kind === spec);
  const addable = ADDABLE.filter((o) => o.spec === "text" || !hasSpec(o.spec));

  function applyTheme(id: string) {
    const t = THEMES.find((x) => x.id === id);
    if (!t) return;
    setS((prev) => ({
      ...prev,
      themeId: t.id,
      primaryColor: t.primaryColor,
      accentColor: t.accentColor,
      theme: t.mode,
      fontFamily: t.fontFamily,
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none";
  const label = "mb-1 block text-xs font-medium text-slate-500";

  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      <form onSubmit={save} className="min-w-0 flex-1 space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Identity</h2>
        <label className={label}>Site name</label>
        <input value={s.siteName} onChange={(e) => set("siteName", e.target.value)} className={`${field} mb-3`} />
        <label className={label}>Tagline</label>
        <input value={s.tagline} onChange={(e) => set("tagline", e.target.value)} className={`${field} mb-3`} />
        <label className={label}>Footer text</label>
        <input value={s.footerText} onChange={(e) => set("footerText", e.target.value)} className={field} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Theme</h2>
        <p className="mb-3 text-xs text-slate-500">Pick a packaged theme, then fine-tune below.</p>
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTheme(t.id)}
              className={`rounded-lg border p-3 text-left transition ${
                s.themeId === t.id ? "border-brand ring-2 ring-brand/30" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="mb-2 flex gap-1">
                <span className="h-5 w-5 rounded-full" style={{ background: t.primaryColor }} />
                <span className="h-5 w-5 rounded-full" style={{ background: t.accentColor }} />
                <span className={`h-5 w-5 rounded-full border ${t.mode === "dark" ? "bg-slate-900" : "bg-white"}`} />
              </div>
              <div className="text-sm font-semibold" style={{ fontFamily: t.fontFamily }}>{t.name}</div>
              <div className="text-[11px] text-slate-500">{t.description}</div>
            </button>
          ))}
        </div>

        <h2 className="mb-3 font-semibold">Fine-tune</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Primary color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={s.primaryColor} onChange={(e) => set("primaryColor", e.target.value)}
                className="h-10 w-12 rounded border border-slate-300" />
              <input value={s.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className={field} />
            </div>
            {contrastWhite(s.primaryColor) < 4.5 && (
              <p className="mt-1 text-xs text-amber-600">
                ⚠ White button text on this color is {contrastWhite(s.primaryColor).toFixed(1)}:1 — below the 4.5:1 readability guideline. Try a darker shade.
              </p>
            )}
          </div>
          <div>
            <label className={label}>Accent color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={s.accentColor} onChange={(e) => set("accentColor", e.target.value)}
                className="h-10 w-12 rounded border border-slate-300" />
              <input value={s.accentColor} onChange={(e) => set("accentColor", e.target.value)} className={field} />
            </div>
            {contrastWhite(s.accentColor) < 4.5 && (
              <p className="mt-1 text-xs text-amber-600">
                ⚠ White text on the accent (used on the logo &amp; Join/Admin buttons) is {contrastWhite(s.accentColor).toFixed(1)}:1 — below 4.5:1. Try a darker shade.
              </p>
            )}
          </div>
        </div>
        <label className={`${label} mt-3`}>Theme</label>
        <select value={s.theme} onChange={(e) => set("theme", e.target.value as SiteSettings["theme"])} className={field}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Home page</h2>
        <p className="mb-3 text-xs text-slate-500">
          Choose which sections appear on the home page and in what order. Add your own
          text blocks for announcements or intros. Which topics show under &ldquo;Browse by
          topic&rdquo; is set per-topic in <span className="font-medium">Topics</span>.
        </p>

        <div className="space-y-2">
          {s.homeSections.map((sec, i) => (
            <div key={sec.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={sec.enabled} onChange={() => patchSection(i, { enabled: !sec.enabled })} />
                <span className={`flex-1 text-sm font-medium ${sec.enabled ? "text-slate-800" : "text-slate-400 line-through"}`}>
                  {sectionLabel(sec)}
                </span>
                <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0}
                  className="grid h-8 w-8 place-items-center rounded border border-slate-200 text-xs disabled:opacity-30" aria-label="Move up">↑</button>
                <button type="button" onClick={() => moveSection(i, 1)} disabled={i === s.homeSections.length - 1}
                  className="grid h-8 w-8 place-items-center rounded border border-slate-200 text-xs disabled:opacity-30" aria-label="Move down">↓</button>
                <button type="button" onClick={() => removeSection(i)}
                  className="text-xs text-red-600 hover:underline">Remove</button>
              </div>
              {sec.kind === "text" && (
                <div className="mt-2 space-y-2">
                  <input value={sec.title || ""} onChange={(e) => patchSection(i, { title: e.target.value })}
                    placeholder="Heading (optional)" className={field} />
                  <textarea value={sec.body || ""} onChange={(e) => patchSection(i, { body: e.target.value })}
                    placeholder="Body text…" rows={3} className={field} />
                </div>
              )}
              {(sec.kind === "new" || sec.kind === "featured" || sec.kind === "type") && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <label>Preview count</label>
                  <input
                    type="number" min={1}
                    value={sec.limit ?? ""}
                    placeholder="all"
                    onChange={(e) => patchSection(i, { limit: e.target.value ? Math.max(1, parseInt(e.target.value) || 1) : undefined })}
                    className="w-20 rounded border border-slate-300 px-2 py-1"
                  />
                  <span>cards on the home page; &ldquo;See all&rdquo; opens the full list.</span>
                </div>
              )}
            </div>
          ))}
          {s.homeSections.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
              No sections — the home page will show only the hero. Add one below.
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <select value={addPick} onChange={(e) => setAddPick(e.target.value)} className={`${field} max-w-xs`}>
            {addable.map((o) => <option key={o.spec} value={o.spec}>{o.label}</option>)}
          </select>
          <button type="button" onClick={() => addSection(addPick)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
            Add section
          </button>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={s.showSidebar} onChange={(e) => set("showSidebar", e.target.checked)} />
          Show a left sidebar to filter by content type and topic
        </label>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Commerce</h2>
        <label className="mb-3 flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5" checked={s.commerceEnabled}
            onChange={(e) => set("commerceEnabled", e.target.checked)} />
          <span>
            <span className="font-medium">I sell products on this site</span>
            <span className="block text-xs text-slate-500">
              Turns on the cart, checkout, shipping step, stock indicators and order pages.
              Leave off to run as a catalog (recommended links still work).
            </span>
          </span>
        </label>
        {s.commerceEnabled && (
          <>
            <label className="mb-2 flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" className="mt-0.5" checked={s.trackInventory}
                onChange={(e) => set("trackInventory", e.target.checked)} />
              <span>
                <span className="font-medium">Track inventory</span>
                <span className="block text-xs text-slate-500">
                  Shows stock badges and counts down a product&rsquo;s inventory as it sells.
                </span>
              </span>
            </label>
            {s.trackInventory && (
              <div className="mb-3 ml-6">
                <label className={label}>Low-stock warning threshold</label>
                <input type="number" min={0} value={s.lowStockThreshold}
                  onChange={(e) => set("lowStockThreshold", Math.max(0, parseInt(e.target.value) || 0))}
                  className={`${field} w-32`} />
                <p className="mt-1 text-xs text-slate-400">
                  Shows &ldquo;Only N left&rdquo; at or below this; 0 shows &ldquo;Sold out&rdquo;.
                </p>
              </div>
            )}
            <label className="mb-3 flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" className="mt-0.5" checked={s.notifyOnShip}
                onChange={(e) => set("notifyOnShip", e.target.checked)} />
              <span>
                <span className="font-medium">Email customers when their order ships</span>
                <span className="block text-xs text-slate-500">
                  Sends a shipping notification when you mark a physical order as fulfilled.
                </span>
              </span>
            </label>
          </>
        )}
        <label className={label}>Default currency</label>
        <input value={s.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())}
          maxLength={3} className={`${field} w-32`} />
        <label className={`${label} mt-3`}>Amazon affiliate tag (optional)</label>
        <input value={s.affiliateTag} onChange={(e) => set("affiliateTag", e.target.value)}
          placeholder="youraffiliate-20" className={field} />
        <p className="mt-1 text-xs text-slate-400">Auto-appended as <code>?tag=</code> to Amazon product links.</p>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy}
          className="rounded-lg bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {busy ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved. Reload to see theme changes everywhere.</span>}
      </div>
      </form>
      <aside className="mt-6 lg:mt-0 lg:w-80 lg:shrink-0">
        <div className="lg:sticky lg:top-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Live preview</div>
          <SettingsPreview s={s} />
          <p className="mt-2 text-xs text-slate-400">Updates as you edit. Save to apply across the site.</p>
        </div>
      </aside>
    </div>
  );
}
