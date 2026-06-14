import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { requireRole } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: public list of active plans (admins see all).
export async function GET() {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ plans });
}

// POST: create a plan (owner).
export async function POST(req: Request) {
  try {
    requireRole("owner");
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const body = await req.json().catch(() => ({}));
  const { name, priceCents, interval, description, currency } = body || {};
  if (!name || priceCents == null) {
    return NextResponse.json({ error: "name and priceCents required." }, { status: 400 });
  }
  const plan = await prisma.plan.create({
    data: {
      name,
      description: description || null,
      priceCents: Math.round(Number(priceCents)),
      currency: currency || "USD",
      interval: interval === "year" ? "year" : "month",
    },
  });
  return NextResponse.json({ plan }, { status: 201 });
}

// PATCH: toggle active / edit (owner). Body: { id, ...fields }
export async function PATCH(req: Request) {
  try {
    requireRole("owner");
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return NextResponse.json({ error: "id required." }, { status: 400 });
  const data: any = {};
  for (const k of ["name", "description", "priceCents", "currency", "interval", "active", "sortOrder"]) {
    if (k in body) data[k] = body[k];
  }
  const plan = await prisma.plan.update({ where: { id: body.id }, data });
  return NextResponse.json({ plan });
}
