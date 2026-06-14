import { NextResponse } from "next/server";
import { authenticate, setSessionCookie } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { email, password } = body || {};
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required." }, { status: 400 });
  }
  const user = await authenticate(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  setSessionCookie(user);
  return NextResponse.json({ user });
}
