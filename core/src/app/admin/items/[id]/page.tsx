"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BlockEditor from "../../../../components/BlockEditor";
import BlogBodyEditor from "../../../../components/BlogBodyEditor";

export default function EditItem({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [presenters, setPresenters] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/items/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.item) {
          setItem(d.item);
          setTagIds((d.item.tags || []).map((t: any) => t.tagId));
        } else setError(d.error || "Not found.");
      })
      .catch(() => setError("Failed to load."));
    fetch("/api/presenters").then((r) => r.json()).then((d) => setPresenters(d.presenters || []));
    fetch("/api/tags").then((r) => r.json()).then((d) => setAllTags(d.tags || []));
  }, [params.id]);

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function set(key: string, value: any) {
    setItem((prev: any) => ({ ...prev, [key]: value }));
  }
  function setPM(key: string, value: any) {
    setItem((prev: any) => ({ ...prev, productMeta: { ...(prev.productMeta || {}), [key]: value } }));
  }
  function setLM(key: string, value: any) {
    setItem((prev: any) => ({ ...prev, linkMeta: { ...(prev.linkMeta || {}), [key]: value } }));
  }

  async function save(extra?: Record<string, any>) {
    setSaving(true);
    setError(null);
    const payload: any = {
      title: item.title,
      summary: item.summary,
      author: item.author,
      coverImage: item.coverImage,
      featured: item.featured,
      access: item.access,
      seoTitle: item.seoTitle,
      seoDesc: item.seoDesc,
      presenterId: item.presenterId || "",
      tagIds,
      ...extra,
    };
    if (item.type === "article" && item.source === "hosted") payload.body = item.body;
    if (item.type === "link") {
      payload.linkMeta = { url: item.linkMeta?.url || "", note: item.linkMeta?.note || null };
      payload.publishedAt = item.publishedAt || null;
    }
    if (item.type === "product" && item.productMeta) {
      const pm = item.productMeta;
      payload.productMeta = {
        priceCents: pm.priceCents === "" || pm.priceCents == null ? null : Math.round(Number(pm.priceCents)),
        currency: pm.currency || "USD",
        kind: pm.kind || "physical",
        inventory: pm.inventory === "" || pm.inventory == null ? null : Number(pm.inventory),
        fileUrl: pm.fileUrl || null,
        buyUrl: pm.buyUrl || null,
      };
    }
    try {
      const res = await fetch(`/api/items/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setItem(data.item);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>;
  if (!item) return <p className="text-slate-500">Loading…</p>;

  const isPublished = item.status === "published";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/admin" className="text-sm text-slate-400 hover:text-brand">← All content</Link>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
          {item.type}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {item.source === "hosted" ? "Hosted" : `External · ${item.external?.sourceName}`}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          {item.status}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
        <input
          value={item.title || ""}
          onChange={(e) => set("title", e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        />

        <label className="mb-1 block text-xs font-medium text-slate-500">Summary</label>
        <textarea
          value={item.summary || ""}
          onChange={(e) => set("summary", e.target.value)}
          rows={3}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        />

        <label className="mb-1 block text-xs font-medium text-slate-500">Author (fallback if no presenter)</label>
        <input
          value={item.author || ""}
          onChange={(e) => set("author", e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        />

        <label className="mb-1 block text-xs font-medium text-slate-500">Presenter</label>
        <select
          value={item.presenterId || ""}
          onChange={(e) => set("presenterId", e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        >
          <option value="">— none —</option>
          {presenters.map((p) => (
            <option key={p.id} value={p.id}>{p.name}{p.title ? ` (${p.title})` : ""}</option>
          ))}
        </select>

        <label className="mb-1 block text-xs font-medium text-slate-500">Topics</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {allTags.length === 0 && <span className="text-sm text-slate-400">No topics yet — add some under Admin → Topics.</span>}
          {allTags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTag(t.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                tagIds.includes(t.id) ? "border-brand bg-blue-50 text-brand" : "border-slate-300 text-slate-600"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs font-medium text-slate-500">Cover image</label>
        <div className="mb-3">
          {item.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.coverImage} alt="" className="mb-2 aspect-video w-full rounded-lg object-cover" />
          )}
          <div className="flex items-center gap-2">
            <input
              value={item.coverImage || ""}
              onChange={(e) => set("coverImage", e.target.value)}
              placeholder="/uploads/… or https://…"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              {uploading ? "…" : "Upload"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploading(true);
                  const fd = new FormData();
                  fd.append("file", f);
                  const res = await fetch("/api/media", { method: "POST", body: fd });
                  setUploading(false);
                  if (res.ok) set("coverImage", (await res.json()).media.url);
                }}
              />
            </label>
          </div>
        </div>

        {item.type === "article" && item.source === "hosted" && (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-slate-500">Body</label>
            <BlockEditor value={item.body} onChange={(json) => set("body", json)} />
          </div>
        )}

        {item.type === "blog" && (() => {
          let blog = { format: "markdown", content: item.body || "" };
          try { const o = JSON.parse(item.body || ""); if (o && typeof o.content === "string") blog = { format: o.format === "html" ? "html" : "markdown", content: o.content }; } catch {}
          const setBlog = (next: { format?: string; content?: string }) =>
            set("body", JSON.stringify({ format: next.format ?? blog.format, content: next.content ?? blog.content }));
          return (
            <div className="mb-3">
              <BlogBodyEditor
                format={blog.format}
                content={blog.content}
                onChange={(f, c) => set("body", JSON.stringify({ format: f, content: c }))}
              />
            </div>
          );
        })()}

        <div className="mb-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={!!item.featured} onChange={(e) => set("featured", e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Access:
            <select value={item.access || "public"} onChange={(e) => set("access", e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1">
              <option value="public">Public</option>
              <option value="members">Members only</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Level:
            <select value={item.level || ""} onChange={(e) => set("level", e.target.value || null)}
              className="rounded-lg border border-slate-300 px-2 py-1">
              <option value="">—</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
        </div>

        {item.source === "external" && item.external?.url && (
          <p className="mb-3 truncate text-xs text-slate-400">Source: {item.external.url}</p>
        )}

        {item.type === "link" && (
          <div className="mb-4 rounded-lg border border-slate-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Link</div>
            <label className="mb-1 block text-xs font-medium text-slate-500">URL</label>
            <input value={item.linkMeta?.url || ""} onChange={(e) => setLM("url", e.target.value)}
              placeholder="https://…" className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none" />
            <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
            <input type="date"
              value={item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 10) : ""}
              onChange={(e) => set("publishedAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="w-48 rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none" />
            <p className="mt-1 text-xs text-slate-400">Commentary is the Summary field above.</p>
          </div>
        )}

        {item.type === "product" && (
          <div className="mb-4 rounded-lg border border-slate-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Product ({item.source === "hosted" ? "we sell it" : "external / affiliate"})
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Price ({item.productMeta?.currency || "USD"} cents)</label>
                <input type="number" value={item.productMeta?.priceCents ?? ""} onChange={(e) => setPM("priceCents", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Currency</label>
                <input value={item.productMeta?.currency || "USD"} maxLength={3} onChange={(e) => setPM("currency", e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              </div>
            </div>
            {item.source === "hosted" ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Kind</label>
                  <select value={item.productMeta?.kind || "physical"} onChange={(e) => setPM("kind", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="physical">Physical</option>
                    <option value="digital">Digital download</option>
                  </select>
                </div>
                {item.productMeta?.kind === "digital" ? (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Download file URL</label>
                    <input value={item.productMeta?.fileUrl || ""} onChange={(e) => setPM("fileUrl", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Inventory</label>
                    <input type="number" value={item.productMeta?.inventory ?? ""} onChange={(e) => setPM("inventory", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-500">Buy / affiliate URL</label>
                <input value={item.productMeta?.buyUrl || ""} onChange={(e) => setPM("buyUrl", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              </div>
            )}
          </div>
        )}

        {item.status === "scheduled" && item.publishedAt && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Scheduled to publish {new Date(item.publishedAt).toLocaleString()}
          </p>
        )}

        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Schedule publish for</label>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => scheduleAt && save({ status: "scheduled", publishedAt: new Date(scheduleAt).toISOString() })}
            disabled={saving || !scheduleAt}
            className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            Schedule
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => save()}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {isPublished ? (
            <button
              onClick={() => save({ status: "draft" })}
              disabled={saving}
              className="rounded-lg border border-amber-300 px-4 py-2 font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              Unpublish
            </button>
          ) : (
            <button
              onClick={() => save({ status: "published" })}
              disabled={saving}
              className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              Save &amp; publish
            </button>
          )}
          <Link href={`/i/${item.slug}`} className="text-sm text-brand hover:underline">
            Preview →
          </Link>
          {savedAt && <span className="text-xs text-slate-400">Saved {savedAt}</span>}
        </div>
      </div>
    </div>
  );
}
