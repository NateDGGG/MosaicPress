import { prisma } from "./db";
import { getStripe } from "./payments";

// Membership: customer subscriptions that unlock members-only content.
// Mirrors the payments module — Stripe by default, stub fallback when no keys.

export async function getActiveSubscription(userId: string) {
  const subs = await prisma.subscription.findMany({
    where: { userId, status: "active" },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  // Active = status active AND not past its current period end (if set).
  return (
    subs.find((s) => !s.currentPeriodEnd || s.currentPeriodEnd.getTime() > Date.now()) || null
  );
}

export async function isActiveMember(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  return (await getActiveSubscription(userId)) != null;
}

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

export interface SubscribeResult {
  url: string;
  mode: "stripe" | "stub";
}

// Start a subscription checkout for a plan. Stripe subscription mode when
// configured; otherwise a stub URL that activates immediately.
export async function createSubscriptionCheckout(
  planId: string,
  user: { id: string; email: string }
): Promise<SubscribeResult> {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.active) throw new Error("Plan not available.");

  const stripe = getStripe();
  if (!stripe) {
    // Stub: complete immediately via local endpoint.
    return { url: `${appUrl()}/api/subscribe/stub-complete?plan=${plan.id}`, mode: "stub" };
  }

  // Use a pre-created Price if provided, else an inline recurring price.
  const lineItem = plan.stripePriceId
    ? { price: plan.stripePriceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: plan.currency.toLowerCase(),
          unit_amount: plan.priceCents,
          recurring: { interval: plan.interval === "year" ? "year" : "month" },
          product_data: { name: plan.name },
        },
      };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [lineItem as any],
    customer_email: user.email,
    success_url: `${appUrl()}/account?subscribed=1`,
    cancel_url: `${appUrl()}/membership?canceled=1`,
    metadata: { userId: user.id, planId: plan.id },
  });

  return { url: session.url!, mode: "stripe" };
}

// Create/refresh an active subscription record (used by stub + webhook).
export async function activateSubscription(opts: {
  userId: string;
  planId: string;
  provider: "stripe" | "stub";
  providerRef?: string;
  periodDays?: number;
}) {
  const periodEnd = new Date(Date.now() + (opts.periodDays ?? 30) * 24 * 60 * 60 * 1000);
  const existing = await prisma.subscription.findFirst({
    where: { userId: opts.userId, planId: opts.planId },
  });
  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: { status: "active", provider: opts.provider, providerRef: opts.providerRef, currentPeriodEnd: periodEnd },
    });
  }
  return prisma.subscription.create({
    data: {
      userId: opts.userId,
      planId: opts.planId,
      status: "active",
      provider: opts.provider,
      providerRef: opts.providerRef,
      currentPeriodEnd: periodEnd,
    },
  });
}

export async function cancelSubscription(userId: string) {
  await prisma.subscription.updateMany({
    where: { userId, status: "active" },
    data: { status: "canceled" },
  });
}

// True when the site offers at least one membership plan (used to hide
// membership UI when none exist).
export async function plansExist(): Promise<boolean> {
  return (await prisma.plan.count()) > 0;
}
