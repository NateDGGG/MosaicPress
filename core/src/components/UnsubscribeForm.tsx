"use client";
import { useState } from "react";
export default function UnsubscribeForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, unsubscribe: true }) });
    setBusy(false); setDone(true);
  }
  if (done) return <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">You&rsquo;ve been unsubscribed. Sorry to see you go.</p>;
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none" />
      <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">{busy ? "…" : "Unsubscribe"}</button>
    </form>
  );
}
