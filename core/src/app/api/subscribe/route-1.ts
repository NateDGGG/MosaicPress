import { NextResponse } from "next/server";
import { getSessionUser } from "../../../lib/auth";
import { createSubscriptionCheckout } from "../../../lib/membership";

export const runtime = "nodejs";

// POST /api/subscribe { planId } — any logged-in user (members included).
export async function POST(req: Request) {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in or join first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body?.planId) return NextResponse.json({ error: "planId required." }, { status: 400 });

  try {
    const result = await createSubscriptionCheckout(body.planId, { id: user.id, email: user.email });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Subscription failed.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
