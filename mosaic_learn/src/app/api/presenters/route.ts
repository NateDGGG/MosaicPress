import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { listPresenters, uniquePresenterSlug } from "@/lib/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ presenters: await listPresenters() });
}

export async function POST(req: Request) {
  try {
    requireRole("editor");
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const body = await req.json().catch(() => ({}));
  if (!body?.name) return NextResponse.json({ error: "name required." }, { status: 400 });
  const slug = await uniquePresenterSlug(body.name);
  const presenter = await prisma.presenter.create({
    data: {
      slug,
      name: body.name,
      title: body.title || null,
      bio: body.bio || null,
      photo: body.photo || null,
    },
  });
  return NextResponse.json({ presenter }, { status: 201 });
}
