"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      // Members go to their account; staff go to the admin.
      router.push(data.user?.role === "member" ? "/account" : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="mb-1 text-2xl font-bold">Sign in</h1>
      <p className="mb-6 text-sm text-slate-500">Access the admin to manage content.</p>
      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        <label className="mb-1 block text-xs font-medium text-slate-500">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
