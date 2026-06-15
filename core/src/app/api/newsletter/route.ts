import { NextResponse } from "next/server";
import { requireRole } from "../../../lib/auth";
import { subscribe, unsubscribe, listSubscribers, toCsv } from "../../../lib/newsletter";

export const runtime = "nodejs";

function guard(): Response | null {
  try { requireRole("editor"); return null; }
  catch (r) { if (r instanceof Response) return r; throw r; }
}

// POST /api/newsletter — public subscribe/unsubscribe.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body?.company) return NextResponse.json({ ok: true }); // honeypot
  const email = String(body?.email || "").trim();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  try {
    if (body?.unsubscribe) { await unsubscribe(email); return NextResponse.json({ ok: true, unsubscribed: true }); }
    await subscribe(email, body?.name, body?.source);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 400 });
  }
}

// GET /api/newsletter — list (editor); ?format=csv downloads a CSV.
export async function GET(req: Request) {
  const denied = guard(); if (denied) return denied;
  const rows = await listSubscribers();
  if (new URL(req.url).searchParams.get("format") === "csv") {
    return new Response(toCsv(rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
  return NextResponse.json({ subscribers: rows });
}

export async function DELETE(req: Request) {
  const denied = guard(); if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") || (await req.json().catch(() => ({}))).id;
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  const { prisma } = await import("../../../lib/db");
  await prisma.subscriber.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
