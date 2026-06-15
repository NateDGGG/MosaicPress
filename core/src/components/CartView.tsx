"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart, removeFromCart, setQuantity, type CartLine, CART_EVENT } from "../lib/cart";

function money(cents: number, currency: string) {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100); }
  catch { return `$${(cents / 100).toFixed(2)}`; }
}

type Ship = { name: string; line1: string; line2: string; city: string; region: string; postal: string; country: string };
const EMPTY_SHIP: Ship = { name: "", line1: "", line2: "", city: "", region: "", postal: "", country: "" };

export default function CartView({ commerceEnabled }: { commerceEnabled: boolean }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [email, setEmail] = useState("");
  const [ship, setShip] = useState<Ship>(EMPTY_SHIP);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setLines(getCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, []);

  const currency = lines[0]?.currency || "USD";
  const total = lines.reduce((s, l) => s + l.unitCents * l.quantity, 0);
  // Treat lines with no recorded kind as physical (safer — collect an address).
  const hasPhysical = lines.some((l) => (l.kind || "physical") !== "digital");
  const needsShipping = commerceEnabled && hasPhysical;
  const setS = (k: keyof Ship, v: string) => setShip((p) => ({ ...p, [k]: v }));

  async function checkout() {
    if (needsShipping && (!ship.name || !ship.line1 || !ship.city || !ship.postal || !ship.country)) {
      setError("Please complete the shipping address.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          lines: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
          shipping: needsShipping ? ship : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <h1 className="mb-2 text-2xl font-bold">Your cart is empty</h1>
        <Link href="/" className="text-brand hover:underline">Browse content →</Link>
      </div>
    );
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-2xl font-bold">Cart</h1>
      <div className="mb-5 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {lines.map((l) => (
          <div key={l.itemId} className="flex items-center gap-3 p-3">
            {l.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.coverImage} alt="" className="h-14 w-14 rounded object-cover" />
            )}
            <div className="flex-1">
              <div className="font-medium">{l.title}</div>
              <div className="text-sm text-slate-500">{money(l.unitCents, l.currency)}</div>
            </div>
            <input
              type="number"
              min={1}
              value={l.quantity}
              onChange={(e) => setQuantity(l.itemId, parseInt(e.target.value) || 1)}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center"
            />
            <button onClick={() => removeFromCart(l.itemId)} className="text-sm text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
      </div>

      {needsShipping && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Shipping address</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={ship.name} onChange={(e) => setS("name", e.target.value)} placeholder="Full name" className={`${field} col-span-2`} />
            <input value={ship.line1} onChange={(e) => setS("line1", e.target.value)} placeholder="Address line 1" className={`${field} col-span-2`} />
            <input value={ship.line2} onChange={(e) => setS("line2", e.target.value)} placeholder="Address line 2 (optional)" className={`${field} col-span-2`} />
            <input value={ship.city} onChange={(e) => setS("city", e.target.value)} placeholder="City" className={field} />
            <input value={ship.region} onChange={(e) => setS("region", e.target.value)} placeholder="State / Region" className={field} />
            <input value={ship.postal} onChange={(e) => setS("postal", e.target.value)} placeholder="Postal code" className={field} />
            <input value={ship.country} onChange={(e) => setS("country", e.target.value)} placeholder="Country" className={field} />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{money(total, currency)}</span>
        </div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Email (for receipt{needsShipping ? " & shipping updates" : ""})</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          onClick={checkout}
          disabled={busy}
          className="w-full rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Redirecting…" : "Checkout"}
        </button>
        <p className="mt-2 text-center text-xs text-slate-400">
          Secure checkout via Stripe. Without Stripe keys, runs in safe stub mode (no charge).
        </p>
      </div>
    </div>
  );
}
