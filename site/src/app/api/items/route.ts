import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createFromDraft, itemInclude, uniqueSlug } from "@/lib/items";
import { isItemType } from "@/lib/types";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/items  -> all items (admin view)
export async function GET() {
  try {
    requireRole("contributor");
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const items = await prisma.item.findMany({
    include: itemInclude,
    orderBy: [{ updatedAt: "desc" }],
  });
  return NextResponse.json({ items });
}

// POST /api/items
//   { draft }                              -> save a normalized external draft
//   { type, title, summary?, body? ... }   -> create a hosted item
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

  // Path 1: persist an ingestion draft (external).
  if (body?.draft) {
    try {
      const item = await createFromDraft(body.draft);
      return NextResponse.json({ item }, { status: 201 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save draft.";
      return NextResponse.json({ error: msg }, { status: 422 });
    }
  }

  // Path 2: create a hosted item.
  const { type, title } = body || {};
  if (!isItemType(type)) {
    return NextResponse.json({ error: "Valid `type` required." }, { status: 400 });
  }
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "`title` required." }, { status: 400 });
  }

  const slug = await uniqueSlug(title);
  try {
    const item = await prisma.item.create({
      data: {
        slug,
        type,
        source: "hosted",
        title,
        summary: body.summary || null,
        coverImage: body.coverImage || null,
        author: body.author || null,
        status: "draft",
        body: type === "article" ? body.body || null : null,
        videoMeta:
          type === "video"
            ? { create: { playerUrl: body.playerUrl || null, duration: body.duration || null } }
            : undefined,
        productMeta:
          type === "product"
            ? {
                create: {
                  priceCents: body.priceCents ?? null,
                  currency: body.currency || "USD",
                  kind: body.kind || "physical",
                  fileUrl: body.fileUrl || null,
                },
              }
            : undefined,
        linkMeta:
          type === "link"
            ? { create: { url: body.url || "", note: body.note || null } }
            : undefined,
      },
      include: itemInclude,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create item.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
