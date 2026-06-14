"use client";

import { useEffect, useRef, useState } from "react";

type MediaItem = { id: string; url: string; filename: string; mime: string; size: number };

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/media");
    if (res.ok) setMedia((await res.json()).media);
  }
  useEffect(() => { load(); }, []);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `Failed to upload ${file.name}`);
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    load();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Media library</h1>
      <p className="mb-5 text-sm text-slate-500">
        Upload images (and PDFs) to reuse as cover images and downloads. Stored locally by default.
      </p>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
        className="mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center hover:border-brand"
      >
        <span className="font-medium text-slate-700">{busy ? "Uploading…" : "Drop files here or click to upload"}</span>
        <span className="mt-1 text-xs text-slate-400">JPG, PNG, GIF, WebP, SVG, PDF · up to 10 MB</span>
        <input ref={inputRef} type="file" multiple accept="image/*,application/pdf" className="hidden"
          onChange={(e) => upload(e.target.files)} />
      </label>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {media.map((m) => (
          <div key={m.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="aspect-square bg-slate-50">
              {m.mime.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-3xl">📄</div>
              )}
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(m.url); setCopied(m.id); setTimeout(() => setCopied(null), 1200); }}
              className="w-full truncate px-2 py-1.5 text-left text-xs text-slate-500 hover:text-brand"
              title={m.url}
            >
              {copied === m.id ? "Copied!" : m.filename}
            </button>
          </div>
        ))}
        {media.length === 0 && <p className="col-span-full text-sm text-slate-400">No media yet.</p>}
      </div>
    </div>
  );
}
