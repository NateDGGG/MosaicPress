"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Line = { id: string; title: string; quantity: number };
type Order = {
  id: string; status: string; email: string | null; totalCents: number; currency: string;
  createdAt: string; provider: string; lines: Line[];
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  refunded: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-700",
};

function money(cents: number, currency: string) {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100); }
  catch { return `$${(cents / 100).toFixed(2)}`; }
}

export default function AdminOrderRow({ order }: { order: Order }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: string) {
    setBusy(true);
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-3 py-2 font-mono text-xs"><Link href={`/admin/orders/${order.id}`} className="text-brand hover:underline">{order.id.slice(0, 8)}</Link></td>
      <td className="px-3 py-2">{order.lines.map((l) => `${l.title} ×${l.quantity}`).join(", ")}</td>
      <td className="px-3 py-2 text-slate-500">{order.email || "—"}</td>
      <td className="px-3 py-2 font-medium">{money(order.totalCents, order.currency)}</td>
      <td className="px-3 py-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[order.status] || "bg-slate-100"}`}>
          {order.status}
        </span>
      </td>
      <td className="px-3 py-2 text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</td>
      <td className="px-3 py-2 text-right text-sm">
        <div className="flex justify-end gap-2">
          <Link href={`/admin/orders/${order.id}`} className="text-slate-500 hover:underline">View</Link>
          {order.status === "paid" && (
            <button disabled={busy} onClick={() => setStatus("fulfilled")} className="text-green-600 hover:underline disabled:opacity-50">Mark fulfilled</button>
          )}
          {(order.status === "pending") && (
            <button disabled={busy} onClick={() => setStatus("paid")} className="text-blue-600 hover:underline disabled:opacity-50">Mark paid</button>
          )}
          {(order.status === "paid" || order.status === "fulfilled") && (
            <button disabled={busy} onClick={() => { if (confirm("Mark this order refunded?")) setStatus("refunded"); }} className="text-red-600 hover:underline disabled:opacity-50">Refund</button>
          )}
        </div>
      </td>
    </tr>
  );
}
