import { NextResponse } from "next/server";
import { getSessionUser } from "../../../lib/auth";
import { setProgress } from "../../../lib/progress";

export const runtime = "nodejs";

// POST /api/progress { itemId, saved?, completed? } — any signed-in user.
export async function POST(req: Request) {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body?.itemId) return NextResponse.json({ error: "itemId required." }, { status: 400 });
  if (typeof body.saved !== "boolean" && typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  try {
    const progress = await setProgress(user.id, body.itemId, { saved: body.saved, completed: body.completed });
    return NextResponse.json({ progress });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 422 });
  }
}
