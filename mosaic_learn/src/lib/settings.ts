import { prisma } from "./db";

// Site-wide configuration. Defaults here; overridable via the Setting table
// (admin → Settings). The product name itself is configurable — "Mosaic" is
// only the default.
export interface SiteSettings {
  siteName: string;
  tagline: string;
  themeId: string; // selected theme package (see lib/themes.ts)
  primaryColor: string; // hex
  accentColor: string; // hex
  theme: "light" | "dark";
  fontFamily: string;
  currency: string;
  footerText: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Mosaic Learn",
  tagline: "Five-minute ideas that explain the world.",
  themeId: "classic",
  primaryColor: "#1d4ed8",
  accentColor: "#b45309",
  theme: "light",
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  currency: "USD",
  footerText: "Mosaic Learn — a demo built on Mosaic.",
};

const SETTINGS_KEY = "site";

export async function getSettings(): Promise<SiteSettings> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: SETTINGS_KEY } });
    if (!row) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(row.value) as Partial<SiteSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await prisma.setting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: JSON.stringify(next) },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
  });
  return next;
}

// "#1d4ed8" -> "29 78 216" for use in CSS `rgb(var(--brand) / <alpha>)`.
export function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "29 78 216";
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

// Darken a hex color by a factor (0..1) for the hover/dark brand shade.
export function darken(hex: string, factor = 0.8): string {
  const t = hexToRgbTriplet(hex).split(" ").map(Number);
  return t.map((c) => Math.round(c * factor)).join(" ");
}

// Mix toward white (tint) or black (shade) by amount 0..1. Returns an rgb triplet.
export function tint(hex: string, amount = 0.9): string {
  const t = hexToRgbTriplet(hex).split(" ").map(Number);
  return t.map((c) => Math.round(c + (255 - c) * amount)).join(" ");
}
export function shade(hex: string, amount = 0.6): string {
  const t = hexToRgbTriplet(hex).split(" ").map(Number);
  return t.map((c) => Math.round(c * (1 - amount))).join(" ");
}

// Derive a coordinated set of per-section colors from the theme. Every section
// (header, hero, content, accent band, footer) gets a distinct color that still
// "fits" the selected primary/accent + light/dark mode.
export function sectionPalette(s: SiteSettings) {
  const dark = s.theme === "dark";
  return {
    brand: hexToRgbTriplet(s.primaryColor),
    brandDark: darken(s.primaryColor, 0.8),
    accent: hexToRgbTriplet(s.accentColor),
    font: s.fontFamily,
    // header sits above the hero — deep brand with light text
    headerBg: dark ? shade(s.primaryColor, 0.7) : shade(s.primaryColor, 0.45),
    headerFg: "237 242 249",
    // hero gradient
    heroFrom: hexToRgbTriplet(s.primaryColor),
    heroTo: darken(s.primaryColor, 0.62),
    // page background behind content
    pageBg: dark ? "9 13 25" : "248 250 252",
    // alternating "band" section (e.g. the CTA strip) — accent-tinted
    bandBg: dark ? shade(s.primaryColor, 0.55) : tint(s.accentColor, 0.9),
    bandFg: dark ? "237 242 249" : "30 41 59",
    // a distinct primary-tinted band (e.g. "Browse by topic")
    topicBg: dark ? shade(s.primaryColor, 0.32) : tint(s.primaryColor, 0.9),
    topicFg: dark ? "237 242 249" : "30 41 59",
    // footer
    footerBg: dark ? "3 6 16" : shade(s.primaryColor, 0.42),
    footerFg: "203 213 225",
  };
}
