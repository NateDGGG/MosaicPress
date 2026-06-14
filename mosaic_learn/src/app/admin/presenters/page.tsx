"use client";

import { useEffect, useState } from "react";

type Presenter = { id: string; slug: string; name: string; title?: string | null; photo?: string | null };

export default function AdminPresenters() {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/presenters");
    if (res.ok) setPresenters((await res.json()).presenters);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/presenters", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title, bio, photo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setName(""); setTitle(""); setBio(""); setPhoto("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally { setBusy(false); }
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Presenters</h1>
      <p className="mb-5 text-sm text-slate-500">Hosts you can assign to lessons. Each gets a public profile page.</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {presenters.map((p) => (
          <a key={p.id} href={`/presenters/${p.slug}`} className="rounded-lg border border-slate-200 bg-white p-3 text-center hover:border-brand">
            <div className="mx-auto mb-2 aspect-square w-16 overflow-hidden rounded-full bg-slate-100">
              {p.photo && <img src={p.photo} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="text-sm font-medium">{p.name}</div>
            {p.title && <div className="text-xs text-slate-400">{p.title}</div>}
          </a>
        ))}
        {presenters.length === 0 && <p className="col-span-full text-sm text-slate-400">No presenters yet.</p>}
      </div>

      <form onSubmit={create} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Add a presenter</h2>
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
          <input placeholder="Title (e.g. Historian)" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </div>
        <input placeholder="Photo URL" value={photo} onChange={(e) => setPhoto(e.target.value)} className={`${field} mt-3`} />
        <textarea placeholder="Short bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={`${field} mt-3`} />
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="mt-3 rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {busy ? "Adding…" : "Add presenter"}
        </button>
      </form>
    </div>
  );
}
