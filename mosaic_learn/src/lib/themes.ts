// Multi-theme packages. Each theme bundles design tokens (mode + colors +
// typography). Selecting one in Settings bulk-applies its tokens; owners can
// still fine-tune individual colors afterward.

export interface ThemePackage {
  id: string;
  name: string;
  description: string;
  mode: "light" | "dark";
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
}

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SERIF = 'Georgia, Cambria, "Times New Roman", serif';
const ROUNDED = '"Nunito", "Segoe UI", system-ui, sans-serif';

export const THEMES: ThemePackage[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean, blue, neutral. The default.",
    mode: "light",
    primaryColor: "#1d4ed8",
    accentColor: "#0f766e",
    fontFamily: SANS,
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Serif typography, near-black, warm accent.",
    mode: "light",
    primaryColor: "#111827",
    accentColor: "#b45309",
    fontFamily: SERIF,
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark mode with electric indigo and cyan.",
    mode: "dark",
    primaryColor: "#6366f1",
    accentColor: "#22d3ee",
    fontFamily: SANS,
  },
  {
    id: "sunrise",
    name: "Sunrise",
    description: "Warm, friendly, rounded.",
    mode: "light",
    primaryColor: "#ea580c",
    accentColor: "#db2777",
    fontFamily: ROUNDED,
  },
];

export const DEFAULT_THEME_ID = "classic";

export function getTheme(id?: string | null): ThemePackage {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
