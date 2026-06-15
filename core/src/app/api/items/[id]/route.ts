import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getItemById, itemInclude } from "../../../../lib/items";
import { requireRole } from "../../../../lib/auth";
import { setItemTags } from "../../../../lib/taxonomy";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

function guard(min: "contributor" | "editor" | "owner"): Response | null {
  try {
    requireRole(min);
    return null;
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}

// GET /api/items/:id
export async function GET(_req: Request, { params }: Ctx) {
  const denied = guard("contributor");
  if (denied) return denied;
  const item = await getItemById(params.id);
  if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ item });
}

// PATCH /api/items/:id  -> update base fields, publish/unpublish, edit meta
export async function PATCH(req: Request, { params }: Ctx) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  // Publishing or scheduling requires editor+; other edits only contributor+.
  const gated = body?.status === "published" || body?.status === "scheduled";
  const denied = guard(gated ? "editor" : "contributor");
  if (denied) return denied;

  const existing = await prisma.item.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const data: any = {};
  for (const k of ["title", "summary", "coverImage", "author", "body", "featured", "access", "seoTitle", "seoDesc", "level"]) {
    if (k in body) data[k] = body[k];
  }
  // Presenter: empty string clears the relation.
  if ("presenterId" in body) data.presenterId = body.presenterId || null;
  // Explicit schedule time (ISO string) — used with status "scheduled".
  if ("publishedAt" in body) {
    data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
  }
  if ("status" in body) {
    data.status = body.status;
    if (body.status === "published" && !("publishedAt" in body) && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  const item = await prisma.item.update({
    where: { id: params.id },
    data,
    include: itemInclude,
  });

  // Optional nested updates for type/source meta.
  if (body.productMeta) {
    await prisma.productMeta.update({ where: { itemId: params.id }, data: body.productMeta }).catch(() => {});
  }
  if (body.videoMeta) {
    await prisma.videoMeta.update({ where: { itemId: params.id }, data: body.videoMeta }).catch(() => {});
  }
  if (body.linkMeta) {
    await prisma.linkMeta.update({ where: { itemId: params.id }, data: body.linkMeta }).catch(() => {});
  }
  // Topic tags: replace the set when provided.
  if (Array.isArray(body.tagIds)) {
    await setItemTags(params.id, body.tagIds);
  }

  const full = await prisma.item.findUnique({ where: { id: params.id }, include: itemInclude });
  return NextResponse.json({ item: full ?? item });
}

// DELETE /api/items/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = guard("editor");
  if (denied) return denied;
  try {
    await prisma.item.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
