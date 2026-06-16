"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { SiteSettings, HomeSection } from "../lib/settings";
import { THEMES } from "../lib/themes";
import { FONTS } from "../lib/fonts";
import { STYLE_PRESETS } from "../lib/presets";
import { fieldKey, type FieldDef } from "../lib/fields";
import SettingsPreview from "./SettingsPreview";
import InfoTip from "./InfoTip";
import HelpLink from "./HelpLink";

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [s, setS] = useState<SiteSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addPick, setAddPick] = useState("text");
  const [tab, setTab] = useState<string>("appearance");
  const [items, setItems] = useState<{ slug: string; title: string }[]>([]);
  useEffect(() => {
    fetch("/api/items").then((r) => r.json()).then((d) => setItems((d.items || []).map((i: any) => ({ slug: i.slug, title: i.title })))).catch(() => {});
  }, []);

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
  const _contrast = (aHex: string, bHex: string) => {
    const la = _lum(aHex), lb = _lum(bHex);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };
  type ColorRole = "headerColor" | "heroColor" | "bandColor" | "footerColor";
  const roleRow = (lbl: string, key: ColorRole, textHex: string, hint: string) => (
    <div className="mb-3">
      <label className={label}>{lbl} background <InfoTip text={hint} /></label>
      <div className="flex items-center gap-2">
        <input type="color" value={s[key] || "#ffffff"} onChange={(e) => set(key, e.target.value)} className="h-10 w-12 rounded border border-slate-300" />
        <input value={s[key]} onChange={(e) => set(key, e.target.value)} placeholder="auto (from theme)" className={field} />
        {s[key] && <button type="button" onClick={() => set(key, "")} className="text-xs text-slate-500 hover:underline">Clear</button>}
      </div>
      {s[key] && _contrast(textHex, s[key]) < 4.5 && (
        <p className="mt-1 text-xs text-amber-600">
          ⚠ Text contrast {_contrast(textHex, s[key]).toFixed(1)}:1 — below 4.5. Try a {textHex === "#1e293b" ? "lighter" : "darker"} shade.
        </p>
      )}
    </div>
  );

  // Upload an image to the media store and store its URL on a settings field.
  const [heroUploading, setHeroUploading] = useState(false);
  async function uploadHero(file: File) {
    setHeroUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    setHeroUploading(false);
    if (res.ok) set("heroImage", (await res.json()).media.url);
  }
  const [imgBusy, setImgBusy] = useState("");
  async function uploadTo(key: "logoImage" | "faviconImage" | "ogImage", file: File) {
    setImgBusy(key);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    setImgBusy("");
    if (res.ok) set(key, (await res.json()).media.url);
  }
  // Upload an image for a specific home section (e.g. a "What is" feature block).
  const [secImgBusy, setSecImgBusy] = useState("");
  async function uploadSectionImage(idx: number, id: string, file: File) {
    setSecImgBusy(id);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    setSecImgBusy("");
    if (res.ok) patchSection(idx, { image: (await res.json()).media.url });
  }

  // ---- Home-page section builder ----
  const rid = () => Math.random().toString(36).slice(2, 9);
  const linksToText = (links: { label: string; href: string }[]) => links.map((l) => `${l.label} | ${l.href}`).join("\n");
  const textToLinks = (t: string) => t.split("\n").map((line) => { const [label, ...rest] = line.split("|"); return { label: (label || "").trim(), href: rest.join("|").trim() }; }).filter((l) => l.label || l.href);
  const addFooterCol = () => set("footerColumns", [...s.footerColumns, { id: rid(), title: "", links: [] }]);
  const patchFooterCol = (i: number, patch: Partial<{ title: string; links: { label: string; href: string }[] }>) =>
    set("footerColumns", s.footerColumns.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const removeFooterCol = (i: number) => set("footerColumns", s.footerColumns.filter((_, idx) => idx !== i));
  function setFields(next: FieldDef[]) { set("customFields", next); }
  function addField() {
    const base = fieldKey("field"); let key = base; let n = 1;
    while (s.customFields.some((f) => f.key === key)) { n++; key = `${base}_${n}`; }
    setFields([...s.customFields, { id: rid(), key, label: "New field", type: "text", appliesTo: "" }]);
  }
  function patchField(i: number, patch: Partial<FieldDef>) {
    setFields(s.customFields.map((f, idx) => {
      if (idx !== i) return f;
      const next = { ...f, ...patch };
      if (patch.label !== undefined) {
        let key = fieldKey(patch.label || "field"); let n = 1;
        while (s.customFields.some((o, j) => j !== i && o.key === key)) { n++; key = `${fieldKey(patch.label || "field")}_${n}`; }
        next.key = key;
      }
      return next;
    }));
  }
  function removeField(i: number) { setFields(s.customFields.filter((_, idx) => idx !== i)); }
  const FIELD_TYPES: FieldDef["type"][] = ["text", "textarea", "number", "date", "url", "boolean", "select"];
  const APPLIES = [["", "All types"], ["article", "Article"], ["blog", "Blog"], ["video", "Video"], ["product", "Product"], ["link", "Link"], ["book", "Book"]];
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
      case "feature": return sec.title ? `\u201cWhat is\u201d: ${sec.title}` : "\u201cWhat is\u201d / feature block";
      case "editorsNotes": return "Editor\u2019s notes";
      case "newsletter": return "Newsletter signup";
      case "testimonials": return "Testimonials";
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
    { spec: "editorsNotes", label: "Editor\u2019s notes (featured commentary)" },
    { spec: "newsletter", label: "Newsletter signup" },
    { spec: "testimonials", label: "Testimonials" },
    { spec: "text", label: "Custom text block" },
    { spec: "feature", label: "“What is” block (title, text, image)" },
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

  const TABS: Array<{ id: string; label: string }> = [
    { id: "appearance", label: "Appearance" },
    { id: "home", label: "Home page" },
    { id: "capabilities", label: "Capabilities" },
    { id: "fields", label: "Custom fields" },
    { id: "seo", label: "SEO & analytics" },
  ];
  const group = (id: string) => (tab === id ? "space-y-5" : "hidden");

  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      <form onSubmit={save} className="min-w-0 flex-1">
      <div className="mb-5 flex flex-wrap items-center gap-1 border-b border-slate-200" role="tablist" aria-label="Settings sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
        <HelpLink className="ml-auto px-3 py-2 text-sm font-medium text-brand hover:underline">Help guide ↗</HelpLink>
      </div>

      <div className={group("appearance")}>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Style preset <InfoTip text="One-click looks that set colors, fonts and shape together. Start here to get a coherent, professional design instantly without touching individual controls." helpId="style-preset" /></h2>
        <p className="mb-3 text-xs text-slate-500">Pick a look to apply instantly. Fine-tune anything under &ldquo;Advanced appearance&rdquo; below.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STYLE_PRESETS.map((pr) => (
            <button key={pr.id} type="button" onClick={() => setS((prev) => ({ ...prev, ...pr.patch }))}
              className="rounded-lg border border-slate-200 p-3 text-left transition hover:border-brand hover:ring-2 hover:ring-brand/20">
              <div className="mb-2 flex gap-1">
                <span className="h-5 w-5 rounded-full" style={{ background: pr.swatch[0] }} />
                <span className="h-5 w-5 rounded-full" style={{ background: pr.swatch[1] }} />
                <span className={`h-5 w-5 rounded-full border ${pr.dark ? "bg-slate-900" : "bg-white"}`} />
              </div>
              <div className="text-sm font-semibold">{pr.label}</div>
              <div className="text-[11px] text-slate-500">{pr.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Identity <InfoTip text="The core text that tells visitors who you are. Appears in the header, browser tab and search results, so it shapes first impressions and brand recognition." helpId="identity" /></h2>
        <label className={label}>Site name <InfoTip text="Your brand or site title. Shown in the header (when no logo is set) and the browser tab, and used as the name search engines and social shares display." /></label>
        <input value={s.siteName} onChange={(e) => set("siteName", e.target.value)} className={`${field} mb-3`} />
        <label className={label}>Tagline <InfoTip text="A short line that sums up what the site offers. Used as the hero headline and the default meta description — write it to hook a first-time visitor." /></label>
        <input value={s.tagline} onChange={(e) => set("tagline", e.target.value)} className={`${field} mb-3`} />
        <label className={label}>Footer text <InfoTip text="The bottom-of-page line, e.g. a copyright or short note. Use it for legal/ownership info that should appear on every page." /></label>
        <input value={s.footerText} onChange={(e) => set("footerText", e.target.value)} className={field} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Footer <InfoTip text="Build out the footer with columns of links and social icons. Helps visitors navigate and find you elsewhere, and signals a complete, trustworthy site." helpId="footer" /></h2>
        <p className="mb-3 text-xs text-slate-500">Link columns and social links. One link per line as <code>Label | https://url</code> (use <code>/path</code> for internal pages).</p>
        <div className="space-y-3">
          {s.footerColumns.map((col, i) => (
            <div key={col.id} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2">
                <input value={col.title} onChange={(e) => patchFooterCol(i, { title: e.target.value })} placeholder="Column title" className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm" />
                <button type="button" onClick={() => removeFooterCol(i)} className="text-sm text-red-600 hover:underline">Remove</button>
              </div>
              <textarea value={linksToText(col.links)} onChange={(e) => patchFooterCol(i, { links: textToLinks(e.target.value) })}
                rows={3} placeholder={"About | /about\nContact | /contact"} className="w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs" />
            </div>
          ))}
        </div>
        <button type="button" onClick={addFooterCol} className="mt-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">Add column</button>

        <label className={`${label} mt-4`}>Social links</label>
        <textarea value={linksToText(s.footerSocial)} onChange={(e) => set("footerSocial", textToLinks(e.target.value))}
          rows={3} placeholder={"Instagram | https://instagram.com/you\nYouTube | https://youtube.com/@you"} className={`${field} font-mono text-xs`} />
      </section>

      <details className="rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-5 py-3 font-semibold">Advanced appearance — colors, fonts, hero &amp; header <InfoTip text="Fine-grained design controls for when a preset isn't quite right. Everything here is optional — adjust only what you want to differ from the preset." /></summary>
        <div className="space-y-5 border-t border-slate-200 p-5">

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Hero banner <InfoTip text="The large banner at the top of the home page — your single biggest attention-grabber. Use it to set the tone and point visitors at what matters most." helpId="hero" /></h2>
        <label className={label}>Layout <InfoTip text="How the banner is built: a colored gradient, a gradient beside your image, or a full-bleed background photo. Choose image layouts for a bold, magazine feel; gradient for a clean, content-first look." /></label>
        <select value={s.heroLayout} onChange={(e) => set("heroLayout", e.target.value as SiteSettings["heroLayout"])}
          className={`${field} mb-3 max-w-xs`}>
          <option value="gradient">Gradient + latest item (default)</option>
          <option value="split">Gradient + your image (side)</option>
          <option value="image">Full background image</option>
        </select>

        <label className={label}>Hero height <InfoTip text="How tall the hero banner is. Taller options reveal more of a full-bleed background image so it isn’t cropped as much." /></label>
        <select value={s.heroHeight} onChange={(e) => set("heroHeight", e.target.value as SiteSettings["heroHeight"])} className={`${field} mb-3 max-w-xs`}>
          <option value="standard">Standard (default)</option>
          <option value="tall">Tall</option>
          <option value="xl">Extra tall</option>
        </select>

        <label className={label}>Hero emphasis <InfoTip text="Which line is the big heading in the hero: your site name (tagline shown beneath it) or your tagline (site name shown as a small label above)." /></label>
        <select value={s.heroEmphasis} onChange={(e) => set("heroEmphasis", e.target.value as SiteSettings["heroEmphasis"])} className={`${field} mb-3 max-w-xs`}>
          <option value="title">Site name is the title (default)</option>
          <option value="tagline">Tagline is the headline</option>
        </select>

        {s.heroLayout !== "gradient" && (
          <>
            <label className={label}>Hero image</label>
            <div className="mb-3 flex items-center gap-2">
              <input value={s.heroImage} onChange={(e) => set("heroImage", e.target.value)} placeholder="/uploads/… or https://…" className={field} />
              <label className="cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                {heroUploading ? "…" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHero(f); }} />
              </label>
            </div>
            {s.heroImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.heroImage} alt="" className="mb-3 aspect-[16/6] w-full rounded-lg object-cover" />
            )}
          </>
        )}

        {s.heroLayout === "image" && (
          <div className="mb-3">
            <label className={label}>Image darkening (for text legibility): {s.heroOverlay}%</label>
            <input type="range" min={0} max={90} value={s.heroOverlay}
              onChange={(e) => set("heroOverlay", parseInt(e.target.value))} className="w-full max-w-xs" />
          </div>
        )}

        <label className={label}>Hero subtitle <InfoTip text="A supporting sentence under the tagline in the banner. Use it to add context or a benefit that nudges visitors to keep reading." /></label>
        <textarea value={s.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} rows={2} className={`${field} mb-3`}
          placeholder="A supporting line under your tagline." />

        <label className={label}>Hero showcases <InfoTip text="What the banner spotlights: your newest/featured item automatically, one specific item you pick, or nothing (just text + buttons). Pick a specific item to always promote a flagship piece." /></label>
        <select value={s.heroSource} onChange={(e) => set("heroSource", e.target.value as SiteSettings["heroSource"])} className={`${field} mb-3 max-w-xs`}>
          <option value="auto">Latest / featured item (default)</option>
          <option value="item">A specific item</option>
          <option value="none">Nothing (text + buttons only)</option>
        </select>
        {s.heroSource === "item" && (
          <div className="mb-3">
            <label className={label}>Featured item</label>
            <select value={s.heroItemSlug} onChange={(e) => set("heroItemSlug", e.target.value)} className={field}>
              <option value="">Choose an item…</option>
              {items.map((i) => <option key={i.slug} value={i.slug}>{i.title}</option>)}
            </select>
          </div>
        )}
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={s.heroShowPrimaryCta} onChange={(e) => set("heroShowPrimaryCta", e.target.checked)} />
          Show the primary hero button
          <InfoTip text="The main call-to-action button in the hero (e.g. “▶ Watch the latest” / “Start exploring”). Uncheck to hide it while keeping the showcased item and the secondary button." />
        </label>
        <div className={`grid grid-cols-2 gap-4 ${s.heroShowPrimaryCta ? "" : "opacity-50"}`}>
          <div>
            <label className={label}>Primary button label (optional)</label>
            <input value={s.heroCtaLabel} onChange={(e) => set("heroCtaLabel", e.target.value)} placeholder="Start exploring" className={field} disabled={!s.heroShowPrimaryCta} />
          </div>
          <div>
            <label className={label}>Primary button link (optional)</label>
            <input value={s.heroCtaHref} onChange={(e) => set("heroCtaHref", e.target.value)} placeholder="/book or https://…" className={field} />
          </div>
          <div>
            <label className={label}>Secondary button label (blank to hide)</label>
            <input value={s.heroCta2Label} onChange={(e) => set("heroCta2Label", e.target.value)} placeholder="Become a member" className={field} />
          </div>
          <div>
            <label className={label}>Secondary button link</label>
            <input value={s.heroCta2Href} onChange={(e) => set("heroCta2Href", e.target.value)} placeholder="/membership" className={field} />
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400">Leave the button blank to use the showcased item; set a link (e.g. /book, /shop) to point the hero anywhere.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Branding &amp; header <InfoTip text="Your logo and the top navigation bar — present on every page. Getting these right makes the site instantly feel like yours and keeps key actions within reach." helpId="branding" /></h2>

        <label className={label}>Logo (falls back to initials when empty) <InfoTip text="Upload a logo to replace the text site-name in the header — the biggest single 'this is my brand' win. If empty, a two-letter monogram is shown instead." /></label>
        <div className="mb-3 flex items-center gap-2">
          <input value={s.logoImage} onChange={(e) => set("logoImage", e.target.value)} placeholder="/uploads/… or https://…" className={field} />
          <label className="cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            {imgBusy === "logoImage" ? "…" : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadTo("logoImage", f); }} />
          </label>
        </div>
        {s.logoImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.logoImage} alt="" className="mb-3 h-8 w-auto max-w-[200px] object-contain" />
        )}

        {s.logoImage && (
          <div className="mb-3">
            <label className={label}>Logo size <InfoTip text="How tall the logo appears in the header. Larger sizes make a wordmark's text readable; Medium suits most logos, Large for text-heavy marks, Small for a compact bar." /></label>
            <select value={s.logoSize} onChange={(e) => set("logoSize", e.target.value as SiteSettings["logoSize"])} className={`${field} max-w-xs`}>
              <option value="small">Small (compact)</option>
              <option value="medium">Medium (recommended)</option>
              <option value="large">Large (readable wordmark)</option>
            </select>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={s.logoSolidBg} onChange={(e) => set("logoSolidBg", e.target.checked)} />
              Keep the logo on a white background
              <InfoTip text="Sits your logo on a small white panel so it looks identical whether the site is in light or dark mode. Turn this on if a dark or colored logo blends into the header." />
            </label>
          </div>
        )}

        <label className={label}>Favicon (browser tab icon) <InfoTip text="The little icon shown in browser tabs and bookmarks. A custom one makes your site recognizable among many open tabs." /></label>
        <div className="mb-3 flex items-center gap-2">
          <input value={s.faviconImage} onChange={(e) => set("faviconImage", e.target.value)} placeholder="/uploads/… or https://…" className={field} />
          <label className="cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            {imgBusy === "faviconImage" ? "…" : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadTo("faviconImage", f); }} />
          </label>
        </div>

        <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={s.headerSticky} onChange={(e) => set("headerSticky", e.target.checked)} />
          Keep the header pinned to the top on scroll
          <InfoTip text="When on, the header stays visible as visitors scroll, so navigation and your call-to-action are always one click away. Turn off for a more traditional page that scrolls away." />
        </label>

        <label className={label}>Navigation placement <InfoTip text="Whether the nav links sit centered or to the right. Centered reads more editorial/brand-forward; right-aligned is the conventional app layout." /></label>
        <select value={s.headerNavAlign} onChange={(e) => set("headerNavAlign", e.target.value as SiteSettings["headerNavAlign"])} className={`${field} mb-3 max-w-xs`}>
          <option value="right">Right (next to account)</option>
          <option value="center">Center</option>
        </select>

        <div className="mb-3 grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Header button label (blank to hide) <InfoTip text="The prominent action button at the top-right (e.g. Join, Book, Subscribe). Set it to the single thing you most want visitors to do; clear it to remove the button entirely." /></label>
            <input value={s.headerCtaLabel} onChange={(e) => set("headerCtaLabel", e.target.value)} placeholder="Join" className={field} />
          </div>
          <div>
            <label className={label}>Header button link <InfoTip text="Where the header button goes — an internal path like /join or /book, or a full https:// URL." /></label>
            <input value={s.headerCtaHref} onChange={(e) => set("headerCtaHref", e.target.value)} placeholder="/join" className={field} />
          </div>
        </div>
        <p className="mb-3 text-xs text-slate-400">Shown to logged-out visitors. The &ldquo;Membership&rdquo; nav link auto-hides when no plans exist.</p>

        <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={s.showAccountNav} onChange={(e) => set("showAccountNav", e.target.checked)} />
          Show the &ldquo;Sign in&rdquo; / account button
          <InfoTip text="The header link that lets visitors sign in or reach their account. Turn it off if you don't use accounts, memberships, or logins — your header button above is unaffected." />
        </label>

        <label className={label}>Corner style <InfoTip text="How rounded corners are site-wide (buttons, cards, inputs). Sharp feels precise/minimal, soft feels friendly/modern — a quick way to shift the whole personality." /></label>
        <select value={s.radius} onChange={(e) => set("radius", e.target.value as SiteSettings["radius"])} className={`${field} max-w-xs`}>
          <option value="sharp">Sharp (minimal)</option>
          <option value="rounded">Rounded (default)</option>
          <option value="soft">Soft (extra round)</option>
        </select>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Theme <InfoTip text="Packaged color + mode + font combinations. Picking one sets the base palette; the Fine-tune controls below override individual pieces." helpId="theme" /></h2>
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
            <label className={label}>Primary color <InfoTip text="Your main brand color, used for buttons, links and key accents. Pick something with enough contrast for white text — the warning below flags it if not." /></label>
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
            <label className={label}>Accent color <InfoTip text="A secondary color for highlights like the logo monogram and small badges. Use it to add contrast and energy alongside the primary color." /></label>
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
        <label className={`${label} mt-3`}>Theme <InfoTip text="Light or dark base for backgrounds and text. Dark mode suits image-heavy or evening-reading sites; light is the safe default for most content." /></label>
        <select value={s.theme} onChange={(e) => set("theme", e.target.value as SiteSettings["theme"])} className={field}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>

        <h2 className="mb-3 mt-5 font-semibold">Typography <InfoTip text="The fonts and text size for the whole site. Good type pairing makes content easier to read and signals quality and brand character." helpId="theme" /></h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Heading font <InfoTip text="The font for titles and headings. A distinctive heading font (e.g. a display serif) gives the site character; leave as 'Same as body' for a clean, uniform look." /></label>
            <select value={s.headingFontId} onChange={(e) => set("headingFontId", e.target.value)} className={field}
              style={{ fontFamily: FONTS.find((f) => f.id === s.headingFontId)?.stack }}>
              <option value="">Same as body</option>
              {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Body font <InfoTip text="The font for paragraphs and most text. Prioritize legibility here — a clean sans-serif is a safe choice for long-form reading." /></label>
            <select value={s.bodyFontId} onChange={(e) => set("bodyFontId", e.target.value)} className={field}
              style={{ fontFamily: FONTS.find((f) => f.id === s.bodyFontId)?.stack }}>
              <option value="">Theme default</option>
              {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <label className={`${label} mt-3`}>Text size: {Math.round((s.fontScale || 1) * 100)}% <InfoTip text="Scales all text up or down together. Nudge it up for a comfortable, accessible read or down for a denser, more compact layout." /></label>
        <input type="range" min={85} max={125} step={5} value={Math.round((s.fontScale || 1) * 100)}
          onChange={(e) => set("fontScale", parseInt(e.target.value) / 100)} className="w-full max-w-xs" />
        <p className="mt-1 text-xs text-slate-400">Non-system fonts load from Google Fonts only when selected.</p>

        <h2 className="mb-1 mt-5 font-semibold">Section colors <InfoTip text="Optional explicit colors for the header, hero, call-to-action band and footer. Use these for precise brand control; leave blank and they're derived from your theme automatically." helpId="section-colors" /></h2>
        <p className="mb-3 text-xs text-slate-500">Optional explicit colors for each band. Leave blank to derive from your theme.</p>
        {roleRow("Header", "headerColor", "#edf2f9", "The color of the top navigation bar. Set it to reinforce your brand at the very top of every page; leave blank to derive a shade from your theme.")}
        {roleRow("Hero", "heroColor", "#edf2f9", "The background of the big home-page banner (gradient mode). Use it to set the first impression; leave blank to use your primary color.")}
        {roleRow("CTA band", "bandColor", "#1e293b", "The 'Create your free account' / call-to-action strip near the bottom of the home page. A contrasting color here draws the eye to the action you want visitors to take.")}
        {roleRow("Footer", "footerColor", "#edf2f9", "The background of the site footer. Match or contrast it with the header to frame the page; leave blank to derive from your theme.")}

        <h2 className="mb-3 mt-5 font-semibold">Cards <InfoTip text="How the repeated content cards (in rails and grids) look. Because cards appear everywhere, small changes here read across the whole site." helpId="cards" /></h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Image ratio <InfoTip text="The shape of card thumbnails: widescreen 16:9 (video-like), 4:3 (classic), or 1:1 (square). Match it to your imagery so covers aren't awkwardly cropped." /></label>
            <select value={s.cardAspect} onChange={(e) => set("cardAspect", e.target.value as SiteSettings["cardAspect"])} className={field}>
              <option value="video">Widescreen (16:9)</option>
              <option value="wide">Classic (4:3)</option>
              <option value="square">Square (1:1)</option>
            </select>
          </div>
          <div>
            <label className={label}>Shadow <InfoTip text="How much cards lift off the page. Flat is minimal and modern; raised adds depth and makes cards feel tappable." /></label>
            <select value={s.cardShadow} onChange={(e) => set("cardShadow", e.target.value as SiteSettings["cardShadow"])} className={field}>
              <option value="flat">Flat</option>
              <option value="subtle">Subtle</option>
              <option value="raised">Raised</option>
            </select>
          </div>
        </div>
      </section>

        </div>
      </details>
      </div>

      <div className={group("home")}>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Home page <InfoTip text="Compose the home page from stackable sections (rails, topic lists, text blocks) in any order. This is how you decide what visitors see first and how they're guided through your content." helpId="home" /></h2>
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
              {sec.kind === "feature" && (
                <div className="mt-2 space-y-2">
                  <input value={sec.title || ""} onChange={(e) => patchSection(i, { title: e.target.value })}
                    placeholder="Title — e.g. “What is Your Site?”" className={field} />
                  <textarea value={sec.body || ""} onChange={(e) => patchSection(i, { body: e.target.value })}
                    placeholder="Intro / description text…" rows={3} className={field} />
                  <div className="flex items-center gap-2">
                    <input value={sec.image || ""} onChange={(e) => patchSection(i, { image: e.target.value })}
                      placeholder="Image URL (/uploads/… or https://…)" className={field} />
                    <label className="cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      {secImgBusy === sec.id ? "…" : "Upload"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSectionImage(i, sec.id, f); }} />
                    </label>
                  </div>
                  {sec.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sec.image} alt="" className="aspect-[16/6] w-full rounded-lg object-cover" />
                  )}
                  <input value={sec.footer || ""} onChange={(e) => patchSection(i, { footer: e.target.value })}
                    placeholder="Footer line (optional)" className={field} />
                </div>
              )}
              {(sec.kind === "new" || sec.kind === "featured" || sec.kind === "type" || sec.kind === "topics") && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <label>{sec.kind === "topics" ? "Max per topic" : "Preview count"}</label>
                  <input
                    type="number" min={1}
                    value={sec.limit ?? ""}
                    placeholder={sec.kind === "topics" ? "8" : "all"}
                    onChange={(e) => patchSection(i, { limit: e.target.value ? Math.max(1, parseInt(e.target.value) || 1) : undefined })}
                    className="w-20 rounded border border-slate-300 px-2 py-1"
                  />
                  <span>
                    {sec.kind === "topics"
                      ? "items shown per topic; “See all” jumps to the topic when there are more (the default topic shows all your content)."
                      : "cards on the home page; “See all” opens the full list."}
                  </span>
                  {sec.kind === "topics" && (
                    <>
                      <label className="ml-2">Columns</label>
                      <input
                        type="number" min={1} max={6}
                        value={sec.cols ?? ""}
                        placeholder="4"
                        onChange={(e) => patchSection(i, { cols: e.target.value ? Math.min(6, Math.max(1, parseInt(e.target.value) || 4)) : undefined })}
                        className="w-16 rounded border border-slate-300 px-2 py-1"
                      />
                      <span>tiles across (default 4).</span>
                    </>
                  )}
                  <span className="ml-2">Commentary</span>
                  <select
                    value={sec.commentary || ""}
                    onChange={(e) => patchSection(i, { commentary: (e.target.value || undefined) as HomeSection["commentary"] })}
                    className="rounded border border-slate-300 px-2 py-1"
                  >
                    <option value="">Default</option>
                    <option value="hidden">Hidden</option>
                    <option value="excerpt">Excerpt</option>
                    <option value="full">Full</option>
                  </select>
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
          <InfoTip text="Adds a filter sidebar to the home page so visitors can narrow by content type or topic. Helpful for larger catalogs; leave off for a cleaner, simpler landing page." />
        </label>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={s.alternateSections} onChange={(e) => set("alternateSections", e.target.checked)} />
          Alternate section background colors
          <InfoTip text="Gives stacked home-page sections cycling background tints (derived from your theme) so they don’t all look the same — like the colored bands on sites such as PragerU. Only applies when the sidebar is off." />
        </label>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Content <InfoTip text="Authoring conveniences and how your editorial voice (commentary) appears to visitors as they browse." helpId="content" /></h2>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5" checked={s.autoFetchImage}
            onChange={(e) => set("autoFetchImage", e.target.checked)} />
          <span>
            <span className="font-medium">Auto-fetch preview images from links</span>
            <span className="block text-xs text-slate-500">
              When adding a link, product, or book by URL, automatically pull its preview image.
              Turn off to fetch manually with the &ldquo;Fetch from link&rdquo; button instead.
            </span>
          </span>
        </label>

        <div className="mt-4">
          <label className={label}>Show your commentary on home-page cards <InfoTip text="Whether your per-item 'From the editor' notes appear on home-page cards, and how much. Excerpt adds a short take to entice clicks; Hidden keeps the home page clean (notes still show on the item page)." /></label>
          <select value={s.homeCommentary} onChange={(e) => set("homeCommentary", e.target.value as SiteSettings["homeCommentary"])}
            className={`${field} max-w-xs`}>
            <option value="hidden">Hidden (cleanest — commentary only on the item page)</option>
            <option value="excerpt">Excerpt (a short note under the card)</option>
            <option value="full">Full (longer note, up to ~5 lines)</option>
          </select>
          {s.homeCommentary === "excerpt" && (
            <div className="mt-2">
              <label className={label}>Excerpt length (characters)</label>
              <input type="number" min={40} value={s.commentaryExcerptChars}
                onChange={(e) => set("commentaryExcerptChars", Math.max(40, parseInt(e.target.value) || 40))}
                className={`${field} w-32`} />
            </div>
          )}
          <p className="mt-1 text-xs text-slate-400">
            For a bolder editorial voice, add an &ldquo;Editor&rsquo;s notes&rdquo; section under Home page and flag items with
            &ldquo;Feature this commentary&rdquo; in the editor.
          </p>
        </div>
      </section>
      </div>

      <div className={group("capabilities")}>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Commerce <InfoTip text="Turn the site into a shop. Optional — leave it off to run as a pure catalog/affiliate site. When on, it adds cart, checkout, inventory and orders." helpId="commerce" /></h2>
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
        <label className={label}>Default currency <InfoTip text="The 3-letter currency code (e.g. USD, EUR, GBP) used to display and charge prices across the store." /></label>
        <input value={s.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())}
          maxLength={3} className={`${field} w-32`} />
        <label className={`${label} mt-3`}>Amazon affiliate tag (optional) <InfoTip text="Your Amazon Associates tag. When set, it's auto-appended to Amazon product links so you earn commission on referred purchases." /></label>
        <input value={s.affiliateTag} onChange={(e) => set("affiliateTag", e.target.value)}
          placeholder="youraffiliate-20" className={field} />
        <p className="mt-1 text-xs text-slate-400">Auto-appended as <code>?tag=</code> to Amazon product links.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Contact form <InfoTip text="A public contact page so visitors can reach you. The #1 way to capture inquiries/leads — submissions are stored in admin and optionally emailed to you." helpId="contact" /></h2>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5" checked={s.contactEnabled} onChange={(e) => set("contactEnabled", e.target.checked)} />
          <span>
            <span className="font-medium">Enable a public Contact page</span>
            <span className="block text-xs text-slate-500">Adds a &ldquo;Contact&rdquo; nav link; submissions arrive under Admin → Messages.</span>
          </span>
        </label>
        {s.contactEnabled && (
          <div className="mt-3">
            <label className={label}>Heading</label>
            <input value={s.contactHeading} onChange={(e) => set("contactHeading", e.target.value)} className={`${field} mb-3`} />
            <label className={label}>Intro</label>
            <textarea value={s.contactBlurb} onChange={(e) => set("contactBlurb", e.target.value)} rows={2} className={`${field} mb-3`} />
            <label className={label}>Notify email (optional)</label>
            <input value={s.contactNotifyEmail} onChange={(e) => set("contactNotifyEmail", e.target.value)} placeholder="you@example.com" className={field} />
            <p className="mt-1 text-xs text-slate-400">A copy of each message is emailed here when SMTP is configured (otherwise just stored).</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Newsletter <InfoTip text="An email signup so you can build an audience and bring visitors back. Subscribers are stored and exportable as CSV for your email tool." helpId="newsletter" /></h2>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5" checked={s.newsletterEnabled} onChange={(e) => set("newsletterEnabled", e.target.checked)} />
          <span>
            <span className="font-medium">Enable newsletter signup</span>
            <span className="block text-xs text-slate-500">Add a &ldquo;Newsletter signup&rdquo; home section; subscribers appear under Admin → Subscribers (export CSV).</span>
          </span>
        </label>
        {s.newsletterEnabled && (
          <div className="mt-3">
            <label className={label}>Heading</label>
            <input value={s.newsletterHeading} onChange={(e) => set("newsletterHeading", e.target.value)} className={`${field} mb-3`} />
            <label className={label}>Intro</label>
            <textarea value={s.newsletterBlurb} onChange={(e) => set("newsletterBlurb", e.target.value)} rows={2} className={`${field} mb-3`} />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={s.newsletterAskName} onChange={(e) => set("newsletterAskName", e.target.checked)} />
              Also ask for a name
            </label>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Booking <InfoTip text="Let visitors request or schedule time with you — essential for coaching/services. Use the built-in request form, or embed an external scheduler like Calendly." helpId="booking" /></h2>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5" checked={s.bookingEnabled} onChange={(e) => set("bookingEnabled", e.target.checked)} />
          <span>
            <span className="font-medium">Enable a Book page</span>
            <span className="block text-xs text-slate-500">Adds a &ldquo;Book&rdquo; nav link. Use a built-in request form or embed an external scheduler.</span>
          </span>
        </label>
        {s.bookingEnabled && (
          <div className="mt-3">
            <label className={label}>Heading</label>
            <input value={s.bookingHeading} onChange={(e) => set("bookingHeading", e.target.value)} className={`${field} mb-3`} />
            <label className={label}>Intro</label>
            <textarea value={s.bookingBlurb} onChange={(e) => set("bookingBlurb", e.target.value)} rows={2} className={`${field} mb-3`} />
            <label className={label}>Mode</label>
            <select value={s.bookingMode} onChange={(e) => set("bookingMode", e.target.value as SiteSettings["bookingMode"])} className={`${field} mb-3 max-w-xs`}>
              <option value="request">Built-in request form</option>
              <option value="embed">Embed an external scheduler</option>
            </select>
            {s.bookingMode === "embed" ? (
              <>
                <label className={label}>Scheduler URL (Calendly, Cal.com, Acuity…)</label>
                <input value={s.bookingEmbedUrl} onChange={(e) => set("bookingEmbedUrl", e.target.value)} placeholder="https://calendly.com/you/intro" className={`${field} mb-1`} />
                <p className="mt-1 text-xs text-slate-400">Must be an https:// URL; it&rsquo;s embedded in an iframe on /book.</p>
              </>
            ) : (
              <>
                <label className={label}>Notify email for requests (optional)</label>
                <input value={s.bookingNotifyEmail} onChange={(e) => set("bookingNotifyEmail", e.target.value)} placeholder="you@example.com" className={field} />
                <p className="mt-1 text-xs text-slate-400">Requests appear under Admin → Bookings; emailed here when SMTP is configured.</p>
              </>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Lesson progress &amp; resume <InfoTip text="Turns the site into a self-paced course player: it remembers how far each visitor has gotten so they can pick up where they left off. Choose whether that requires a login, works anonymously, or is off." helpId="progress" /></h2>
        <p className="mb-3 text-xs text-slate-500">
          Controls whether the site remembers how far a visitor has gotten, so they can pick up where
          they left off (the &ldquo;Resume&rdquo; button on a learning path and &ldquo;Complete &amp; continue&rdquo; on a lesson).
        </p>
        <label className={label}>Who gets progress tracking</label>
        <select value={s.progressTracking} onChange={(e) => set("progressTracking", e.target.value as SiteSettings["progressTracking"])}
          className={`${field} max-w-md`}>
          <option value="login">Signed-in visitors only (default)</option>
          <option value="anonymous">Everyone — no login needed (saved on the device)</option>
          <option value="off">No tracking — hide progress, completion &amp; resume</option>
        </select>
        <p className="mt-2 text-xs text-slate-400">
          {s.progressTracking === "anonymous"
            ? "Progress is stored against an anonymous device cookie — no account required — and merges into a visitor's account if they later sign in."
            : s.progressTracking === "off"
            ? "Save-for-later, mark-complete and the resume/progress UI are hidden everywhere."
            : "Visitors must sign in for their progress to be saved across visits."}
        </p>
      </section>
      </div>

      <div className={group("fields")}>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Custom fields <InfoTip text="Define your own structured fields (prep time, difficulty, ISBN, etc.) that appear on items as a Details table. Use them to capture domain-specific data, power browse filters, and feed rich-result SEO." helpId="custom-fields" /></h2>
        <p className="mb-3 text-xs text-slate-500">Define structured fields for your items (e.g. prep time, evidence level, price). They appear in the item editor and as a &ldquo;Details&rdquo; table on the page.</p>
        <div className="space-y-3">
          {s.customFields.map((f, i) => (
            <div key={f.id} className="rounded-lg border border-slate-200 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <input value={f.label} onChange={(e) => patchField(i, { label: e.target.value })} placeholder="Label"
                  className="rounded border border-slate-300 px-2 py-1 text-sm" />
                <select value={f.type} onChange={(e) => patchField(i, { type: e.target.value as FieldDef["type"] })}
                  className="rounded border border-slate-300 px-2 py-1 text-sm">
                  {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={f.appliesTo || ""} onChange={(e) => patchField(i, { appliesTo: e.target.value })}
                  className="rounded border border-slate-300 px-2 py-1 text-sm">
                  {APPLIES.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
                </select>
                <button type="button" onClick={() => removeField(i)} className="text-sm text-red-600 hover:underline">Remove</button>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {f.type === "number" && (
                  <input value={f.unit || ""} onChange={(e) => patchField(i, { unit: e.target.value })} placeholder="Unit (e.g. min, kg)"
                    className="rounded border border-slate-300 px-2 py-1 text-sm" />
                )}
                {f.type === "select" && (
                  <input value={(f.options || []).join(", ")} onChange={(e) => patchField(i, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                    placeholder="Options, comma-separated" className="rounded border border-slate-300 px-2 py-1 text-sm sm:col-span-2" />
                )}
                {(f.type === "select" || f.type === "boolean") && (
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input type="checkbox" checked={!!f.filterable} onChange={(e) => patchField(i, { filterable: e.target.checked })} /> Use as a browse filter
                  </label>
                )}
                <input value={f.schemaProp || ""} onChange={(e) => patchField(i, { schemaProp: e.target.value })}
                  placeholder="schema.org property (optional, e.g. prepTime)" className="rounded border border-slate-300 px-2 py-1 text-sm" />
                <span className="self-center text-xs text-slate-400">key: {f.key}</span>
              </div>
            </div>
          ))}
          {s.customFields.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">No custom fields yet.</p>}
        </div>
        <button type="button" onClick={addField} className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">Add field</button>
      </section>
      </div>

      <div className={group("seo")}>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">SEO &amp; analytics <InfoTip text="How the site appears in Google and on social shares, plus visitor analytics. Good defaults here improve click-through from search/social and let you measure traffic." helpId="seo" /></h2>
        <label className={label}>Default meta description (blank = tagline) <InfoTip text="The summary search engines and social cards show under your title when a page has none of its own. Write ~150 chars that make someone want to click; falls back to your tagline." /></label>
        <textarea value={s.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} rows={2} className={`${field} mb-3`} />
        <label className={label}>Default social share image (Open Graph) <InfoTip text="The picture shown when your pages are shared on social media or chat. A branded default makes links look polished and boosts click-through." /></label>
        <div className="mb-3 flex items-center gap-2">
          <input value={s.ogImage} onChange={(e) => set("ogImage", e.target.value)} placeholder="/uploads/… or https://…" className={field} />
          <label className="cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            {imgBusy === "ogImage" ? "…" : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadTo("ogImage", f); }} />
          </label>
        </div>
        <label className={label}>Twitter / X handle (optional) <InfoTip text="Your @handle, attributed on Twitter/X share cards so posts credit your account and can drive follows." /></label>
        <input value={s.twitterHandle} onChange={(e) => set("twitterHandle", e.target.value)} placeholder="@yoursite" className={`${field} mb-3`} />
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={s.seoIndexable} onChange={(e) => set("seoIndexable", e.target.checked)} />
          Allow search engines to index this site
          <InfoTip text="When on, search engines may list your pages and the sitemap is advertised. Turn off while a site is unfinished or private to keep it out of Google." />
        </label>
        <label className={label}>Analytics snippet (pasted into &lt;head&gt;) <InfoTip text="Paste a tracking snippet (Google Analytics, Plausible, Fathom, etc.) and it runs on every page so you can measure traffic. Leave blank for no analytics." /></label>
        <textarea value={s.analyticsHead} onChange={(e) => set("analyticsHead", e.target.value)} rows={4}
          placeholder="Paste your Google Analytics / Plausible / Fathom snippet…" className={`${field} font-mono text-xs`} />
        <p className="mt-1 text-xs text-slate-400">Runs on every page. A sitemap is served at /sitemap.xml and robots at /robots.txt.</p>
      </section>
      </div>

      <div className="mt-5 flex items-center gap-3">
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
