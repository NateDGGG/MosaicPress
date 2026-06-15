"use client";

import { useEffect, useState } from "react";

type Tag = { id: string; slug: string; name: string; isDefault: boolean; showOnHome: boolean };

export default function AdminTopics() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/tags");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(
          d.error ||
            `Couldn't load topics (HTTP ${res.status}). If you just changed the schema, run \`npx prisma db push\` and restart the dev server.`
        );
        return;
      }
      const t = (await res.json()).tags as Tag[];
      setTags(t);
      setDrafts(Object.fromEntries(t.map((x) => [x.id, x.name])));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load topics.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function api(method: string, body: any) {
    setError(null); setMsg(null);
    const res = await fetch("/api/tags", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || "Failed."); return false; }
    return true;
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    if (await api("POST", { name })) { setName(""); await load(); setMsg("Topic added."); }
    setBusy(false);
  }
  async function rename(id: string) {
    setBusy(true);
    if (await api("PATCH", { id, name: drafts[id] })) { await load(); setMsg("Renamed."); }
    setBusy(false);
  }
  async function makeDefault(id: string) {
    setBusy(true);
    if (await api("PATCH", { id, makeDefault: true })) { await load(); setMsg("Default topic updated."); }
    setBusy(false);
  }
  async function toggleHome(t: Tag) {
    setBusy(true);
    if (await api("PATCH", { id: t.id, showOnHome: !t.showOnHome })) { await load(); }
    setBusy(false);
  }
  async function remove(id: string, label: string) {
    if (!confirm(`Delete "${label}"? Its content will move to the default topic.`)) return;
    setBusy(true);
    if (await api("DELETE", { id })) { await load(); setMsg("Topic deleted."); }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Topics</h1>
      <p className="mb-5 text-sm text-slate-500">
        Subjects you can tag lessons with. The <strong>default topic</strong> receives any content
        that isn&rsquo;t assigned a topic. Each topic has a public page.
      </p>

      <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-3 py-2">Topic</th><th className="px-3 py-2 w-20">Home</th><th className="px-3 py-2 w-28">Default</th><th className="px-3 py-2 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {tags.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input
                    value={drafts[t.id] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 focus:border-brand focus:outline-none"
                  />
                  <a href={`/topics/${t.slug}`} className="text-xs text-slate-400 hover:text-brand">/topics/{t.slug}</a>
                </td>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={t.showOnHome} onChange={() => toggleHome(t)} disabled={busy} title="Show this topic on the home page" />
                </td>
                <td className="px-3 py-2">
                  {t.isDefault ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">★ Default</span>
                  ) : (
                    <button onClick={() => makeDefault(t.id)} disabled={busy} className="text-xs text-brand hover:underline disabled:opacity-50">
                      Make default
                    </button>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <a href={`/admin/topics/${t.id}`} className="text-slate-500 hover:underline">Edit</a>
                    <button
                      onClick={() => rename(t.id)}
                      disabled={busy || drafts[t.id] === t.name || !drafts[t.id]?.trim()}
                      className="text-brand hover:underline disabled:text-slate-300"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => remove(t.id, t.name)}
                      disabled={busy || t.isDefault}
                      className="text-red-600 hover:underline disabled:text-slate-300"
                      title={t.isDefault ? "Can't delete the default topic" : "Delete"}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400">Loading…</td></tr>}
            {!loading && tags.length === 0 && !error && <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">No topics yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {msg && <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      <form onSubmit={create} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Add a topic</h2>
        <div className="flex gap-2">
          <input required placeholder="e.g. Economics" value={name} onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <button type="submit" disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">
            {busy ? "…" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
