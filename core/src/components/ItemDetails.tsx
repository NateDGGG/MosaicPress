import { applicableFields, parseAttributes, type FieldDef } from "../lib/fields";

export default function ItemDetails({ defs, attributes, itemType, title }: {
  defs: FieldDef[]; attributes?: string | null; itemType: string; title?: string;
}) {
  const fields = applicableFields(defs, itemType);
  const attrs = parseAttributes(attributes);
  const rows = fields
    .map((f) => ({ f, v: attrs[f.key] }))
    .filter(({ v }) => v !== undefined && v !== null && v !== "");
  if (rows.length === 0) return null;

  return (
    <section className="my-6 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title || "Details"}</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map(({ f, v }) => (
          <div key={f.id} className="flex justify-between gap-3 border-b border-slate-100 py-1 last:border-0">
            <dt className="text-sm text-slate-500">{f.label}</dt>
            <dd className="text-right text-sm font-medium text-slate-800">{renderValue(f, v)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function renderValue(f: FieldDef, v: unknown): React.ReactNode {
  if (f.type === "boolean") return v ? "Yes" : "No";
  if (f.type === "url" && typeof v === "string") {
    return <a href={v} target="_blank" rel="noopener noreferrer nofollow" className="text-brand hover:underline">{prettyUrl(v)} ↗</a>;
  }
  if (f.type === "date" && typeof v === "string") {
    const d = new Date(v); return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }
  if (f.type === "number") return `${v}${f.unit ? ` ${f.unit}` : ""}`;
  return String(v);
}
function prettyUrl(u: string): string { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } }
