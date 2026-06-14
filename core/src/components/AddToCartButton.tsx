"use client";

import { useState } from "react";
import { addToCart, type CartLine } from "../lib/cart";

export default function AddToCartButton({ line }: { line: Omit<CartLine, "quantity"> }) {
  const [added, setAdded] = useState(false);
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
