import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { setItemTags } from "../../../lib/taxonomy";
import { createFromBookDraft, createFromDraft, itemInclude, uniqueSlug } from "../../../lib/items";
import { isItemType, isSource } from "../../../lib/types";
import { requireRole } from "../../../lib/auth";

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
  // Path 0: persist a book draft (from importBook).
  if (body?.bookDraft) {
    try {
      const item = await createFromBookDraft(body.bookDraft);
      return NextResponse.json({ item }, { status: 201 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save book.";
      return NextResponse.json({ error: msg }, { status: 422 });
    }
  }

  if (body?.draft) {
    try {
      const item = await createFromDraft(body.draft);
      return NextResponse.json({ item }, { status: 201 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save draft.";
      return NextResponse.json({ error: msg }, { status: 422 });
    }
  }

  // Path 2: create an item directly (hosted, or external product/link).
  const { type, title } = body || {};
  if (!isItemType(type)) {
    return NextResponse.json({ error: "Valid `type` required." }, { status: 400 });
  }
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "`title` required." }, { status: 400 });
  }
  const source = isSource(body.source) ? body.source : "hosted";
  const buyUrl: string | null = body.buyUrl || body.url || null;
  let extDomain: string | null = null;
  let extName: string | null = null;
  if (source === "external" && buyUrl) {
    try { extDomain = new URL(buyUrl).hostname.replace(/^www\./, ""); extName = extDomain.split(".")[0]; extName = extName.charAt(0).toUpperCase() + extName.slice(1); } catch {}
  }

  const slug = await uniqueSlug(title);
  try {
    const item = await prisma.item.create({
      data: {
        slug,
        type,
        source,
        title,
        summary: body.summary || null,
        coverImage: body.coverImage || null,
        author: body.author || null,
        commentary: body.commentary || null,
        attributes: typeof body.attributes === "string" ? body.attributes : null,
        featuredNote: !!body.featuredNote,
        status: "draft",
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        body: type === "article" || type === "blog" ? body.body || null : null,
        external:
          source === "external" && buyUrl
            ? { create: { url: buyUrl, sourceName: extName, sourceDomain: extDomain, favicon: extDomain ? `https://www.google.com/s2/favicons?domain=${extDomain}&sz=64` : null, embedAllowed: false, adapter: "manual" } }
            : undefined,
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
                  inventory: body.inventory ?? null,
                  fileUrl: body.fileUrl || null,
                  buyUrl: source === "external" ? buyUrl : null,
                  priceCheckedAt: source === "external" ? new Date() : null,
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
    if (Array.isArray(body.tagIds) && body.tagIds.length) {
      await setItemTags(item.id, body.tagIds);
      const withTags = await prisma.item.findUnique({ where: { id: item.id }, include: itemInclude });
      return NextResponse.json({ item: withTags ?? item }, { status: 201 });
    }
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create item.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
