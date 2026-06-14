"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartCount, CART_EVENT } from "../lib/cart";

export default function CartButton() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(cartCount());
    update();
    window.addEventListener(CART_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(CART_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <Link href="/cart" className="relative hover:text-brand" aria-label="Cart">
      Cart
      {count > 0 && (
        <span className="absolute -right-3 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
