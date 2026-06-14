import { NextResponse } from "next/server";
import { createCheckout, type CartLineInput } from "../../../lib/payments";

export const runtime = "nodejs";

// POST /api/checkout  { lines: [{itemId, quantity}], email? }  (public — customers)
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const lines: CartLineInput[] = Array.isArray(body?.lines) ? body.lines : [];
  if (lines.length === 0) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });

  try {
    const result = await createCheckout(lines, body.email);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
