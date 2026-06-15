import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "../../../../lib/db";
import { getSessionUser, hasRole } from "../../../../lib/auth";
import { priceFormat } from "../../../../lib/items";
import AdminOrderActions from "../../../../components/AdminOrderActions";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  refunded: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-700",
};

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  const me = getSessionUser();
  if (!hasRole(me, "editor")) redirect("/admin");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { lines: { include: { item: { include: { productMeta: true } } } } },
  });
  if (!order) notFound();

  const hasShipping = order.shipName || order.shipLine1 || order.shipCity;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/orders" className="text-sm text-slate-400 hover:text-brand">← All orders</Link>
      <div className="mb-5 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Order <span className="font-mono text-lg text-slate-500">{order.id.slice(0, 8)}</span></h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[order.status] || "bg-slate-100"}`}>{order.status}</span>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h2 className="mb-2 font-semibold">Customer</h2>
          <p className="text-slate-600">Email: {order.email || "—"}</p>
          <p className="text-slate-600">Placed: {new Date(order.createdAt).toLocaleString()}</p>
          <p className="text-slate-600">Updated: {new Date(order.updatedAt).toLocaleString()}</p>
          <p className="text-slate-600">Provider: {order.provider}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h2 className="mb-2 font-semibold">Shipping</h2>
          {hasShipping ? (
            <address className="not-italic text-slate-600">
              {order.shipName && <div>{order.shipName}</div>}
              {order.shipLine1 && <div>{order.shipLine1}</div>}
              {order.shipLine2 && <div>{order.shipLine2}</div>}
              <div>{[order.shipCity, order.shipRegion, order.shipPostal].filter(Boolean).join(", ")}</div>
              {order.shipCountry && <div>{order.shipCountry}</div>}
            </address>
          ) : (
            <p className="text-slate-400">No shipping address (digital or not collected).</p>
          )}
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Items</h2>
        <div className="divide-y divide-slate-100">
          {order.lines.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">{l.title}</div>
                <div className="text-sm text-slate-500">
                  {l.item.productMeta?.kind === "digital" ? "Digital" : "Physical"} · Qty {l.quantity} · {priceFormat(l.unitCents, order.currency)} each
                </div>
              </div>
              <div className="font-semibold">{priceFormat(l.unitCents * l.quantity, order.currency)}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold">
          <span>Total</span>
          <span>{priceFormat(order.totalCents, order.currency)}</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Fulfillment</h2>
        <AdminOrderActions id={order.id} status={order.status} />
      </div>
    </div>
  );
}
