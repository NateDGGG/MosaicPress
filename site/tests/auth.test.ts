import { describe, it, expect } from "vitest";
import {
  hashPassword, verifyPassword, encodeSession, decodeSession, hasRole, isStaff,
  type SessionUser,
} from "@/lib/auth-core";

const owner: SessionUser = { id: "1", email: "o@x.com", name: "O", role: "owner" };
const member: SessionUser = { id: "2", email: "m@x.com", name: "M", role: "member" };

describe("auth-core: passwords", () => {
  it("verifies a correct password", () => {
    const h = hashPassword("hunter2!");
    expect(verifyPassword("hunter2!", h)).toBe(true);
  });
  it("rejects a wrong password", () => {
    const h = hashPassword("hunter2!");
    expect(verifyPassword("wrong", h)).toBe(false);
  });
  it("rejects missing/garbage hashes", () => {
    expect(verifyPassword("x", null)).toBe(false);
    expect(verifyPassword("x", "garbage")).toBe(false);
  });
  it("produces a unique salt per hash", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });
});

describe("auth-core: session tokens", () => {
  it("round-trips a session", () => {
    const token = encodeSession(owner);
    expect(decodeSession(token)).toEqual(owner);
  });
  it("rejects a tampered token", () => {
    const token = encodeSession(owner) + "x";
    expect(decodeSession(token)).toBeNull();
  });
  it("rejects a forged payload (bad signature)", () => {
    const forged = Buffer.from(JSON.stringify({ ...owner, role: "owner" })).toString("base64url") + ".deadbeef";
    expect(decodeSession(forged)).toBeNull();
  });
  it("rejects empty/garbage", () => {
    expect(decodeSession(undefined)).toBeNull();
    expect(decodeSession("nope")).toBeNull();
  });
});

describe("auth-core: roles", () => {
  it("enforces the role hierarchy", () => {
    expect(hasRole(owner, "owner")).toBe(true);
    expect(hasRole(owner, "editor")).toBe(true);
    expect(hasRole(member, "contributor")).toBe(false);
    expect(hasRole(member, "member")).toBe(true);
    expect(hasRole(null, "member")).toBe(false);
  });
  it("distinguishes staff from members", () => {
    expect(isStaff(owner)).toBe(true);
    expect(isStaff(member)).toBe(false);
    expect(isStaff(null)).toBe(false);
  });
});
