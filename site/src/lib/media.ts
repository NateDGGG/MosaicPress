import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Pluggable media storage. Local filesystem is the default; set MEDIA_BACKEND=s3
// (plus S3_* env) to store on S3 or any S3-compatible service (R2, MinIO, Spaces).
// Both backends share the StorageBackend contract, so callers don't care which
// is active — this is the storage boundary from the design doc.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
]);

export function isAllowedMime(mime: string): boolean {
  return ALLOWED.has(mime);
}

export interface StoredFile {
  url: string;
  filename: string;
  size: number;
}

interface StorageBackend {
  store(buffer: Buffer, mime: string, originalName: string): Promise<StoredFile>;
}

function extFor(mime: string, original: string): string {
  const fromName = path.extname(original);
  if (fromName) return fromName.toLowerCase();
  const map: Record<string, string> = {
    "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif",
    "image/webp": ".webp", "image/svg+xml": ".svg", "application/pdf": ".pdf",
  };
  return map[mime] || "";
}

function makeFilename(mime: string, originalName: string): string {
  const id = crypto.randomBytes(8).toString("hex");
  const safeBase =
    path.basename(originalName, path.extname(originalName)).replace(/[^a-z0-9-_]+/gi, "-").slice(0, 40) || "file";
  return `${Date.now()}-${id}-${safeBase}${extFor(mime, originalName)}`;
}

// ---- Local filesystem backend (default) ----
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const localBackend: StorageBackend = {
  async store(buffer, mime, originalName) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filename = makeFilename(mime, originalName);
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
    return { url: `/uploads/${filename}`, filename, size: buffer.length };
  },
};

// ---- S3 / S3-compatible backend ----
let _s3: S3Client | null = null;
function s3Client(): S3Client {
  if (_s3) return _s3;
  _s3 = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT || undefined, // set for R2/MinIO/Spaces
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }
        : undefined,
  });
  return _s3;
}

const s3Backend: StorageBackend = {
  async store(buffer, mime, originalName) {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new Error("S3_BUCKET is not configured.");
    const prefix = (process.env.S3_PREFIX || "uploads").replace(/^\/+|\/+$/g, "");
    const filename = makeFilename(mime, originalName);
    const key = `${prefix}/${filename}`;
    await s3Client().send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: mime })
    );
    // Public URL: explicit base (CDN/endpoint) or the default virtual-hosted URL.
    const base =
      process.env.S3_PUBLIC_URL ||
      (process.env.S3_ENDPOINT
        ? `${process.env.S3_ENDPOINT.replace(/\/$/, "")}/${bucket}`
        : `https://${bucket}.s3.${process.env.S3_REGION || "us-east-1"}.amazonaws.com`);
    return { url: `${base.replace(/\/$/, "")}/${key}`, filename, size: buffer.length };
  },
};

export function activeBackend(): "local" | "s3" {
  return process.env.MEDIA_BACKEND === "s3" ? "s3" : "local";
}

export async function storeFile(buffer: Buffer, mime: string, originalName: string): Promise<StoredFile> {
  const backend = activeBackend() === "s3" ? s3Backend : localBackend;
  return backend.store(buffer, mime, originalName);
}
