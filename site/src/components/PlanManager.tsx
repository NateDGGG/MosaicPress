"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Plan = {
  id: string; name: string; description: string | null;
  priceCents: number; currency: string; interval: string; active: boolean;
};

function money(cents: number, currency: string) {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100); }
  catch { return `$${(cents / 100).toFixed(2)}`; }
}

export default function PlanManager({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [interval, setInterval] = useState("month");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, interval, priceCents: Math.round(parseFloat(price) * 100) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      setName(""); setPrice(""); setDescription(""); setInterval("month");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally { setBusy(false); }
  }

  async function toggle(p: Plan) {
    await fetch("/api/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active }),
    });
    router.refresh();
  }

  const field = "rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none";

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-3 py-2">Plan</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-2"><span className="font-medium">{p.name}</span>{p.description && <span className="block text-xs text-slate-400">{p.description}</span>}</td>
                <td className="px-3 py-2">{money(p.priceCents, p.currency)}/{p.interval}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.active ? "active" : "inactive"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => toggle(p)} className="text-sm text-brand hover:underline">
                    {p.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {plans.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">No plans yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <form onSubmit={create} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Add a plan</h2>
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Name (e.g. Supporter)" value={name} onChange={(e) => setName(e.target.value)} className={field} />
          <input required type="number" step="0.01" placeholder="Price (e.g. 5.00)" value={price} onChange={(e) => setPrice(e.target.value)} className={field} />
          <select value={interval} onChange={(e) => setInterval(e.target.value)} className={field}>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
          <input placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} className={field} />
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="mt-3 rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {busy ? "Adding…" : "Add plan"}
        </button>
      </form>
    </div>
  );
}
