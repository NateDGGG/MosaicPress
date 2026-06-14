"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ImportBook() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>(null);

  async function fetchBook(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setDraft(null); setLoading(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not import that book.");
      setDraft(data.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookDraft: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      router.push(`/admin/items/${data.item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setSaving(false);
    }
  }

  const b = draft?.book;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Import a book</h1>
      <p className="mb-5 text-sm text-slate-500">
        Paste a book link (Amazon, Open Library, Goodreads, Google Books, or a publisher page).
        We pull the cover, author, details, and an about blurb. Non-book links are rejected.
      </p>

      <form onSubmit={fetchBook} className="flex gap-2">
        <input
          type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.amazon.com/dp/0743273567"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        <button type="submit" disabled={loading}
          className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {loading ? "Importing…" : "Import"}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">⚠ {error}</p>
      )}

      {draft && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex gap-5">
            {draft.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.coverImage} alt="" className="h-44 w-auto rounded-lg object-contain shadow" />
            )}
            <div className="min-w-0">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Book</div>
              <h2 className="text-lg font-bold leading-snug">{draft.title}</h2>
              {b?.authors?.length > 0 && <p className="text-slate-600">by {b.authors.join(", ")}</p>}
              <p className="mt-2 text-sm text-slate-500">
                {[b?.publishedYear, b?.pageCount ? `${b.pageCount} pages` : null, b?.publisher, b?.isbn ? `ISBN ${b.isbn}` : null]
                  .filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          {b?.description && (
            <p className="mt-4 line-clamp-5 text-sm text-slate-600">{b.description}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={save} disabled={saving}
              className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
              {saving ? "Saving…" : "Save as draft"}
            </button>
            <button onClick={() => setDraft(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50">
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
