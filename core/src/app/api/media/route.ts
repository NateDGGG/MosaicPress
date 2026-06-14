import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { requireRole } from "../../../lib/auth";
import { isAllowedMime, MAX_UPLOAD_BYTES, storeFile } from "../../../lib/media";

export const runtime = "nodejs";

function guard(): Response | null {
  try {
    requireRole("contributor");
    return null;
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}

// GET /api/media -> list uploaded media
export async function GET() {
  const denied = guard();
  if (denied) return denied;
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ media });
}

// POST /api/media (multipart form with `file`) -> store + record
export async function POST(req: Request) {
  const denied = guard();
  if (denied) return denied;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!isAllowedMime(file.type)) {
    return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storeFile(buffer, file.type, file.name);
  const media = await prisma.media.create({
    data: { url: stored.url, filename: stored.filename, mime: file.type, size: stored.size, alt: file.name },
  });
  return NextResponse.json({ media }, { status: 201 });
}
