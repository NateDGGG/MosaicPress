"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CancelMembershipButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function cancel() {
    if (!confirm("Cancel your membership? You'll keep access until the period ends.")) return;
    setBusy(true);
    await fetch("/api/subscription/cancel", { method: "POST" });
    setBusy(false);
    router.refresh();
  }
  return (
    <button onClick={cancel} disabled={busy}
      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
      {busy ? "Canceling…" : "Cancel membership"}
    </button>
  );
}
