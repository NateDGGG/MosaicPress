"use client";

import { useEffect, useState } from "react";
import BlockEditor from "../../../components/BlockEditor";

export default function AdminAbout() {
  const [title, setTitle] = useState("About");
  const [body, setBody] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setTitle(d.settings?.aboutTitle || "About");
        setBody(d.settings?.aboutBody || "");
        setLoaded(true);
      })
      .catch(() => setError("Failed to load settings."));
  }, []);

  async function save() {
    setBusy(true); setMsg(null); setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aboutTitle: title, aboutBody: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed (owner only).");
      setMsg("Saved. View it at /about.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded && !error) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">About page</h1>
      <p className="mb-5 text-sm text-slate-500">Edit the public <code className="rounded bg-slate-100 px-1">/about</code> page.</p>

      <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none" />

      <label className="mb-1 block text-xs font-medium text-slate-500">Body</label>
      {loaded && <BlockEditor value={body} onChange={setBody} />}

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {msg && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      <button onClick={save} disabled={busy}
        className="mt-4 rounded-lg bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
        {busy ? "Saving…" : "Save About page"}
      </button>
    </div>
  );
}
