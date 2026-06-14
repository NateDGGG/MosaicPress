"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("contributor");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setOk(true);
      setEmail(""); setName(""); setPassword(""); setRole("contributor");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-semibold">Add a user</h2>
      <div className="grid grid-cols-2 gap-3">
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none" />
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none" />
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none">
          <option value="contributor">Contributor</option>
          <option value="editor">Editor</option>
          <option value="owner">Owner</option>
        </select>
        <input required type="password" placeholder="Temp password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none" />
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">User created.</p>}
      <button type="submit" disabled={busy}
        className="mt-3 rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
        {busy ? "Adding…" : "Add user"}
      </button>
    </form>
  );
}
