import { NextResponse } from "next/server";
import { requireRole } from "../../../lib/auth";
import { getSettings } from "../../../lib/settings";
import { sendEmail } from "../../../lib/email";
import { createSubmission, listSubmissions, markRead, deleteSubmission } from "../../../lib/contact";

export const runtime = "nodejs";

function guard(): Response | null {
  try { requireRole("editor"); return null; }
  catch (r) { if (r instanceof Response) return r; throw r; }
}

const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

// POST /api/contact — public submission.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // Honeypot: real users never fill "company".
  if (body?.company) return NextResponse.json({ ok: true });

  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const message = String(body?.message || "").trim();
  if (!name || !email || !message) return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  if (!emailOk(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });

  const sub = await createSubmission({ name, email, message, subject: body?.subject, source: body?.source });

  // Notify the owner if configured + SMTP available (no-op in stub mode).
  try {
    const settings = await getSettings();
    if (settings.contactNotifyEmail) {
      await sendEmail({
        to: settings.contactNotifyEmail,
        subject: `New message from ${name}${sub.subject ? ` — ${sub.subject}` : ""}`,
        html: `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>${sub.subject ? `<p>Subject: ${escapeHtml(sub.subject)}</p>` : ""}<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      }).catch(() => {});
    }
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const denied = guard(); if (denied) return denied;
  return NextResponse.json({ submissions: await listSubmissions() });
}

export async function PATCH(req: Request) {
  const denied = guard(); if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return NextResponse.json({ error: "id required." }, { status: 400 });
  await markRead(body.id, !!body.read);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const denied = guard(); if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") || (await req.json().catch(() => ({}))).id;
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  await deleteSubmission(id);
  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
