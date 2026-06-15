"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type S = { id: string; email: string; name: string | null; status: string; createdAt: string };

export default function SubscriberRow({ s }: { s: S }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!confirm(`Remove ${s.email}?`)) return;
    setBusy(true);
    await fetch(`/api/newsletter?id=${s.id}`, { method: "DELETE" });
    setBusy(false); router.refresh();
  }
  return (
    <tr className="border-t border-slate-100">
      <td className="px-3 py-2">{s.email}</td>
      <td className="px-3 py-2 text-slate-500">{s.name || "—"}</td>
      <td className="px-3 py-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "subscribed" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{s.status}</span>
      </td>
      <td className="px-3 py-2 text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</td>
      <td className="px-3 py-2 text-right"><button disabled={busy} onClick={remove} className="text-red-600 hover:underline disabled:opacity-50">Delete</button></td>
    </tr>
  );
}
