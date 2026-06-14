import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <div className="mb-4 text-5xl">🛒</div>
      <h1 className="mb-2 text-2xl font-bold">Checkout canceled</h1>
      <p className="mb-6 text-slate-600">No charge was made. Your cart is still saved.</p>
      <Link href="/cart" className="text-brand hover:underline">Return to cart →</Link>
    </div>
  );
}
