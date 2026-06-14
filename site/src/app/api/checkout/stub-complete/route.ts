import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fulfillOrder } from "@/lib/payments";

export const runtime = "nodejs";

// STUB-mode only: simulates a successful payment, then redirects to success.
// Real deployments use Stripe + the webhook instead.
export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get("order");
  if (!orderId) return NextResponse.json({ error: "Missing order." }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.provider !== "stub") {
    return NextResponse.json({ error: "Not a stub order." }, { status: 400 });
  }
  await prisma.order.update({ where: { id: orderId }, data: { status: "paid" } });
  await fulfillOrder(orderId);
  const base = process.env.APP_URL || new URL(req.url).origin;
  return NextResponse.redirect(`${base}/checkout/success?order=${orderId}`);
}
