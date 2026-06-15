import { NextResponse } from "next/server";
import { requireRole } from "../../../lib/auth";
import { fetchLinkPreview } from "../../../lib/ingest";

export const runtime = "nodejs";

// POST /api/link-preview { url } -> { image?, title?, description? } (contributor+).
export async function POST(req: Request) {
  try { requireRole("contributor"); }
  catch (r) { if (r instanceof Response) return r; throw r; }
  const body = await req.json().catch(() => ({}));
  const url = String(body?.url || "").trim();
  if (!url) return NextResponse.json({ error: "url required." }, { status: 400 });
  try {
    const preview = await fetchLinkPreview(url);
    return NextResponse.json({ preview });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not read that URL." }, { status: 422 });
  }
}
