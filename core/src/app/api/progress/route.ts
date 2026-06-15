import { NextResponse } from "next/server";
import { getOrCreateLearnerForWrite } from "../../../lib/learner";
import { setProgress } from "../../../lib/progress";

export const runtime = "nodejs";

// POST /api/progress { itemId, saved?, completed? }
// Records progress for the current learner — a signed-in user, or (when the
// site allows anonymous tracking) an anonymous device cookie minted on demand.
export async function POST(req: Request) {
  const learner = await getOrCreateLearnerForWrite();
  if (!learner) {
    return NextResponse.json({ error: "Progress tracking is unavailable." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body?.itemId) return NextResponse.json({ error: "itemId required." }, { status: 400 });
  if (typeof body.saved !== "boolean" && typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  try {
    const progress = await setProgress(learner, body.itemId, { saved: body.saved, completed: body.completed });
    return NextResponse.json({ progress });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 422 });
  }
}
