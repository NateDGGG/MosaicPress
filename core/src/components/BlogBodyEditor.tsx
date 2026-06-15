"use client";

import { useEffect, useRef, useState } from "react";

// Markdown/HTML body editor with a live, server-rendered (sanitized) preview.
export default function BlogBodyEditor({
  format, content, onChange,
}: { format: string; content: string; onChange: (format: string, content: string) => void }) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!content.trim()) { setHtml(""); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/blog-preview", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format, content }),
        });
        const d = await r.json();
        setHtml(d.html || "");
      } catch { /* ignore */ }
      setLoading(false);
    }, 400);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [format, content]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-500">Body</label>
        <select value={format} onChange={(e) => onChange(e.target.value, content)}
          className="rounded border border-slate-300 px-2 py-1 text-xs">
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
        </select>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <textarea
          value={content}
          onChange={(e) => onChange(format, e.target.value)}
          rows={18}
          placeholder={format === "html" ? "<h2>Heading</h2>\n<p>Your post…</p>" : "## Heading\n\nYour post in **markdown**…"}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand focus:outline-none"
        />
        <div className="max-h-[28rem] overflow-auto rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Preview{loading ? " …" : ""}</div>
          {html
            ? <div className="prose-body" dangerouslySetInnerHTML={{ __html: html }} />
            : <p className="text-sm text-slate-400">Start typing to see a live preview.</p>}
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {format === "markdown"
          ? "Markdown: # headings, **bold**, *italic*, - lists, [links](url), ![image](url)."
          : "HTML is sanitized — headings, lists, links, and images are kept."}
      </p>
    </div>
  );
}
