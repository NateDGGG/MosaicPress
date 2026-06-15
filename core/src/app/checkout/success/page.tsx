import Link from "next/link";
import { prisma } from "../../../lib/db";
import { priceFormat } from "../../../lib/items";
import { downloadUrl } from "../../../lib/download";
import ClearCart from "../../../components/ClearCart";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  const orderId = searchParams.order;
  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        include: { lines: { include: { item: { include: { productMeta: true } } } } },
      })
    : null;

  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <ClearCart />
      <div className="mb-4 text-5xl">✅</div>
      <h1 className="mb-2 text-2xl font-bold">Thank you!</h1>
      <p className="mb-6 text-slate-600">
        {order ? `Order confirmed (${order.status}).` : "Your order is confirmed."}
      </p>

      {order && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 text-left">
          {order.lines.map((l) => {
            const digitalUrl =
              l.item.productMeta?.kind === "digital" && order.status !== "pending"
                ? downloadUrl(order.id, l.itemId)
                : null;
            return (
              <div key={l.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                <div>
                  <div className="font-medium">{l.title}</div>
                  <div className="text-sm text-slate-500">Qty {l.quantity}</div>
                  {digitalUrl && (
                    <a href={digitalUrl} className="text-sm text-brand hover:underline">Download →</a>
                  )}
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
      )}

      <div className="flex justify-center gap-4">
        {order && <Link href={`/orders/${order.id}`} className="text-brand hover:underline">View order status →</Link>}
        <Link href="/" className="text-brand hover:underline">Continue browsing →</Link>
      </div>
    </div>
  );
}
