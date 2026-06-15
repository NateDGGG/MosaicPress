import { NextResponse } from "next/server";
import { requireRole } from "../../../lib/auth";
import { bulkImport, parseUrlList } from "../../../lib/bulk";

export const runtime = "nodejs";
export const maxDuration = 120;

// POST /api/bulk-import { text | urls } -> per-URL classification results.
export async function POST(req: Request) {
  try {
    requireRole("contributor");
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const body = await req.json().catch(() => ({}));
  const urls: string[] = Array.isArray(body?.urls)
    ? body.urls
    : parseUrlList(String(body?.text || ""));
  if (urls.length === 0) return NextResponse.json({ error: "Paste at least one http(s) URL." }, { status: 400 });
  if (urls.length > 50) return NextResponse.json({ error: "Please import 50 URLs or fewer at a time." }, { status: 400 });

  const results = await bulkImport(urls, typeof body?.forceType === "string" ? body.forceType : undefined);
  return NextResponse.json({ results });
}
