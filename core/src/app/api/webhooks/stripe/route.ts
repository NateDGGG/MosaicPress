import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getStripe, fulfillOrder } from "../../../../lib/payments";
import { activateSubscription } from "../../../../lib/membership";

export const runtime = "nodejs";

// Stripe sends raw body; signature must be verified against the raw payload.
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig!, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid signature.";
    return NextResponse.json({ error: `Webhook verification failed: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    if (session.mode === "subscription" && session.metadata?.userId && session.metadata?.planId) {
      // Membership checkout completed.
      await activateSubscription({
        userId: session.metadata.userId,
        planId: session.metadata.planId,
        provider: "stripe",
        providerRef: session.subscription as string,
        periodDays: 31,
      });
    } else if (session.metadata?.orderId) {
      // One-time product order.
      await fulfillOrder(session.metadata.orderId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as any;
    await prisma.subscription
      .updateMany({ where: { providerRef: sub.id }, data: { status: "canceled" } })
      .catch(() => {});
  }

  return NextResponse.json({ received: true });
}
