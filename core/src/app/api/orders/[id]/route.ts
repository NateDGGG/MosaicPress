import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { requireRole } from "../../../../lib/auth";
import { getSettings } from "../../../../lib/settings";
import { sendEmail, renderShipped } from "../../../../lib/email";

export const runtime = "nodejs";

const STATUSES = ["pending", "paid", "fulfilled", "refunded", "failed"];

// PATCH /api/orders/:id { status } — advance an order's fulfillment status (editor+).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    requireRole("editor");
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const body = await req.json().catch(() => ({}));
  if (!STATUSES.includes(body?.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  try {
    const prev = await prisma.order.findUnique({
      where: { id: params.id },
      include: { lines: true },
    });
    if (!prev) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const order = await prisma.order.update({ where: { id: params.id }, data: { status: body.status } });

    // Shipping notification — only when newly marked fulfilled and enabled.
    if (body.status === "fulfilled" && prev.status !== "fulfilled" && prev.email) {
      const settings = await getSettings();
      if (settings.notifyOnShip) {
        const base = process.env.APP_URL || "";
        const { subject, html } = renderShipped({
          siteName: settings.siteName,
          orderId: prev.id,
          lines: prev.lines.map((l) => ({ title: l.title, quantity: l.quantity })),
          ship: {
            name: prev.shipName, line1: prev.shipLine1, line2: prev.shipLine2,
            city: prev.shipCity, region: prev.shipRegion, postal: prev.shipPostal, country: prev.shipCountry,
          },
          statusUrl: base ? `${base}/orders/${prev.id}` : undefined,
        });
        await sendEmail({ to: prev.email, subject, html }).catch(() => {});
      }
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
}
