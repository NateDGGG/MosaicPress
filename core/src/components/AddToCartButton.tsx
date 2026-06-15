"use client";

import { useState } from "react";
import { addToCart, type CartLine } from "../lib/cart";

export default function AddToCartButton({ line, soldOut = false }: { line: Omit<CartLine, "quantity">; soldOut?: boolean }) {
  const [added, setAdded] = useState(false);
  if (soldOut) {
    return (
      <button disabled className="cursor-not-allowed rounded-lg bg-slate-200 px-5 py-2.5 font-semibold text-slate-500">
        Sold out
      </button>
    );
  }
  return (
    <button
      onClick={() => {
        addToCart(line);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
