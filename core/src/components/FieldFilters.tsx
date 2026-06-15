"use client";

import { useRouter } from "next/navigation";
import type { FieldDef } from "../lib/fields";

// Browse filters for filterable custom fields. Navigates with f_<key> query params,
// preserving the current type/topic params.
export default function FieldFilters({ fields, current }: { fields: FieldDef[]; current: Record<string, string> }) {
  const router = useRouter();
  if (fields.length === 0) return null;

  function apply(key: string, value: string) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) if (v && k !== `f_${key}`) p.set(k, v);
    if (value) p.set(`f_${key}`, value);
    router.push(`/?${p.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-slate-400">Filter:</span>
      {fields.map((f) => {
        const val = current[`f_${f.key}`] || "";
        const opts = f.type === "boolean" ? ["Yes", "No"] : (f.options || []);
        return (
          <select key={f.id} value={val} onChange={(e) => apply(f.key, e.target.value)}
            className={`rounded-full border px-3 py-1 text-sm ${val ? "border-brand bg-blue-50 text-brand" : "border-slate-300 text-slate-600"}`}>
            <option value="">{f.label}: any</option>
            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      })}
    </div>
  );
}
