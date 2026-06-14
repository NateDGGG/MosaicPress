import { NextResponse } from "next/server";
import { searchItems } from "@/lib/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/search?q=... -> ranked published items (public)
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (!q) return NextResponse.json({ query: "", results: [] });
  const hits = await searchItems(q);
  return NextResponse.json({
    query: q,
    results: hits.map((h) => ({
      id: h.item.id,
      slug: h.item.slug,
      title: h.item.title,
      type: h.item.type,
      source: h.item.source,
      score: h.score,
    })),
  });
}
