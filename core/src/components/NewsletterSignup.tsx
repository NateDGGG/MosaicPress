"use client";

import { useState } from "react";

export default function NewsletterSignup({
  heading, blurb, askName = false, source = "site",
}: { heading?: string; blurb?: string; askName?: boolean; source?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, company, source }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not subscribe.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="text-sm font-medium text-green-700">✅ You&rsquo;re subscribed — thanks!</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      {askName && (
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
          className="rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none sm:w-40" />
      )}
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none" />
      <div className="hidden" aria-hidden="true">
        <label>Company<input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} /></label>
      </div>
      <button type="submit" disabled={busy} className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
        {busy ? "…" : "Subscribe"}
      </button>
      {error && <span className="text-sm text-red-700 sm:w-full">{error}</span>}
    </form>
  );
}
