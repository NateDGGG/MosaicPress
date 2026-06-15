"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, company, source: "/contact" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not send. Please try again.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none";

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mb-1 text-2xl">✅</div>
        <h2 className="font-semibold text-slate-800">Thanks — your message is on its way.</h2>
        <p className="text-sm text-slate-600">We&rsquo;ll get back to you at {email}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </div>
      </div>
      <label className="mb-1 block text-xs font-medium text-slate-500">Subject (optional)</label>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} className={`${field} mb-3`} />
      <label className="mb-1 block text-xs font-medium text-slate-500">Message</label>
      <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className={`${field} mb-3`} />
      {/* honeypot — hidden from humans */}
      <div className="hidden" aria-hidden="true">
        <label>Company<input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} /></label>
      </div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
