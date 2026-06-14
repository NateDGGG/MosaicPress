"use client";

// Lightweight client-only cart backed by localStorage. Emits a window event
// so the header badge stays in sync across components.

export interface CartLine {
  itemId: string;
  title: string;
  unitCents: number;
  currency: string;
  coverImage?: string;
  quantity: number;
}

const KEY = "ml_cart";
const EVENT = "ml-cart-changed";

export function getCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(EVENT));
}

export function addToCart(line: Omit<CartLine, "quantity">, qty = 1) {
  const cart = getCart();
  const existing = cart.find((l) => l.itemId === line.itemId);
  if (existing) existing.quantity += qty;
  else cart.push({ ...line, quantity: qty });
  write(cart);
}

export function removeFromCart(itemId: string) {
  write(getCart().filter((l) => l.itemId !== itemId));
}

export function setQuantity(itemId: string, qty: number) {
  const cart = getCart();
  const line = cart.find((l) => l.itemId === itemId);
  if (line) line.quantity = Math.max(1, qty);
  write(cart);
}

export function clearCart() {
  write([]);
}

export function cartCount(): number {
  return getCart().reduce((n, l) => n + l.quantity, 0);
}

export const CART_EVENT = EVENT;
