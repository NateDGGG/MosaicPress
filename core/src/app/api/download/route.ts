import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../../lib/db";
import { verifyDownload } from "../../../lib/download";

export const runtime = "nodejs";

// GET /api/download?order=&item=&token=
// Serves a digital product's file if the signed token is valid and the order
// is paid/fulfilled.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order") || "";
  const itemId = searchParams.get("item") || "";
  const token = searchParams.get("token") || "";

  if (!orderId || !itemId || !token || !verifyDownload(orderId, itemId, token)) {
    return NextResponse.json({ error: "Invalid or expired download link." }, { status: 403 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } });
  if (!order || (order.status !== "paid" && order.status !== "fulfilled")) {
    return NextResponse.json({ error: "Order not eligible for download." }, { status: 403 });
  }
  if (!order.lines.some((l) => l.itemId === itemId)) {
    return NextResponse.json({ error: "Item not in this order." }, { status: 403 });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId }, include: { productMeta: true } });
  const fileUrl = item?.productMeta?.fileUrl;
  if (!item || item.productMeta?.kind !== "digital" || !fileUrl) {
    return NextResponse.json({ error: "No downloadable file." }, { status: 404 });
  }

  // Remote file: redirect. Local file under /public: stream it.
  if (/^https?:\/\//.test(fileUrl)) {
    return NextResponse.redirect(fileUrl);
  }

  const safe = path.normalize(fileUrl).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(process.cwd(), "public", safe);
  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "File not found on server (placeholder digital product)." },
      { status: 404 }
    );
  }
}
