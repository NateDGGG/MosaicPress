"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { NormalizedDraft } from "../../../lib/types";

export default function NewFromLink() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<NormalizedDraft | null>(null);
  const [detected, setDetected] = useState<string>("");

  async function fetchDraft(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDraft(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read that URL.");
      setDraft(data.draft);
      setDetected(data.draft?.type || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof NormalizedDraft>(key: K, value: NormalizedDraft[K]) {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      router.push(`/admin/items/${data.item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">New from link</h1>
      <p className="mb-5 text-sm text-slate-500">
        Paste any URL — a video, article, product, or page. We detect the type and pull its
        details, then you review before saving. It renders side-by-side with hosted content.
      </p>

      <form onSubmit={fetchDraft} className="flex gap-2">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Reading…" : "Fetch"}
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {draft && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <label className="text-slate-600">Type</label>
            <select
              value={draft.type}
              onChange={(e) => update("type", e.target.value as NormalizedDraft["type"])}
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm capitalize"
            >
              {(["article", "video", "product", "link"] as const).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              External · {draft.external.sourceName || draft.external.sourceDomain}
            </span>
            <span className="ml-auto text-xs text-slate-400">detected: {detected} · via {draft.external.adapter}</span>
          </div>

          {draft.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.coverImage} alt="" className="mb-4 aspect-video w-full rounded-lg object-cover" />
          )}

          <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
          <input
            value={draft.title}
            onChange={(e) => update("title", e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
          />

          <label className="mb-1 block text-xs font-medium text-slate-500">Summary</label>
          <textarea
            value={draft.summary || ""}
            onChange={(e) => update("summary", e.target.value)}
            rows={3}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
          />

          <p className="mb-4 truncate text-xs text-slate-400">{draft.external.url}</p>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save as draft"}
            </button>
            <button
              onClick={() => setDraft(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
