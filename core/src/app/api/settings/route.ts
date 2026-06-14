import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "../../../lib/settings";
import { requireRole } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: Request) {
  try {
    requireRole("owner");
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const settings = await saveSettings(body || {});
  return NextResponse.json({ settings });
}
