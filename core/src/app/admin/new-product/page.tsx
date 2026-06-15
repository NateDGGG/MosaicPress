"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FetchImageButton from "../../../components/FetchImageButton";

export default function NewProduct() {
  const router = useRouter();
  const [source, setSource] = useState<"hosted" | "external">("hosted");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [commentary, setCommentary] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [kind, setKind] = useState<"physical" | "digital">("physical");
  const [inventory, setInventory] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [buyUrl, setBuyUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const payload: any = {
      type: "product", source, title, summary, commentary, coverImage,
      priceCents: price ? Math.round(parseFloat(price) * 100) : null,
      currency,
    };
    if (source === "hosted") {
      payload.kind = kind;
      if (kind === "physical" && inventory) payload.inventory = parseInt(inventory);
      if (kind === "digital") payload.fileUrl = fileUrl;
    } else {
      payload.buyUrl = buyUrl;
    }
    try {
      const res = await fetch("/api/items", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create product.");
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
      <h1 className="mb-1 text-2xl font-bold">Add a product</h1>
      <p className="mb-5 text-sm text-slate-500">Sell your own product (checkout) or link to one elsewhere (affiliate-friendly).</p>

      <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex gap-2">
          {(["hosted", "external"] as const).map((sv) => (
            <button key={sv} type="button" onClick={() => setSource(sv)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${source === sv ? "border-brand bg-blue-50 text-brand" : "border-slate-300 text-slate-600"}`}>
              {sv === "hosted" ? "We sell it (checkout)" : "Link to a store (affiliate)"}
            </button>
          ))}
        </div>

        <label className={label}>Title</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} mb-3`} />

        <label className={label}>Short description</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={`${field} mb-3`} />

        <label className={label}>Your commentary (optional — markdown; shown as &ldquo;From the editor&rdquo;)</label>
        <textarea value={commentary} onChange={(e) => setCommentary(e.target.value)} rows={3} className={`${field} mb-3 font-mono text-sm`} placeholder="Why you recommend it…" />

        <label className={label}>Cover image</label>
        <div className="mb-3 flex items-center gap-2">
          <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="/uploads/… or https://…" className={field} />
          <label className="cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            {uploading ? "…" : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          </label>
          {source === "external" && <FetchImageButton url={buyUrl} onImage={setCoverImage} currentImage={coverImage} />}
        </div>
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" className="mb-3 aspect-video w-full rounded-lg object-cover" />
        )}

        <div className="mb-3 grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={label}>Price</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="19.00" className={field} />
          </div>
          <div>
            <label className={label}>Currency</label>
            <input value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className={field} />
          </div>
        </div>

        {source === "hosted" ? (
          <>
            <label className={label}>Kind</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as any)} className={`${field} mb-3`}>
              <option value="physical">Physical</option>
              <option value="digital">Digital download</option>
            </select>
            {kind === "physical" && (
              <>
                <label className={label}>Inventory (optional)</label>
                <input type="number" value={inventory} onChange={(e) => setInventory(e.target.value)} className={`${field} mb-3`} />
              </>
            )}
            {kind === "digital" && (
              <>
                <label className={label}>Download file URL</label>
                <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="/uploads/file.pdf" className={`${field} mb-3`} />
              </>
            )}
          </>
        ) : (
          <>
            <label className={label}>Buy / affiliate URL</label>
            <input required type="url" value={buyUrl} onChange={(e) => setBuyUrl(e.target.value)} placeholder="https://www.amazon.com/dp/…?tag=youraffiliate-20" className={`${field} mb-1`} />
            <p className="mb-3 text-xs text-slate-400">Paste your affiliate link, or set an Amazon tag in Settings to auto-append it.</p>
          </>
        )}

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={saving}
          className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {saving ? "Creating…" : "Create product"}
        </button>
      </form>
    </div>
  );
}
