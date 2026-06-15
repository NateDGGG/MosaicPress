"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Meta = { id: string; slug: string; title: string; description: string; coverImage: string };
type Row = { id: string; title: string; type: string; status: string };

export default function CollectionEditor({
  collection, items, available,
}: { collection: Meta; items: Row[]; available: Row[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(collection.title);
  const [description, setDescription] = useState(collection.description);
  const [coverImage, setCoverImage] = useState(collection.coverImage);
  const [order, setOrder] = useState<Row[]>(items);
  const [pool, setPool] = useState<Row[]>(available);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(body: any) {
    const res = await fetch("/api/collections", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: collection.id, ...body }),
    });
    return res.ok;
  }

  async function saveMeta() {
    setBusy(true); setMsg(null);
    const ok = await patch({ title, description, coverImage });
    setBusy(false); setMsg(ok ? "Saved." : "Failed."); if (ok) router.refresh();
  }
  function move(i: number, dir: -1 | 1) {
    const a = [...order]; const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; setOrder(a);
  }
  async function saveOrder() {
    setBusy(true); setMsg(null);
    const ok = await patch({ order: order.map((r) => r.id) });
    setBusy(false); setMsg(ok ? "Order saved." : "Failed."); if (ok) router.refresh();
  }
  async function addItem() {
    if (!pick) return;
    const row = pool.find((p) => p.id === pick);
    if (!row) return;
    setBusy(true);
    const ok = await patch({ addItemId: pick });
    setBusy(false);
    if (ok) { setOrder((o) => [...o, row]); setPool((p) => p.filter((x) => x.id !== pick)); setPick(""); }
  }
  async function removeItem(id: string) {
    setBusy(true);
    const ok = await patch({ removeItemId: id });
    setBusy(false);
    if (ok) {
      const row = order.find((r) => r.id === id);
      setOrder((o) => o.filter((r) => r.id !== id));
      if (row) setPool((p) => [...p, row].sort((a, b) => a.title.localeCompare(b.title)));
    }
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none";
  const label = "mb-1 block text-xs font-medium text-slate-500";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/collections" className="text-sm text-slate-400 hover:text-brand">← All learning paths</Link>
      <h1 className="my-2 text-2xl font-bold">{collection.title}</h1>
      <a href={`/collections/${collection.slug}`} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-brand">View public page /collections/{collection.slug} ↗</a>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Details</h2>
        <label className={label}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} mb-3`} />
        <label className={label}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${field} mb-3`}
          placeholder="What will a learner get from this path?" />
        <label className={label}>Cover image URL (optional)</label>
        <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="/uploads/… or https://…" className={`${field} mb-3`} />
        <div className="flex items-center gap-3">
          <button onClick={saveMeta} disabled={busy} className="rounded-lg bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
            {busy ? "Saving…" : "Save"}
          </button>
          {msg && <span className="text-sm text-green-600">{msg}</span>}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Lessons in this path</h2>
        <p className="mb-3 text-xs text-slate-500">Order is the sequence learners follow. Use the arrows, then Save order.</p>
        <div className="space-y-2">
          {order.map((r, i) => (
            <div key={r.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
              <span className="w-6 text-center text-xs text-slate-400">{i + 1}</span>
              <span className="flex-1 truncate text-sm">{r.title}
                {r.status !== "published" && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{r.status}</span>}
              </span>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="grid h-8 w-8 place-items-center rounded border border-slate-200 text-xs disabled:opacity-30">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="grid h-8 w-8 place-items-center rounded border border-slate-200 text-xs disabled:opacity-30">↓</button>
              <button onClick={() => removeItem(r.id)} className="text-xs text-red-600 hover:underline">Remove</button>
            </div>
          ))}
          {order.length === 0 && <p className="text-sm text-slate-400">No lessons yet — add some below.</p>}
        </div>
        {order.length > 0 && (
          <button onClick={saveOrder} disabled={busy} className="mt-4 rounded-lg bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
            {busy ? "Saving…" : "Save order"}
          </button>
        )}

        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
          <select value={pick} onChange={(e) => setPick(e.target.value)} className={`${field} max-w-sm`}>
            <option value="">Add a lesson…</option>
            {pool.map((p) => <option key={p.id} value={p.id}>{p.title}{p.status !== "published" ? ` (${p.status})` : ""}</option>)}
          </select>
          <button onClick={addItem} disabled={busy || !pick} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">Add</button>
        </div>
      </section>
    </div>
  );
}
