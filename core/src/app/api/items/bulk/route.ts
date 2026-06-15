import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { requireRole } from "../../../../lib/auth";

export const runtime = "nodejs";

const ACTIONS = ["publish", "unpublish", "feature", "unfeature", "delete", "addTag", "removeTag"];

// POST /api/items/bulk { ids:[...], action, tagId? } — bulk operations (editor+).
export async function POST(req: Request) {
  try { requireRole("editor"); }
  catch (r) { if (r instanceof Response) return r; throw r; }

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];
  const action: string = body?.action;
  if (!ids.length) return NextResponse.json({ error: "No items selected." }, { status: 400 });
  if (!ACTIONS.includes(action)) return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  try {
    switch (action) {
      case "publish":
        await prisma.item.updateMany({ where: { id: { in: ids } }, data: { status: "published" } });
        await prisma.item.updateMany({ where: { id: { in: ids }, publishedAt: null }, data: { publishedAt: new Date() } });
        break;
      case "unpublish":
        await prisma.item.updateMany({ where: { id: { in: ids } }, data: { status: "draft" } });
        break;
      case "feature":
        await prisma.item.updateMany({ where: { id: { in: ids } }, data: { featured: true } });
        break;
      case "unfeature":
        await prisma.item.updateMany({ where: { id: { in: ids } }, data: { featured: false } });
        break;
      case "delete":
        await prisma.item.deleteMany({ where: { id: { in: ids } } });
        break;
      case "addTag": {
        if (!body?.tagId) return NextResponse.json({ error: "tagId required." }, { status: 400 });
        // SQLite has no createMany skipDuplicates — upsert each on the unique pair.
        await Promise.all(
          ids.map((itemId) =>
            prisma.itemTag.upsert({
              where: { tagId_itemId: { tagId: body.tagId, itemId } },
              create: { tagId: body.tagId, itemId },
              update: {},
            }).catch(() => null)
          )
        );
        break;
      }
      case "removeTag": {
        if (!body?.tagId) return NextResponse.json({ error: "tagId required." }, { status: 400 });
        await prisma.itemTag.deleteMany({ where: { tagId: body.tagId, itemId: { in: ids } } });
        break;
      }
    }
    return NextResponse.json({ ok: true, count: ids.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Bulk action failed." }, { status: 422 });
  }
}
