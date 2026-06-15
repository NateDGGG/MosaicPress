"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ItemActions({
  itemId, initialSaved, initialCompleted, nextHref,
}: { itemId: string; initialSaved: boolean; initialCompleted: boolean; nextHref?: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [completed, setCompleted] = useState(initialCompleted);
  const [busy, setBusy] = useState(false);

  async function update(patch: { saved?: boolean; completed?: boolean }) {
    setBusy(true);
    const res = await fetch("/api/progress", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, ...patch }),
    });
    setBusy(false);
    if (res.ok) {
      if (typeof patch.saved === "boolean") setSaved(patch.saved);
      if (typeof patch.completed === "boolean") setCompleted(patch.completed);
    }
    return res.ok;
  }

  async function completeAndContinue() {
    const ok = await update({ completed: true });
    if (ok && nextHref) router.push(nextHref);
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        disabled={busy}
        onClick={() => update({ saved: !saved })}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
          saved ? "border-brand bg-blue-50 text-brand" : "border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {saved ? "★ Saved" : "☆ Save for later"}
      </button>
      <button
        disabled={busy}
        onClick={() => update({ completed: !completed })}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
          completed ? "border-green-600 bg-green-50 text-green-700" : "border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {completed ? "✓ Completed" : "Mark complete"}
      </button>
      {nextHref && (
        <button
          disabled={busy}
          onClick={completeAndContinue}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          Complete &amp; continue →
        </button>
      )}
    </div>
  );
}
