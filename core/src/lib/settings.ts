import { prisma } from "./db";
import type { FieldDef } from "./fields";

// Site-wide configuration. Defaults here; overridable via the Setting table
// (admin → Settings). The product name itself is configurable — "Mosaic" is
// only the default.
export type HomeSectionKind = "new" | "featured" | "topics" | "collections" | "type" | "text" | "editorsNotes" | "newsletter" | "testimonials";

// One block in the home-page layout. Reorderable and individually toggleable
// in admin → Settings. "text" blocks hold owner-authored copy.
export interface HomeSection {
  id: string;
  kind: HomeSectionKind;
  enabled: boolean;
  itemType?: string; // kind="type": article | video | product | link | book
  limit?: number;    // rail sections (new/featured/type): max cards previewed on home
  commentary?: "hidden" | "excerpt" | "full"; // per-section override of the global card commentary mode
  title?: string;    // kind="text" heading (also used as a label override)
  body?: string;     // kind="text" body copy
}

export interface FooterLink { label: string; href: string; }
export interface FooterColumn { id: string; title: string; links: FooterLink[]; }

export interface SiteSettings {
  siteName: string;
  tagline: string;
  heroSubtitle: string;   // supporting line under the tagline in the hero
  heroImage: string;      // optional hero background/side image URL
  heroLayout: "gradient" | "image" | "split"; // gradient (default) | full image bg | text+image
  heroOverlay: number;    // 0–90 darken overlay % for the image layout (legibility)
  heroSource: "auto" | "item" | "none"; // what the hero showcases: latest/featured, a chosen item, or nothing
  heroItemSlug: string;   // when heroSource="item"
  heroCtaLabel: string;   // override the primary hero button text
  heroCtaHref: string;    // override the primary hero button link
  heroCta2Label: string;  // secondary hero button text ("" hides it)
  heroCta2Href: string;   // secondary hero button link
  themeId: string; // selected theme package (see lib/themes.ts)
  primaryColor: string; // hex
  accentColor: string; // hex
  theme: "light" | "dark";
  fontFamily: string;       // legacy/base body font (theme default)
  headingFontId: string;    // catalog id for headings ("" = inherit body)
  bodyFontId: string;       // catalog id for body ("" = use fontFamily)
  fontScale: number;        // global type scale (0.85–1.25)
  currency: string;
  footerText: string;
  footerColumns: FooterColumn[];  // grouped link columns in the footer
  footerSocial: FooterLink[];     // social / external links row
  logoImage: string;       // header logo (falls back to initials when empty)
  faviconImage: string;    // browser tab icon
  headerSticky: boolean;   // keep the header pinned on scroll
  headerNavAlign: "right" | "center"; // desktop nav placement
  headerCtaLabel: string; // header button for logged-out visitors ("" hides it)
  headerCtaHref: string;
  radius: "sharp" | "rounded" | "soft"; // global corner-radius personality
  headerColor: string;     // explicit header background ("" = derived from primary)
  heroColor: string;       // explicit hero gradient base ("" = derived)
  bandColor: string;       // explicit CTA band background ("" = derived)
  footerColor: string;     // explicit footer background ("" = derived)
  cardAspect: "video" | "square" | "wide"; // card image ratio
  cardShadow: "flat" | "subtle" | "raised"; // card elevation
  groupByType: boolean;
  showSidebar: boolean;
  aboutTitle: string;
  aboutBody: string;
  affiliateTag: string;
  contactEnabled: boolean;       // show a public Contact page + nav link
  contactHeading: string;
  contactBlurb: string;
  contactNotifyEmail: string;    // where to email new submissions (optional)
  newsletterEnabled: boolean;    // show signup form + optional home section
  newsletterHeading: string;
  newsletterBlurb: string;
  newsletterAskName: boolean;    // also collect a name field
  bookingEnabled: boolean;       // show a Book page + nav link
  bookingHeading: string;
  bookingBlurb: string;
  bookingMode: "request" | "embed"; // built-in request form vs. external scheduler embed
  bookingEmbedUrl: string;       // Calendly/Cal.com/Acuity URL (embed mode)
  bookingNotifyEmail: string;
  customFields: FieldDef[];      // owner-defined structured fields for items
  seoDescription: string;        // default meta description ("" = tagline)
  ogImage: string;               // default social share image URL
  twitterHandle: string;         // e.g. @yoursite
  seoIndexable: boolean;         // allow search engines to index the site
  analyticsHead: string;         // raw analytics snippet injected into <head>
  // Commerce master switch. When off, cart/checkout/shipping, stock badges and
  // order pages are all hidden — the site runs as a pure catalog.
  commerceEnabled: boolean;
  lowStockThreshold: number; // show "Only N left" at/below this; 0 => sold out
  trackInventory: boolean; // show stock badges + decrement inventory on purchase
  notifyOnShip: boolean; // email the customer when an order is marked fulfilled (shipped)
  autoFetchImage: boolean; // auto-fetch a preview image from a URL while authoring
  homeCommentary: "hidden" | "excerpt" | "full"; // show owner commentary on home cards
  commentaryExcerptChars: number; // truncation length for card commentary excerpts
  // Lesson progress / resume behaviour:
  //  "login"     — only signed-in users get saved progress + Resume (default)
  //  "anonymous" — anyone gets device-cookie progress; merges into an account on login
  //  "off"       — no progress tracking; hide Save/Complete/Resume UI everywhere
  progressTracking: "login" | "anonymous" | "off";
  // Ordered, toggleable home-page sections (incl. custom text blocks).
  homeSections: HomeSection[];
}

