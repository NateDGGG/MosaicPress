import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { syncAll, syncItem } from "@/lib/sync";
import { publishDue } from "@/lib/schedule";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/sync          -> publish due items + sync all external items (owner)
// POST /api/sync {itemId} -> sync a single item
export async function POST(req: Request) {
  try {
    requireRole("owner");
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const body = await req.json().catch(() => ({}));
  if (body?.itemId) {
    const result = await syncItem(body.itemId);
    return NextResponse.json({ result });
  }
  // Run scheduled publishing alongside the external sync.
  const scheduled = await publishDue();
  const summary = await syncAll();
  return NextResponse.json({ summary, scheduledPublished: scheduled.published });
}
