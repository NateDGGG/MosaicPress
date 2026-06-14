"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SubscribeButton({ planId, loggedIn }: { planId: string; loggedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    if (!loggedIn) {
      router.push("/join");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start subscription.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={subscribe} disabled={busy}
        className="w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
        {busy ? "Redirecting…" : loggedIn ? "Subscribe" : "Join to subscribe"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
