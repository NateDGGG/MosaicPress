import type { SiteSettings } from "./settings";

// One-click "looks" that bundle appearance settings (color, typography, corners,
// header). Applying a preset patches only these fields — content, home layout,
// commerce, hero image, etc. are left untouched.
export interface StylePreset {
  id: string;
  label: string;
  description: string;
  swatch: [string, string];
  dark?: boolean;
  patch: Partial<SiteSettings>;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "classic", label: "Classic", description: "Clean blue, system fonts, rounded corners.",
    swatch: ["#1d4ed8", "#b45309"],
    patch: { primaryColor: "#1d4ed8", accentColor: "#b45309", theme: "light", headingFontId: "", bodyFontId: "", fontScale: 1, radius: "rounded", headerNavAlign: "right", headerSticky: false },
  },
  {
    id: "editorial", label: "Editorial", description: "Serif display headings, soft corners, centered nav.",
    swatch: ["#1f3a5f", "#9a3412"],
    patch: { primaryColor: "#1f3a5f", accentColor: "#9a3412", theme: "light", headingFontId: "playfair", bodyFontId: "source-sans", fontScale: 1.05, radius: "soft", headerNavAlign: "center", headerSticky: true },
  },
  {
    id: "bold", label: "Bold", description: "Punchy color, geometric headings, sticky header.",
    swatch: ["#4f46e5", "#f59e0b"],
    patch: { primaryColor: "#4f46e5", accentColor: "#f59e0b", theme: "light", headingFontId: "poppins", bodyFontId: "source-sans", fontScale: 1, radius: "rounded", headerNavAlign: "center", headerSticky: true },
  },
  {
    id: "minimal", label: "Minimal", description: "Monochrome, Inter, sharp edges.",
    swatch: ["#111827", "#6b7280"],
    patch: { primaryColor: "#111827", accentColor: "#6b7280", theme: "light", headingFontId: "inter", bodyFontId: "inter", fontScale: 0.95, radius: "sharp", headerNavAlign: "right", headerSticky: true },
  },
  {
    id: "midnight", label: "Midnight", description: "Dark mode, sky & teal, soft corners.",
    swatch: ["#0ea5e9", "#14b8a6"], dark: true,
    patch: { primaryColor: "#0ea5e9", accentColor: "#14b8a6", theme: "dark", headingFontId: "inter", bodyFontId: "inter", fontScale: 1, radius: "soft", headerNavAlign: "center", headerSticky: true },
  },
];
