import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { deleteTag, ensureTag, listTags, renameTag, setDefaultTag } from "@/lib/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guard(): Response | null {
  try {
    requireRole("editor");
    return null;
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}

export async function GET() {
  try {
    return NextResponse.json({ tags: await listTags() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load topics.";
    return NextResponse.json(
      { error: `${msg} — if the schema changed, run \`npx prisma db push\` and restart.` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const denied = guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  if (!body?.name) return NextResponse.json({ error: "name required." }, { status: 400 });
  const tag = await ensureTag(body.name);
  return NextResponse.json({ tag }, { status: 201 });
}

// PATCH { id, name }            -> rename
// PATCH { id, makeDefault:true} -> set as the default topic
export async function PATCH(req: Request) {
  const denied = guard();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return NextResponse.json({ error: "id required." }, { status: 400 });
  try {
    if (body.makeDefault) {
      const tag = await setDefaultTag(body.id);
      return NextResponse.json({ tag });
    }
    if (typeof body.name === "string" && body.name.trim()) {
      const tag = await renameTag(body.id, body.name.trim());
      return NextResponse.json({ tag });
    }
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 422 });
  }
}

export async function DELETE(req: Request) {
  const denied = guard();
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") || (await req.json().catch(() => ({}))).id;
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  try {
    await deleteTag(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 422 });
  }
}
