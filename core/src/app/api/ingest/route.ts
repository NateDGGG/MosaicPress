import { NextResponse } from "next/server";
import { ingestUrl } from "../../../lib/ingest";
import { requireRole } from "../../../lib/auth";

export const runtime = "nodejs";

// POST /api/ingest  { url }  -> normalized external draft (preview, not saved)
export async function POST(req: Request) {
  try {
    requireRole("contributor");
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "A `url` is required." }, { status: 400 });

  try {
    const draft = await ingestUrl(url);
    return NextResponse.json({ draft });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to ingest URL.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
