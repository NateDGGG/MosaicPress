"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminOrderActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: string) {
    setBusy(true);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  const btn = "rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" && (
        <button disabled={busy} onClick={() => setStatus("paid")} className={`${btn} bg-blue-600 hover:bg-blue-700`}>Mark paid</button>
      )}
      {status === "paid" && (
        <button disabled={busy} onClick={() => setStatus("fulfilled")} className={`${btn} bg-green-600 hover:bg-green-700`}>Mark fulfilled (shipped)</button>
      )}
      {(status === "paid" || status === "fulfilled") && (
        <button disabled={busy} onClick={() => { if (confirm("Mark this order refunded?")) setStatus("refunded"); }}
          className={`${btn} bg-red-600 hover:bg-red-700`}>Refund</button>
      )}
      {(status === "refunded" || status === "failed") && (
        <span className="text-sm text-slate-400">No further actions.</span>
      )}
    </div>
  );
}
