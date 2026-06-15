import { NextResponse } from "next/server";
import { requireRole } from "../../../lib/auth";
import { listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial, reorderTestimonials } from "../../../lib/testimonials";

export const runtime = "nodejs";
function guard(): Response | null { try { requireRole("editor"); return null; } catch (r) { if (r instanceof Response) return r; throw r; } }

export async function GET() { return NextResponse.json({ testimonials: await listTestimonials() }); }

export async function POST(req: Request) {
  const denied = guard(); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  if (!b?.name?.trim() || !b?.quote?.trim()) return NextResponse.json({ error: "Name and quote required." }, { status: 400 });
  const t = await createTestimonial(b);
  return NextResponse.json({ testimonial: t }, { status: 201 });
}
export async function PATCH(req: Request) {
  const denied = guard(); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  if (!b?.id) return NextResponse.json({ error: "id required." }, { status: 400 });
  if (Array.isArray(b.order)) { await reorderTestimonials(b.order); return NextResponse.json({ ok: true }); }
  const t = await updateTestimonial(b.id, b);
  return NextResponse.json({ testimonial: t });
}
export async function DELETE(req: Request) {
  const denied = guard(); if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") || (await req.json().catch(() => ({}))).id;
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  await deleteTestimonial(id); return NextResponse.json({ ok: true });
}
