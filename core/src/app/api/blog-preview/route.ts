import { NextResponse } from "next/server";
import { requireRole } from "../../../lib/auth";
import { renderBlogHtml, makeBlogBody } from "../../../lib/blog";

export const runtime = "nodejs";

// POST /api/blog-preview { format, content } -> sanitized HTML (matches publish output).
export async function POST(req: Request) {
  try { requireRole("contributor"); }
  catch (r) { if (r instanceof Response) return r; throw r; }
  const body = await req.json().catch(() => ({}));
  const html = renderBlogHtml(makeBlogBody(body?.format, body?.content || ""));
  return NextResponse.json({ html });
}
