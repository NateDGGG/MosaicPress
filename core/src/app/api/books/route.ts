import { NextResponse } from "next/server";
import { importBook } from "../../../lib/books";
import { requireRole } from "../../../lib/auth";

export const runtime = "nodejs";

// POST /api/books { url } -> normalized book draft, or 422 if it isn't a book.
export async function POST(req: Request) {
  try {
    requireRole("contributor");
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const body = await req.json().catch(() => ({}));
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "A book `url` is required." }, { status: 400 });
  try {
    const draft = await importBook(url);
    return NextResponse.json({ draft });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not import that book.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
