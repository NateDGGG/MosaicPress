import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/auth";
import { priceFormat } from "@/lib/items";
import { providerName } from "@/lib/payments";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  refunded: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-700",
};

export default async function OrdersPage() {
  const me = getSessionUser();
  if (!hasRole(me, "editor")) redirect("/admin");

  const orders = await prisma.order.findMany({
    include: { lines: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const revenue = orders.filter((o) => o.status !== "pending" && o.status !== "failed")
    .reduce((s, o) => s + o.totalCents, 0);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
          Provider: {providerName()}{providerName() === "stub" ? " (no Stripe keys)" : ""}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Orders" value={String(orders.length)} />
        <Stat label="Paid/Fulfilled" value={String(orders.filter((o) => o.status === "paid" || o.status === "fulfilled").length)} />
        <Stat label="Revenue" value={priceFormat(revenue, orders[0]?.currency || "USD") || "$0.00"} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono text-xs text-slate-400">{o.id.slice(0, 8)}</td>
                <td className="px-3 py-2">{o.lines.map((l) => `${l.title} ×${l.quantity}`).join(", ")}</td>
                <td className="px-3 py-2 text-slate-500">{o.email || "—"}</td>
                <td className="px-3 py-2 font-medium">{priceFormat(o.totalCents, o.currency)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status] || "bg-slate-100"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
