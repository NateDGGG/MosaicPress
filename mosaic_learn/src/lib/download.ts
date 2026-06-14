import crypto from "node:crypto";

// Signed, order-scoped download links for digital products. The token is an
// HMAC over order+item, so links can't be guessed or shared to unlock other
// products. Verified again at the /api/download endpoint against order status.

const SECRET = process.env.SESSION_SECRET || "dev-insecure-secret";

export function signDownload(orderId: string, itemId: string): string {
  return crypto.createHmac("sha256", SECRET).update(`${orderId}:${itemId}`).digest("base64url");
}

export function verifyDownload(orderId: string, itemId: string, token: string): boolean {
  const expected = signDownload(orderId, itemId);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function downloadUrl(orderId: string, itemId: string, base?: string): string {
  const root = base || process.env.APP_URL || "http://localhost:3000";
  const token = signDownload(orderId, itemId);
  return `${root}/api/download?order=${orderId}&item=${itemId}&token=${token}`;
}