// The out-of-the-box home layout: new releases, featured, topics, collections.
export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: "new", kind: "new", enabled: true },
  { id: "featured", kind: "featured", enabled: true },
  { id: "editors", kind: "editorsNotes", enabled: true },
  { id: "blog", kind: "type", enabled: true, itemType: "blog", limit: 6 },
  { id: "topics", kind: "topics", enabled: true },
  { id: "collections", kind: "collections", enabled: true },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Mosaic Learn",
  tagline: "Five-minute ideas that explain the world.",
  heroSubtitle: "Short, clear lessons on history, economics, science, and civics — watch, read, and explore by topic or presenter.",
  heroImage: "",
  heroLayout: "gradient",
  heroOverlay: 45,
  heroSource: "auto",
  heroItemSlug: "",
  heroCtaLabel: "",
  heroCtaHref: "",
  heroCta2Label: "Become a member",
  heroCta2Href: "/membership",
  themeId: "classic",
  primaryColor: "#1d4ed8",
  accentColor: "#b45309",
  theme: "light",
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  headingFontId: "",
  bodyFontId: "",
  fontScale: 1,
  currency: "USD",
  footerText: "Mosaic Learn — a demo built on Mosaic.",
  footerColumns: [],
  footerSocial: [],
  logoImage: "",
  faviconImage: "",
  headerSticky: false,
  headerNavAlign: "right",
  headerCtaLabel: "Join",
  headerCtaHref: "/join",
  radius: "rounded",
  headerColor: "",
  heroColor: "",
  bandColor: "",
  footerColor: "",
  cardAspect: "video",
  cardShadow: "subtle",
  groupByType: false,
  showSidebar: false,
  aboutTitle: "About",
  aboutBody: "",
  affiliateTag: "",
  contactEnabled: false,
  contactHeading: "Get in touch",
  contactBlurb: "Have a question or want to work together? Send a message and we'll get back to you.",
  contactNotifyEmail: "",
  newsletterEnabled: false,
  newsletterHeading: "Subscribe to the newsletter",
  newsletterBlurb: "Get new posts and updates in your inbox. No spam, unsubscribe anytime.",
  newsletterAskName: false,
  bookingEnabled: false,
  bookingHeading: "Book a session",
  bookingBlurb: "Request a time that works for you and we'll confirm by email.",
  bookingMode: "request",
  bookingEmbedUrl: "",
  bookingNotifyEmail: "",
  customFields: [],
  seoDescription: "",
  ogImage: "",
  twitterHandle: "",
  seoIndexable: true,
  analyticsHead: "",
  commerceEnabled: false,
  lowStockThreshold: 5,
  trackInventory: false,
  notifyOnShip: false,
  autoFetchImage: true,
  homeCommentary: "hidden",
  commentaryExcerptChars: 160,
  progressTracking: "login",
  homeSections: DEFAULT_HOME_SECTIONS,
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
    headerBg: s.headerColor ? hexToRgbTriplet(s.headerColor) : (dark ? shade(s.primaryColor, 0.7) : shade(s.primaryColor, 0.45)),
    headerFg: "237 242 249",
    // hero gradient
    heroFrom: s.heroColor ? hexToRgbTriplet(s.heroColor) : hexToRgbTriplet(s.primaryColor),
    heroTo: s.heroColor ? darken(s.heroColor, 0.62) : darken(s.primaryColor, 0.62),
    // page background behind content
    pageBg: dark ? "9 13 25" : "248 250 252",
    // alternating "band" section (e.g. the CTA strip) — accent-tinted
    bandBg: s.bandColor ? hexToRgbTriplet(s.bandColor) : (dark ? shade(s.primaryColor, 0.55) : tint(s.accentColor, 0.9)),
    bandFg: dark ? "237 242 249" : "30 41 59",
    // a distinct primary-tinted band (e.g. "Browse by topic")
    topicBg: dark ? shade(s.primaryColor, 0.32) : tint(s.primaryColor, 0.9),
    topicFg: dark ? "237 242 249" : "30 41 59",
    // footer
    footerBg: s.footerColor ? hexToRgbTriplet(s.footerColor) : (dark ? "3 6 16" : shade(s.primaryColor, 0.42)),
    footerFg: "203 213 225",
  };
}
