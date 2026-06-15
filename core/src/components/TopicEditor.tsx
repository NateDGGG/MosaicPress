"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Tag = { id: string; name: string; slug: string; intro: string; sortMode: string };
type Row = { id: string; title: string; type: string; status: string };

export default function TopicEditor({ tag, items }: { tag: Tag; items: Row[] }) {
  const router = useRouter();
  const [intro, setIntro] = useState(tag.intro);
  const [sortMode, setSortMode] = useState(tag.sortMode);
  const [order, setOrder] = useState<Row[]>(items);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(body: any) {
    const res = await fetch("/api/tags", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: tag.id, ...body }),
    });
    return res.ok;
  }

  async function saveMeta() {
    setBusy(true); setMsg(null);
    const ok = await patch({ intro, sortMode });
    setBusy(false);
    setMsg(ok ? "Saved." : "Failed to save.");
    if (ok) router.refresh();
  }

  function move(i: number, dir: -1 | 1) {
    const a = [...order]; const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; setOrder(a);
  }

  async function saveOrder() {
    setBusy(true); setMsg(null);
    const ok = await patch({ order: order.map((r) => r.id) });
    setBusy(false);
    setMsg(ok ? "Order saved." : "Failed to save order.");
    if (ok) router.refresh();
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none";
  const label = "mb-1 block text-xs font-medium text-slate-500";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/topics" className="text-sm text-slate-400 hover:text-brand">← All topics</Link>
      <h1 className="my-2 text-2xl font-bold">{tag.name}</h1>
      <a href={`/topics/${tag.slug}`} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-brand">View public page /topics/{tag.slug} ↗</a>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Topic page</h2>
        <label className={label}>Intro (shown under the title)</label>
        <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} className={`${field} mb-3`}
          placeholder="A short orientation to this topic for learners…" />
        <label className={label}>Order lessons by</label>
        <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className={`${field} max-w-xs`}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="manual">Manual (set the order below)</option>
        </select>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={saveMeta} disabled={busy}
            className="rounded-lg bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
            {busy ? "Saving…" : "Save"}
          </button>
          {msg && <span className="text-sm text-green-600">{msg}</span>}
        </div>
      </section>

      {sortMode === "manual" && (
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-1 font-semibold">Lesson order</h2>
          <p className="mb-3 text-xs text-slate-500">Drag isn&rsquo;t needed — use the arrows, then Save order.</p>
          <div className="space-y-2">
            {order.map((r, i) => (
              <div key={r.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                <span className="w-6 text-center text-xs text-slate-400">{i + 1}</span>
                <span className="flex-1 truncate text-sm">{r.title}
                  {r.status !== "published" && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{r.status}</span>}
                </span>
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="grid h-8 w-8 place-items-center rounded border border-slate-200 text-xs disabled:opacity-30">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === order.length - 1}
                  className="grid h-8 w-8 place-items-center rounded border border-slate-200 text-xs disabled:opacity-30">↓</button>
              </div>
            ))}
            {order.length === 0 && <p className="text-sm text-slate-400">No lessons in this topic yet.</p>}
          </div>
          {order.length > 0 && (
            <button onClick={saveOrder} disabled={busy}
              className="mt-4 rounded-lg bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
              {busy ? "Saving…" : "Save order"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
