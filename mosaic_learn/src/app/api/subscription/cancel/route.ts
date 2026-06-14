import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { cancelSubscription } from "@/lib/membership";
import { getStripe } from "@/lib/payments";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // If a real Stripe subscription exists, cancel it there too.
  const stripe = getStripe();
  if (stripe) {
    const sub = await prisma.subscription.findFirst({
      where: { userId: user.id, status: "active", provider: "stripe", providerRef: { not: null } },
    });
    if (sub?.providerRef) {
      await stripe.subscriptions.cancel(sub.providerRef).catch(() => {});
    }
  }

  await cancelSubscription(user.id);
  return NextResponse.json({ ok: true });
}
