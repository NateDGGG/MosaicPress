"use client";
import { useEffect, useState } from "react";

type T = { id: string; name: string; role: string | null; quote: string; rating: number | null; featured: boolean };

export default function AdminTestimonials() {
  const [items, setItems] = useState<T[]>([]);
  const [f, setF] = useState({ name: "", role: "", quote: "", rating: "", avatar: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const d = await (await fetch("/api/testimonials")).json();
    setItems(d.testimonials || []);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.quote.trim()) return;
    setBusy(true); setErr(null);
    const res = await fetch("/api/testimonials", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, rating: f.rating ? parseInt(f.rating) : null }) });
    setBusy(false);
    if (res.ok) { setF({ name: "", role: "", quote: "", rating: "", avatar: "" }); load(); }
    else setErr((await res.json().catch(() => ({}))).error || "Failed.");
  }
  async function toggleFeatured(t: T) {
    await fetch("/api/testimonials", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, featured: !t.featured }) });
    load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    await fetch(`/api/testimonials?id=${id}`, { method: "DELETE" }); load();
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none";
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Testimonials</h1>
      <p className="mb-5 text-sm text-slate-500">Add a &ldquo;Testimonials&rdquo; section under Settings → Home page to show featured ones.</p>

      <div className="mb-5 space-y-2">
        {items.map((t) => (
          <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{t.name}</span>
              {t.role && <span className="text-sm text-slate-500">· {t.role}</span>}
              {t.rating ? <span className="text-xs text-amber-500">{"★".repeat(t.rating)}</span> : null}
              <label className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                <input type="checkbox" checked={t.featured} onChange={() => toggleFeatured(t)} /> Featured
              </label>
              <button onClick={() => remove(t.id)} className="text-xs text-red-600 hover:underline">Delete</button>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">&ldquo;{t.quote}&rdquo;</p>
          </div>
        ))}
        {items.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">No testimonials yet.</p>}
      </div>

      <form onSubmit={add} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Add a testimonial</h2>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <input required placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} />
          <input placeholder="Role / company (optional)" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className={field} />
        </div>
        <textarea required placeholder="Quote" value={f.quote} onChange={(e) => setF({ ...f, quote: e.target.value })} rows={3} className={`${field} mb-3`} />
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <input placeholder="Avatar URL (optional)" value={f.avatar} onChange={(e) => setF({ ...f, avatar: e.target.value })} className={field} />
          <select value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })} className={field}>
            <option value="">No rating</option>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} stars</option>)}
          </select>
        </div>
        {err && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">{busy ? "…" : "Add"}</button>
      </form>
    </div>
  );
}
