import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "../../../lib/db";
import { priceFormat } from "../../../lib/items";
import { downloadUrl } from "../../../lib/download";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order status" };

const STATUS_NOTE: Record<string, string> = {
  pending: "We're waiting on payment confirmation.",
  paid: "Payment received — we're preparing your order.",
  fulfilled: "Your order has been fulfilled. Physical items are on their way.",
  refunded: "This order has been refunded.",
  failed: "Payment didn't go through.",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  refunded: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-700",
};

export default async function OrderStatusPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { lines: { include: { item: { include: { productMeta: true } } } } },
  });
  if (!order) notFound();

  const hasShipping = order.shipName || order.shipLine1 || order.shipCity;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-bold">Your order</h1>
      <p className="mb-4 font-mono text-sm text-slate-400">#{order.id.slice(0, 8)}</p>

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[order.status] || "bg-slate-100"}`}>{order.status}</span>
          <span className="text-sm text-slate-600">{STATUS_NOTE[order.status] || ""}</span>
        </div>
        <p className="text-xs text-slate-400">Placed {new Date(order.createdAt).toLocaleString()}</p>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
        {order.lines.map((l) => {
          const digitalUrl =
            l.item.productMeta?.kind === "digital" && order.status !== "pending" && order.status !== "failed"
              ? downloadUrl(order.id, l.itemId)
              : null;
          return (
            <div key={l.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
              <div>
                <div className="font-medium">{l.title}</div>
                <div className="text-sm text-slate-500">Qty {l.quantity}</div>
                {digitalUrl && <a href={digitalUrl} className="text-sm text-brand hover:underline">Download →</a>}
              </div>
              <div className="font-semibold">{priceFormat(l.unitCents * l.quantity, order.currency)}</div>
            </div>
          );
        })}
        <div className="mt-3 flex justify-between font-bold">
          <span>Total</span>
          <span>{priceFormat(order.totalCents, order.currency)}</span>
        </div>
      </div>

      {hasShipping && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h2 className="mb-2 font-semibold">Shipping to</h2>
          <address className="not-italic text-slate-600">
            {order.shipName && <div>{order.shipName}</div>}
            {order.shipLine1 && <div>{order.shipLine1}</div>}
            {order.shipLine2 && <div>{order.shipLine2}</div>}
            <div>{[order.shipCity, order.shipRegion, order.shipPostal].filter(Boolean).join(", ")}</div>
            {order.shipCountry && <div>{order.shipCountry}</div>}
          </address>
        </div>
      )}

      <Link href="/" className="text-brand hover:underline">Continue browsing →</Link>
    </div>
  );
}
