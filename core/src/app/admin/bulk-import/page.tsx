"use client";

import Link from "next/link";
import { useState } from "react";

type Result = { url: string; ok: boolean; type?: string; title?: string; id?: string; error?: string };

const TYPE_COLOR: Record<string, string> = {
  article: "bg-blue-100 text-blue-700",
  blog: "bg-indigo-100 text-indigo-700",
  video: "bg-rose-100 text-rose-700",
  product: "bg-purple-100 text-purple-700",
  link: "bg-cyan-100 text-cyan-700",
  book: "bg-amber-100 text-amber-800",
};

export default function BulkImport() {
  const [text, setText] = useState("");
  const [forceType, setForceType] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setResults(null);
    try {
      const res = await fetch("/api/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, forceType: forceType === "auto" ? undefined : forceType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed.");
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  const ok = results?.filter((r) => r.ok).length ?? 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Bulk import</h1>
      <p className="mb-5 text-sm text-slate-500">
        Paste a list of URLs (one per line). Each is classified — article, video, product,
        link, or book — and added as a draft. Up to 50 at a time.
      </p>

      <form onSubmit={run}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={"https://www.youtube.com/watch?v=…\nhttps://en.wikipedia.org/wiki/…\nhttps://www.amazon.com/dp/0743273567"}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-sm text-slate-600">Treat each URL as</label>
          <select value={forceType} onChange={(e) => setForceType(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="auto">Auto-detect (recommended)</option>
            <option value="link">Link</option>
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="product">Product</option>
          </select>
          <button type="submit" disabled={busy}
            className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
            {busy ? "Importing…" : "Import all"}
          </button>
        </div>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {results && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-slate-500">{ok} of {results.length} imported as drafts.</p>
          <ul className="space-y-2">
            {results.map((r, i) => (
              <li key={i} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                {r.ok ? (
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[r.type || ""] || "bg-slate-100"}`}>{r.type}</span>
                    {r.id ? <Link href={`/admin/items/${r.id}`} className="font-medium hover:text-brand">{r.title}</Link> : <span className="font-medium">{r.title}</span>}
                  </div>
                ) : (
                  <div className="text-red-700">✗ {r.error}</div>
                )}
                <div className="mt-1 truncate text-xs text-slate-400">{r.url}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
