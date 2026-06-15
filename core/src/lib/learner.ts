import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getSessionUser } from "./auth";
import { getSettings } from "./settings";

// A "learner" is whoever progress is recorded for. It is either a signed-in
// user or an anonymous device (identified by a cookie). Which identities are
// allowed depends on the `progressTracking` setting:
//   "login"     -> only signed-in users
//   "anonymous" -> signed-in users, else an anonymous device cookie
//   "off"       -> nobody (no tracking at all)

export const ANON_COOKIE = "ml_anon";
const ANON_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type Learner =
  | { kind: "user"; userId: string }
  | { kind: "anon"; anonId: string };

// Read-only resolution for rendering (server components). Never sets a cookie,
// so it's safe to call during render. Returns null when tracking is unavailable.
export async function getLearner(): Promise<Learner | null> {
  const mode = (await getSettings()).progressTracking;
  if (mode === "off") return null;
  const user = getSessionUser();
  if (user) return { kind: "user", userId: user.id };
  if (mode === "anonymous") {
    const anonId = cookies().get(ANON_COOKIE)?.value;
    if (anonId) return { kind: "anon", anonId };
  }
  return null;
}

// Write-path resolution (route handlers / server actions). May mint and set the
// anonymous cookie, so it must only be called where setting cookies is allowed.
export async function getOrCreateLearnerForWrite(): Promise<Learner | null> {
  const mode = (await getSettings()).progressTracking;
  if (mode === "off") return null;
  const user = getSessionUser();
  if (user) return { kind: "user", userId: user.id };
  if (mode !== "anonymous") return null;

  const jar = cookies();
  let anonId = jar.get(ANON_COOKIE)?.value;
  if (!anonId) {
    anonId = crypto.randomUUID();
    jar.set(ANON_COOKIE, anonId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ANON_MAX_AGE,
    });
  }
  return { kind: "anon", anonId };
}

// The current anonymous id, if any (used to merge into an account on login).
export function currentAnonId(): string | null {
  return cookies().get(ANON_COOKIE)?.value ?? null;
}

export function clearAnonCookie() {
  cookies().delete(ANON_COOKIE);
}
