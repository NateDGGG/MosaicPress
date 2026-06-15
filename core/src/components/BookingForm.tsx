"use client";
import { useState } from "react";
export default function BookingForm() {
  const [f, setF] = useState({ name: "", email: "", service: "", preferredAt: "", message: "", company: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const res = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not send your request.");
      setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed."); } finally { setBusy(false); }
  }
  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none";
  if (done) return <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center"><div className="mb-1 text-2xl">✅</div><h2 className="font-semibold text-slate-800">Request received</h2><p className="text-sm text-slate-600">We&rsquo;ll confirm a time by email shortly.</p></div>;
  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div><label className="mb-1 block text-xs font-medium text-slate-500">Name</label><input required value={f.name} onChange={(e) => set("name", e.target.value)} className={field} /></div>
        <div><label className="mb-1 block text-xs font-medium text-slate-500">Email</label><input required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={field} /></div>
      </div>
      <label className="mb-1 block text-xs font-medium text-slate-500">Service / session type (optional)</label>
      <input value={f.service} onChange={(e) => set("service", e.target.value)} className={`${field} mb-3`} />
      <label className="mb-1 block text-xs font-medium text-slate-500">Preferred date / time (optional)</label>
      <input value={f.preferredAt} onChange={(e) => set("preferredAt", e.target.value)} placeholder="e.g. weekday mornings, or June 20 @ 2pm" className={`${field} mb-3`} />
      <label className="mb-1 block text-xs font-medium text-slate-500">Anything else (optional)</label>
      <textarea value={f.message} onChange={(e) => set("message", e.target.value)} rows={3} className={`${field} mb-3`} />
      <div className="hidden" aria-hidden="true"><label>Company<input tabIndex={-1} autoComplete="off" value={f.company} onChange={(e) => set("company", e.target.value)} /></label></div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{busy ? "Sending…" : "Request booking"}</button>
    </form>
  );
}
