"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BlogBodyEditor from "../../../components/BlogBodyEditor";

type Tag = { id: string; name: string };

export default function NewBlog() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [commentary, setCommentary] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [format, setFormat] = useState<"markdown" | "html">("markdown");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then((d) => setTags(d.tags || [])).catch(() => {});
  }, []);

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "blog", source: "hosted", title, summary, commentary, coverImage,
          body: JSON.stringify({ format, content }),
          tagIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the post.");
      router.push(`/admin/items/${data.item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none";
  const label = "mb-1 block text-xs font-medium text-slate-500";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold">Write a blog post</h1>
      <p className="mb-5 text-sm text-slate-500">Author your own article in Markdown or HTML. Add a cover image, a title, and topics.</p>

      <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-5">
        <label className={label}>Title</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} mb-3`} />

        <label className={label}>Short summary (optional)</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={`${field} mb-3`} />

        <label className={label}>Your commentary (optional — markdown; shown as &ldquo;From the editor&rdquo;)</label>
        <textarea value={commentary} onChange={(e) => setCommentary(e.target.value)} rows={3} className={`${field} mb-3 font-mono text-sm`} placeholder="Your take on this piece…" />

        <label className={label}>Cover image</label>
        <div className="mb-3 flex items-center gap-2">
          <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="/uploads/… or https://…" className={field} />
          <label className="cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            {uploading ? "…" : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          </label>
        </div>
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" className="mb-3 aspect-video w-full rounded-lg object-cover" />
        )}

        <div className="mb-3">
          <BlogBodyEditor format={format} content={content} onChange={(f, c) => { setFormat(f as "markdown" | "html"); setContent(c); }} />
        </div>

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
          {saving ? "Saving…" : "Create post"}
        </button>
        <p className="mt-2 text-xs text-slate-400">Saved as a draft — review and publish it on the next screen.</p>
      </form>
    </div>
  );
}
