export type FieldType = "text" | "textarea" | "number" | "date" | "url" | "boolean" | "select";

export interface FieldDef {
  id: string;
  key: string;          // stable storage key (slug of label)
  label: string;
  type: FieldType;
  options?: string[];   // for type "select"
  unit?: string;        // e.g. "min", "kg", "$" — shown after number values
  appliesTo?: string;   // "" = all types, else an item type (article|blog|video|product|link|book)
  filterable?: boolean; // expose as a browse filter (select/boolean only)
  schemaProp?: string;  // optional schema.org property name for JSON-LD (e.g. "prepTime")
}

export function fieldKey(label: string): string {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "field";
}

// Fields that apply to a given item type (global fields + type-scoped).
export function applicableFields(defs: FieldDef[] | undefined, itemType: string): FieldDef[] {
  return (defs || []).filter((f) => !f.appliesTo || f.appliesTo === itemType);
}

export function parseAttributes(json?: string | null): Record<string, unknown> {
  if (!json) return {};
  try { const o = JSON.parse(json); return o && typeof o === "object" ? (o as Record<string, unknown>) : {}; }
  catch { return {}; }
}

// Plain-text rendering of a value (for search indexing / fallbacks).
export function attributesText(defs: FieldDef[] | undefined, json?: string | null): string {
  const attrs = parseAttributes(json);
  return Object.values(attrs).map((v) => (Array.isArray(v) ? v.join(" ") : String(v ?? ""))).join(" ");
}

// Fields usable as browse filters (discrete values only).
export function filterableFields(defs: FieldDef[] | undefined, itemType: string): FieldDef[] {
  return applicableFields(defs, itemType).filter((f) => f.filterable && (f.type === "select" || f.type === "boolean"));
}
