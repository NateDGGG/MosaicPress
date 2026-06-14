import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/auth";

export const runtime = "nodejs";

const ROLES = ["owner", "editor", "contributor"];

export async function GET() {
  try {
    requireRole("owner");
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
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
  const { email, name, role, password } = body || {};
  if (!email || !password) return NextResponse.json({ error: "Email and password required." }, { status: 400 });
  if (role && !ROLES.includes(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  try {
    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase().trim(),
        name: name || null,
        role: role || "contributor",
        passwordHash: hashPassword(password),
      },
      select: { id: true, email: true, name: true, role: true },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }
}
