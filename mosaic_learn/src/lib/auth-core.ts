import crypto from "node:crypto";

// Pure auth primitives — no Next.js / cookie dependencies, so they're easy to
// unit-test. The cookie-bound helpers live in auth.ts and build on these.

const SECRET = process.env.SESSION_SECRET || "dev-insecure-secret";

export type Role = "owner" | "editor" | "contributor" | "member";
// Members are customers, not staff — rank 0 keeps them out of all admin gates.
export const RANK: Record<Role, number> = { member: 0, contributor: 1, editor: 2, owner: 3 };

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

// ---- password hashing (scrypt) ----
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored?: string | null): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(test, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- stateless signed-session tokens ----
function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function encodeSession(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token?: string): SessionUser | null {
  if (!token || !token.includes(".")) return null;
  const [payload, mac] = token.split(".");
  const expected = sign(payload);
  if (mac.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser;
  } catch {
    return null;
  }
}

export function hasRole(user: SessionUser | null, min: Role): boolean {
  return !!user && RANK[user.role] >= RANK[min];
}

export function isStaff(user: SessionUser | null): boolean {
  return !!user && user.role !== "member";
}
