import Stripe from "stripe";
import { prisma } from "./db";
import { renderReceipt, sendEmail, type ReceiptLine } from "./email";
import { downloadUrl } from "./download";
import { getSettings } from "./settings";

// Payment provider boundary. Stripe is the default implementation; when no
// STRIPE_SECRET_KEY is configured we fall back to a STUB provider that
// simulates a successful checkout so the full flow is testable without keys.

let _stripe: Stripe | null | undefined;
export function getStripe(): Stripe | null {
  if (_stripe !== undefined) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  _stripe = key ? new Stripe(key, { apiVersion: "2024-06-20" }) : null;
  return _stripe;
}

export function providerName(): "stripe" | "stub" {
  return getStripe() ? "stripe" : "stub";
}

export interface CartLineInput {
  itemId: string;
  quantity: number;
}

export interface ShippingInput {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal?: string;
  country?: string;
}

export interface CheckoutResult {
  url: string;
  orderId: string;
  mode: "stripe" | "stub";
}

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

/**
 * Create an order from validated cart lines and return a redirect URL.
 * Prices are always read from the DB — never trusted from the client.
 * Only HOSTED products are sold through checkout; external products link out.
 */
export async function createCheckout(
  lines: CartLineInput[],
  email?: string,
  shipping?: ShippingInput
): Promise<CheckoutResult> {
  const ids = lines.map((l) => l.itemId);
  const items = await prisma.item.findMany({
    where: { id: { in: ids }, type: "product", source: "hosted" },
    include: { productMeta: true },
  });

  const resolved = lines
    .map((l) => {
      const item = items.find((i) => i.id === l.itemId);
      if (!item || !item.productMeta?.priceCents) return null;
      return {
        item,
        quantity: Math.max(1, Math.min(99, Math.floor(l.quantity || 1))),
        unitCents: item.productMeta.priceCents,
        currency: item.productMeta.currency || "USD",
      };
    })
    .filter(Boolean) as Array<{ item: (typeof items)[number]; quantity: number; unitCents: number; currency: string }>;

  if (resolved.length === 0) throw new Error("No purchasable (hosted) products in cart.");

  const currency = resolved[0].currency;
  const totalCents = resolved.reduce((sum, r) => sum + r.unitCents * r.quantity, 0);

  const order = await prisma.order.create({
    data: {
      status: "pending",
      email: email || null,
      totalCents,
      currency,
      provider: providerName(),
      shipName: shipping?.name || null,
      shipLine1: shipping?.line1 || null,
      shipLine2: shipping?.line2 || null,
      shipCity: shipping?.city || null,
      shipRegion: shipping?.region || null,
      shipPostal: shipping?.postal || null,
      shipCountry: shipping?.country || null,
      lines: {
        create: resolved.map((r) => ({
          itemId: r.item.id,
          title: r.item.title,
          unitCents: r.unitCents,
          quantity: r.quantity,
        })),
      },
    },
  });

  const stripe = getStripe();

  // STUB mode: no real charge; complete immediately via a local endpoint.
  if (!stripe) {
    return {
      url: `${appUrl()}/api/checkout/stub-complete?order=${order.id}`,
      orderId: order.id,
      mode: "stub",
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: resolved.map((r) => ({
      quantity: r.quantity,
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: r.unitCents,
        product_data: { name: r.item.title },
      },
    })),
    customer_email: email || undefined,
    success_url: `${appUrl()}/checkout/success?order=${order.id}`,
    cancel_url: `${appUrl()}/checkout/cancel?order=${order.id}`,
    metadata: { orderId: order.id },
  });

  await prisma.order.update({ where: { id: order.id }, data: { providerRef: session.id } });
  return { url: session.url!, orderId: order.id, mode: "stripe" };
}

// Process a paid order: (optionally) decrement inventory, deliver digital goods
// + send the receipt, then set status. Physical orders wait at "paid" until an
// admin marks them shipped; all-digital orders are fulfilled immediately.
export async function fulfillOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: { include: { item: { include: { productMeta: true } } } } },
  });
  if (!order || order.status === "fulfilled" || order.status === "refunded") return;

  const settings = await getSettings();

  // Decrement inventory once, on first processing (status still pending).
  if (settings.trackInventory && order.status === "pending") {
    for (const l of order.lines) {
      const inv = l.item.productMeta?.inventory;
      if (inv != null) {
        await prisma.productMeta
          .update({ where: { itemId: l.itemId }, data: { inventory: Math.max(0, inv - l.quantity) } })
          .catch(() => {});
      }
    }
  }

  const hasPhysical = order.lines.some((l) => (l.item.productMeta?.kind || "physical") !== "digital");
  await prisma.order.update({ where: { id: orderId }, data: { status: hasPhysical ? "paid" : "fulfilled" } });

  if (!order.email) return; // nothing to send to
  const lines: ReceiptLine[] = order.lines.map((l) => ({
    title: l.title,
    quantity: l.quantity,
    unitCents: l.unitCents,
    downloadUrl:
      l.item.productMeta?.kind === "digital" ? downloadUrl(order.id, l.itemId) : undefined,
  }));

  const { subject, html } = renderReceipt({
    siteName: settings.siteName,
    orderId: order.id,
    currency: order.currency,
    totalCents: order.totalCents,
    lines,
  });

  await sendEmail({ to: order.email, subject, html });
}
