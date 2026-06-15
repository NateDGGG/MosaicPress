import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { hashPassword, setSessionCookie } from "../../../../lib/auth";
import { currentAnonId, clearAnonCookie } from "../../../../lib/learner";
import { mergeAnonProgress } from "../../../../lib/progress";

export const runtime = "nodejs";

// Public self-registration — always creates a `member` (customer), never staff.
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { email, password, name } = body || {};
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required." }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  try {
    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase().trim(),
        name: name || null,
        role: "member",
        passwordHash: hashPassword(password),
      },
    });
    setSessionCookie({ id: user.id, email: user.email, name: user.name, role: "member" });
    const anonId = currentAnonId();
    if (anonId) {
      try { await mergeAnonProgress(user.id, anonId); } catch {}
      clearAnonCookie();
    }
    return NextResponse.json({ user: { id: user.id, email: user.email, role: "member" } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
  }
}
