import { cookies } from "next/headers";
import { prisma } from "./db";
import {
  decodeSession,
  encodeSession,
  hasRole,
  verifyPassword,
  type Role,
  type SessionUser,
} from "./auth-core";

// Re-export the pure primitives so existing imports from "@/lib/auth" keep working.
export {
  hashPassword,
  verifyPassword,
  encodeSession,
  decodeSession,
  hasRole,
  isStaff,
  type Role,
  type SessionUser,
} from "./auth-core";

const COOKIE = "ml_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function setSessionCookie(user: SessionUser) {
  cookies().set(COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export function getSessionUser(): SessionUser | null {
  return decodeSession(cookies().get(COOKIE)?.value);
}

// For API routes: throws a Response if unauthorized.
export function requireRole(min: Role): SessionUser {
  const user = getSessionUser();
  if (!hasRole(user, min)) {
    throw new Response(JSON.stringify({ error: "Unauthorized." }), {
      status: user ? 403 : 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user!;
}

// Authenticate credentials against the DB.
export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const u = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!u || !verifyPassword(password, u.passwordHash)) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role as Role };
}
