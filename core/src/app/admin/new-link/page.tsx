"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FetchImageButton from "../../../components/FetchImageButton";

type Tag = { id: string; name: string };

export default function NewLink() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [commentary, setCommentary] = useState("");
  const [date, setDate] = useState(today);
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then((d) => setTags(d.tags || [])).catch(() => {});
  }, []);

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // Pull title, summary, and a preview image from the URL; fill only empty
  // fields so it never clobbers what you've already typed. The summary defaults
  // into the commentary box as a starting point you can edit.
  async function fetchDetails() {
    if (!url.trim()) { setError("Add a URL first."); return; }
    setFetching(true); setFetchMsg(""); setError(null);
    try {
      const res = await fetch("/api/link-preview", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Couldn't read that URL.");
      const p = d.preview || {};
      let filled = 0;
      if (p.title && !title.trim()) { setTitle(p.title); filled++; }
      if (p.description && !commentary.trim()) { setCommentary(p.description); filled++; }
      if (p.image && !coverImage.trim()) { setCoverImage(p.image); filled++; }
      setFetchMsg(filled ? "Filled in what we could find — edit as needed." : "Nothing new to fill (fields already set, or none found).");
    } catch (err) {
      setFetchMsg(err instanceof Error ? err.message : "Couldn't read that URL.");
    } finally {
      setFetching(false);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) setCoverImage((await res.json()).media.url);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) { setError("A URL is required."); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "link", source: "hosted",
          title, url, commentary, coverImage,
          publishedAt: date ? new Date(date).toISOString() : null,
          tagIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the link.");
      router.push(`/admin/items/${data.item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none";
  const label = "mb-1 block text-xs font-medium text-slate-500";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Share a link</h1>
      <p className="mb-5 text-sm text-slate-500">A pointer to anything on the web, with your own commentary, a topic, and a date.</p>

      <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-5">
        <label className={label}>Title</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} mb-3`} />

        <label className={label}>URL</label>
        <div className="flex gap-2">
          <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={field} />
          <button type="button" onClick={fetchDetails} disabled={fetching || !url}
            className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {fetching ? "Fetching…" : "Fetch details"}
          </button>
        </div>
        <p className="mb-3 mt-1 text-xs text-slate-500">
          {fetchMsg || "Paste a link, then “Fetch details” to auto-fill the title, a summary (into commentary), and a preview image."}
        </p>

        <label className={label}>Commentary</label>
        <textarea value={commentary} onChange={(e) => setCommentary(e.target.value)} rows={4}
          placeholder="Why this link matters, what to notice, your take…" className={`${field} mb-3`} />

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </div>
        </div>

        <label className={label}>Preview image (optional)</label>
        <div className="mb-3 flex items-center gap-2">
          <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="/uploads/… or https://…" className={field} />
          <label className="cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            {uploading ? "…" : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          </label>
          <FetchImageButton url={url} onImage={setCoverImage} currentImage={coverImage} />
        </div>
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" className="mb-3 aspect-video w-full rounded-lg object-cover" />
        )}

        <label className={label}>Topics</label>
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((t) => (
            <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
              className={`rounded-full border px-3 py-1 text-sm ${tagIds.includes(t.id) ? "border-brand bg-blue-50 text-brand" : "border-slate-300 text-slate-600 hover:border-brand"}`}>
              {t.name}
            </button>
          ))}
          {tags.length === 0 && <span className="text-sm text-slate-400">No topics yet — add some under Topics.</span>}
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={saving} className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
          {saving ? "Saving…" : "Save link"}
        </button>
        <p className="mt-2 text-xs text-slate-400">Saved as a draft — review and publish it on the next screen.</p>
      </form>
    </div>
  );
}
