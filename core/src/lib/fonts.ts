// Curated font catalog (prisma-free so it's safe in client + server bundles).
// Some options are system-safe; others load on demand from Google Fonts only
// when selected (see fontGoogleHref).

export interface FontOption { id: string; label: string; stack: string; google?: string }

export const FONTS: FontOption[] = [
  { id: "system", label: "System sans", stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: "georgia", label: "Georgia (serif)", stack: 'Georgia, "Times New Roman", serif' },
  { id: "inter", label: "Inter", stack: '"Inter", system-ui, sans-serif', google: "Inter:wght@400;600;700" },
  { id: "source-sans", label: "Source Sans 3", stack: '"Source Sans 3", system-ui, sans-serif', google: "Source+Sans+3:wght@400;600;700" },
  { id: "poppins", label: "Poppins (geometric)", stack: '"Poppins", system-ui, sans-serif', google: "Poppins:wght@400;600;700" },
  { id: "merriweather", label: "Merriweather (serif)", stack: '"Merriweather", Georgia, serif', google: "Merriweather:wght@400;700" },
  { id: "lora", label: "Lora (serif)", stack: '"Lora", Georgia, serif', google: "Lora:wght@400;600;700" },
  { id: "playfair", label: "Playfair Display (display)", stack: '"Playfair Display", Georgia, serif', google: "Playfair+Display:wght@500;700" },
];

export function fontStack(id?: string | null): string {
  return (id && FONTS.find((f) => f.id === id)?.stack) || "";
}

export function fontGoogleHref(ids: Array<string | undefined | null>): string | null {
  const fams = Array.from(
    new Set(ids.map((id) => FONTS.find((f) => f.id === id)?.google).filter(Boolean) as string[])
  );
  if (!fams.length) return null;
  return `https://fonts.googleapis.com/css2?${fams.map((f) => "family=" + f).join("&")}&display=swap`;
}
