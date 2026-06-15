import { NextResponse } from "next/server";
import { requireRole } from "../../../lib/auth";
import { getSettings } from "../../../lib/settings";
import { sendEmail } from "../../../lib/email";
import { createBooking, listBookings, setBookingStatus, deleteBooking } from "../../../lib/booking";

export const runtime = "nodejs";
function guard(): Response | null { try { requireRole("editor"); return null; } catch (r) { if (r instanceof Response) return r; throw r; } }
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

// POST /api/booking — public request.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b?.company) return NextResponse.json({ ok: true }); // honeypot
  try {
    const bk = await createBooking(b);
    const settings = await getSettings();
    if (settings.bookingNotifyEmail) {
      await sendEmail({
        to: settings.bookingNotifyEmail,
        subject: `New booking request from ${bk.name}${bk.service ? ` — ${bk.service}` : ""}`,
        html: `<p><strong>${esc(bk.name)}</strong> &lt;${esc(bk.email)}&gt;</p>${bk.service ? `<p>Service: ${esc(bk.service)}</p>` : ""}${bk.preferredAt ? `<p>Preferred: ${esc(bk.preferredAt)}</p>` : ""}${bk.message ? `<p>${esc(bk.message)}</p>` : ""}`,
      }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 400 });
  }
}
export async function GET() { const denied = guard(); if (denied) return denied; return NextResponse.json({ bookings: await listBookings() }); }
export async function PATCH(req: Request) {
  const denied = guard(); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  if (!b?.id || !b?.status) return NextResponse.json({ error: "id + status required." }, { status: 400 });
  try { const bk = await setBookingStatus(b.id, b.status); return NextResponse.json({ booking: bk }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 400 }); }
}
export async function DELETE(req: Request) {
  const denied = guard(); if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") || (await req.json().catch(() => ({}))).id;
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  await deleteBooking(id); return NextResponse.json({ ok: true });
}
