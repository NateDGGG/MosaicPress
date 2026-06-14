"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RunSyncButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed.");
      const s = data.summary;
      setMsg(`Checked ${s.total} · ok ${s.ok} · broken ${s.broken} · paywalled ${s.paywalled} · price changes ${s.priceChanges}`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={busy}
        className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
        {busy ? "Syncing…" : "Run sync now"}
      </button>
      {msg && <span className="text-sm text-slate-500">{msg}</span>}
    </div>
  );
}
