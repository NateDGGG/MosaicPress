"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteSettings } from "../lib/settings";
import { THEMES } from "../lib/themes";

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [s, setS] = useState<SiteSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

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
    <form onSubmit={save} className="space-y-5">
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
          </div>
          <div>
            <label className={label}>Accent color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={s.accentColor} onChange={(e) => set("accentColor", e.target.value)}
                className="h-10 w-12 rounded border border-slate-300" />
              <input value={s.accentColor} onChange={(e) => set("accentColor", e.target.value)} className={field} />
            </div>
          </div>
        </div>
        <label className={`${label} mt-3`}>Theme</label>
        <select value={s.theme} onChange={(e) => set("theme", e.target.value as SiteSettings["theme"])} className={field}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Commerce</h2>
        <label className={label}>Default currency</label>
        <input value={s.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())}
          maxLength={3} className={`${field} w-32`} />
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy}
          className="rounded-lg bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {busy ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved. Reload to see theme changes everywhere.</span>}
      </div>
    </form>
  );
}
