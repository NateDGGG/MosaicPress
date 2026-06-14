import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { activateSubscription } from "@/lib/membership";

export const runtime = "nodejs";

// STUB-mode only: activates a subscription immediately, then redirects to /account.
export async function GET(req: Request) {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const planId = new URL(req.url).searchParams.get("plan");
  if (!planId) return NextResponse.json({ error: "Missing plan." }, { status: 400 });

  await activateSubscription({ userId: user.id, planId, provider: "stub", periodDays: 30 });
  const base = process.env.APP_URL || new URL(req.url).origin;
  return NextResponse.redirect(`${base}/account?subscribed=1`);
}
