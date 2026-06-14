"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ITEM_TYPES, type ItemType } from "../../../lib/types";

export default function NewHostedItem() {
  const router = useRouter();
  const [type, setType] = useState<ItemType>("article");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [playerUrl, setPlayerUrl] = useState("");
  const [priceCents, setPriceCents] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: any = { type, title, summary };
    if (type === "article") payload.body = JSON.stringify([{ type: "paragraph", text: body }]);
    if (type === "video") payload.playerUrl = playerUrl;
    if (type === "product") payload.priceCents = priceCents ? Math.round(parseFloat(priceCents) * 100) : null;
    if (type === "link") payload.url = url;
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create.");
      router.push(`/admin/items/${data.item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">New hosted item</h1>
      <p className="mb-5 text-sm text-slate-500">Create content that lives in Mosaic.</p>

      <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
        <div className="mb-4 flex gap-2">
          {ITEM_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize ${
                type === t ? "border-brand bg-blue-50 text-brand" : "border-slate-300 text-slate-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        />

        <label className="mb-1 block text-xs font-medium text-slate-500">Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        />

        {type === "article" && (
          <>
            <label className="mb-1 block text-xs font-medium text-slate-500">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
            />
          </>
        )}
        {type === "video" && (
          <>
            <label className="mb-1 block text-xs font-medium text-slate-500">Video file / player URL</label>
            <input
              value={playerUrl}
              onChange={(e) => setPlayerUrl(e.target.value)}
              placeholder="https://…/clip.mp4"
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
            />
          </>
        )}
        {type === "product" && (
          <>
            <label className="mb-1 block text-xs font-medium text-slate-500">Price (USD)</label>
            <input
              type="number"
              step="0.01"
              value={priceCents}
              onChange={(e) => setPriceCents(e.target.value)}
              placeholder="19.00"
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
            />
          </>
        )}
        {type === "link" && (
          <>
            <label className="mb-1 block text-xs font-medium text-slate-500">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
            />
          </>
        )}

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create draft"}
        </button>
      </form>
    </div>
  );
}
