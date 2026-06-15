"use client";

import { useEffect, useState } from "react";

type Col = { id: string; slug: string; title: string; items: { item: { status: string } }[] };

export default function AdminCollections() {
  const [cols, setCols] = useState<Col[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/collections");
      const d = await res.json();
      setCols(d.collections || []);
    } catch { setError("Failed to load."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true); setError(null);
    const res = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
    setBusy(false);
    if (res.ok) { const d = await res.json(); window.location.href = `/admin/collections/${d.collection.id}`; }
    else setError((await res.json().catch(() => ({}))).error || "Failed.");
  }
  async function remove(id: string, label: string) {
    if (!confirm(`Delete the learning path "${label}"? (Items are not deleted.)`)) return;
    setBusy(true);
    await fetch(`/api/collections?id=${id}`, { method: "DELETE" });
    setBusy(false); load();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Learning paths</h1>
      <p className="mb-5 text-sm text-slate-500">
        Curated, ordered sequences of lessons. Each path gets a public page and powers the
        &ldquo;Up next&rdquo; suggestion learners see at the end of a lesson.
      </p>

      <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-3 py-2">Path</th><th className="px-3 py-2 w-24">Lessons</th><th className="px-3 py-2 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {cols.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <div className="font-medium">{c.title}</div>
                  <a href={`/collections/${c.slug}`} className="text-xs text-slate-400 hover:text-brand">/collections/{c.slug}</a>
                </td>
                <td className="px-3 py-2 text-slate-500">{c.items.filter((i) => i.item.status === "published").length}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <a href={`/admin/collections/${c.id}`} className="text-brand hover:underline">Edit</a>
                    <button onClick={() => remove(c.id, c.title)} disabled={busy} className="text-red-600 hover:underline disabled:opacity-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400">Loading…</td></tr>}
            {!loading && cols.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400">No learning paths yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={create} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">New learning path</h2>
        <div className="flex gap-2">
          <input required placeholder="e.g. Intro to U.S. Civics" value={title} onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <button type="submit" disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">
            {busy ? "…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
