import { NextResponse } from "next/server";
import { requireRole } from "../../../lib/auth";
import {
  addCollectionItem, createCollection, deleteCollection, listCollections,
  removeCollectionItem, reorderCollection, updateCollection,
} from "../../../lib/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guard(): Response | null {
  try { requireRole("editor"); return null; }
  catch (r) { if (r instanceof Response) return r; throw r; }
}

export async function GET() {
  return NextResponse.json({ collections: await listCollections() });
}

export async function POST(req: Request) {
  const denied = guard(); if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  if (!body?.title?.trim()) return NextResponse.json({ error: "title required." }, { status: 400 });
  const collection = await createCollection(body.title.trim());
  return NextResponse.json({ collection }, { status: 201 });
}

// PATCH { id, ...meta } | { id, order:[itemIds] } | { id, addItemId } | { id, removeItemId }
export async function PATCH(req: Request) {
  const denied = guard(); if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return NextResponse.json({ error: "id required." }, { status: 400 });
  try {
    if (Array.isArray(body.order)) { await reorderCollection(body.id, body.order); return NextResponse.json({ ok: true }); }
    if (body.addItemId) { await addCollectionItem(body.id, body.addItemId); return NextResponse.json({ ok: true }); }
    if (body.removeItemId) { await removeCollectionItem(body.id, body.removeItemId); return NextResponse.json({ ok: true }); }
    const collection = await updateCollection(body.id, body);
    return NextResponse.json({ collection });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 422 });
  }
}

export async function DELETE(req: Request) {
  const denied = guard(); if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") || (await req.json().catch(() => ({}))).id;
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  try { await deleteCollection(id); return NextResponse.json({ ok: true }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 422 }); }
}
