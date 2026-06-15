import nodemailer from "nodemailer";

// Transactional email behind a provider boundary. SMTP is the default
// implementation; when SMTP isn't configured we fall back to a STUB that logs
// the message (so receipts/digital delivery are fully testable without a mail
// server). Swap this module for SES/Resend/etc. without touching callers.

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  sent: boolean;
  mode: "smtp" | "stub";
  error?: string;
}

let _transport: nodemailer.Transporter | null | undefined;
function getTransport(): nodemailer.Transporter | null {
  if (_transport !== undefined) return _transport;
  const host = process.env.SMTP_HOST;
  if (!host) {
    _transport = null;
    return null;
  }
  _transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return _transport;
}

export function emailMode(): "smtp" | "stub" {
  return getTransport() ? "smtp" : "stub";
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || "Mosaic <no-reply@example.com>";
}

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const transport = getTransport();
  if (!transport) {
    // STUB: log instead of sending.
    console.log(
      `\n[email:stub] To: ${msg.to}\n[email:stub] Subject: ${msg.subject}\n[email:stub] (set SMTP_HOST to send for real)\n`
    );
    return { sent: false, mode: "stub" };
  }
  try {
    await transport.sendMail({
      from: fromAddress(),
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text || msg.html.replace(/<[^>]+>/g, " "),
    });
    return { sent: true, mode: "smtp" };
  } catch (e) {
    const error = e instanceof Error ? e.message : "send failed";
    console.error("[email] send failed:", error);
    return { sent: false, mode: "smtp", error };
  }
}

// ---- Templates ----

function money(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export interface ReceiptLine {
  title: string;
  quantity: number;
  unitCents: number;
  downloadUrl?: string;
}

export function renderReceipt(opts: {
  siteName: string;
  orderId: string;
  currency: string;
  totalCents: number;
  lines: ReceiptLine[];
}): { subject: string; html: string } {
  const rows = opts.lines
    .map(
      (l) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">
          ${escapeHtml(l.title)} × ${l.quantity}
          ${l.downloadUrl ? `<br><a href="${l.downloadUrl}" style="color:#1d4ed8">Download your file →</a>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">
          ${money(l.unitCents * l.quantity, opts.currency)}
        </td>
      </tr>`
    )
    .join("");

  const html = `
  <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <h2 style="margin:0 0 4px">Thank you for your order</h2>
    <p style="color:#64748b;margin:0 0 16px">${escapeHtml(opts.siteName)} · Order ${opts.orderId.slice(0, 8)}</p>
    <table style="width:100%;border-collapse:collapse">
      ${rows}
      <tr>
        <td style="padding:10px 0;font-weight:bold">Total</td>
        <td style="padding:10px 0;font-weight:bold;text-align:right">${money(opts.totalCents, opts.currency)}</td>
      </tr>
    </table>
    <p style="color:#94a3b8;font-size:12px;margin-top:20px">
      Digital downloads are linked above and are tied to this order.
    </p>
  </div>`;

  return { subject: `Your ${opts.siteName} order (${opts.orderId.slice(0, 8)})`, html };
}

export function renderShipped(opts: {
  siteName: string;
  orderId: string;
  lines: { title: string; quantity: number }[];
  ship?: { name?: string | null; line1?: string | null; line2?: string | null; city?: string | null; region?: string | null; postal?: string | null; country?: string | null };
  statusUrl?: string;
}): { subject: string; html: string } {
  const items = opts.lines
    .map((l) => `<li style="padding:2px 0">${escapeHtml(l.title)} × ${l.quantity}</li>`)
    .join("");
  const a = opts.ship;
  const addr = a
    ? `<p style="color:#64748b;margin:12px 0 0">Shipping to:<br>${[a.name, a.line1, a.line2, [a.city, a.region, a.postal].filter(Boolean).join(", "), a.country].filter(Boolean).map((x) => escapeHtml(String(x))).join("<br>")}</p>`
    : "";
  const html = `
  <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <h2 style="margin:0 0 4px">Your order has shipped \u{1F4E6}</h2>
    <p style="color:#64748b;margin:0 0 16px">${escapeHtml(opts.siteName)} \u00B7 Order ${opts.orderId.slice(0, 8)}</p>
    <ul style="padding-left:18px;margin:0">${items}</ul>
    ${addr}
    ${opts.statusUrl ? `<p style="margin-top:16px"><a href="${opts.statusUrl}" style="color:#1d4ed8">Track your order \u2192</a></p>` : ""}
  </div>`;
  return { subject: `Your ${opts.siteName} order has shipped (${opts.orderId.slice(0, 8)})`, html };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}
