"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AdminItemRow from "./AdminItemRow";

type Row = { id: string; slug: string; title: string; type: string; source: string; status: string; sourceName?: string | null };
type Tag = { id: string; name: string };

export default function AdminItemTable({ items, tags }: { items: Row[]; tags: Tag[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [tagId, setTagId] = useState("");

  const allSelected = items.length > 0 && sel.size === items.length;
  const ids = useMemo(() => [...sel], [sel]);

  function toggle(id: string) {
    setSel((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSel(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  }

  async function run(action: string, extra?: Record<string, unknown>) {
    if (ids.length === 0) return;
    if (action === "delete" && !confirm(`Delete ${ids.length} item${ids.length > 1 ? "s" : ""}? This can't be undone.`)) return;
    if ((action === "addTag" || action === "removeTag") && !tagId) return;
    setBusy(true);
    await fetch("/api/items/bulk", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action, ...extra }),
    });
    setBusy(false);
    setSel(new Set());
    router.refresh();
  }

  const barBtn = "rounded-md border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-50";

  return (
    <div>
      {sel.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-blue-50/60 px-4 py-2">
          <span className="text-sm font-medium text-slate-700">{sel.size} selected</span>
          <span className="mx-1 text-slate-300">|</span>
          <button disabled={busy} onClick={() => run("publish")} className={barBtn}>Publish</button>
          <button disabled={busy} onClick={() => run("unpublish")} className={barBtn}>Unpublish</button>
          <button disabled={busy} onClick={() => run("feature")} className={barBtn}>Feature</button>
          <button disabled={busy} onClick={() => run("unfeature")} className={barBtn}>Unfeature</button>
          <span className="mx-1 text-slate-300">|</span>
          <select value={tagId} onChange={(e) => setTagId(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
            <option value="">Choose topic…</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button disabled={busy || !tagId} onClick={() => run("addTag", { tagId })} className={barBtn}>Add topic</button>
          <button disabled={busy || !tagId} onClick={() => run("removeTag", { tagId })} className={barBtn}>Remove topic</button>
          <span className="mx-1 text-slate-300">|</span>
          <button disabled={busy} onClick={() => run("delete")} className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">Delete</button>
          <button disabled={busy} onClick={() => setSel(new Set())} className="ml-auto text-xs text-slate-500 hover:underline">Clear</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 w-8"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <AdminItemRow key={item.id} item={item} selected={sel.has(item.id)} onToggle={toggle} />
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">No content yet. Use &ldquo;New&rdquo; or &ldquo;New from link&rdquo;.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
