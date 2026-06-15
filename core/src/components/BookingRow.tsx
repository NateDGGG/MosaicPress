"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
type B = { id: string; name: string; email: string; service: string | null; preferredAt: string | null; message: string | null; status: string; createdAt: string };
const COLOR: Record<string, string> = { new: "bg-amber-100 text-amber-700", confirmed: "bg-green-100 text-green-700", declined: "bg-slate-100 text-slate-500" };
export default function BookingRow({ b }: { b: B }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function setStatus(status: string) { setBusy(true); await fetch("/api/booking", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, status }) }); setBusy(false); router.refresh(); }
  async function remove() { if (!confirm("Delete this request?")) return; setBusy(true); await fetch(`/api/booking?id=${b.id}`, { method: "DELETE" }); setBusy(false); router.refresh(); }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-800">{b.name}</span>
        <span className="text-sm text-slate-500">{b.email}</span>
        {b.service && <span className="text-sm text-slate-400">· {b.service}</span>}
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${COLOR[b.status] || "bg-slate-100"}`}>{b.status}</span>
        <span className="text-xs text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</span>
      </div>
      {b.preferredAt && <p className="mt-1 text-sm text-slate-600">Preferred: {b.preferredAt}</p>}
      {b.message && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{b.message}</p>}
      <div className="mt-3 flex gap-3 text-sm">
        <a href={`mailto:${b.email}`} className="font-medium text-brand hover:underline">Reply →</a>
        {b.status !== "confirmed" && <button disabled={busy} onClick={() => setStatus("confirmed")} className="text-green-600 hover:underline disabled:opacity-50">Confirm</button>}
        {b.status !== "declined" && <button disabled={busy} onClick={() => setStatus("declined")} className="text-slate-500 hover:underline disabled:opacity-50">Decline</button>}
        <button disabled={busy} onClick={remove} className="text-red-600 hover:underline disabled:opacity-50">Delete</button>
      </div>
    </div>
  );
}
