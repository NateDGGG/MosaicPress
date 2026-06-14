import { PrismaClient } from "@prisma/client";
import path from "node:path";

// Resolve a relative sqlite `file:` URL to an ABSOLUTE path based on the running
// process's working directory. Without this, a shared (hoisted) Prisma client in
// a monorepo resolves `file:./data/dev.db` relative to a fixed location, so every
// project would read the same database. Resolving per-cwd keeps each project's
// SQLite db isolated. (Postgres/other URLs pass through unchanged.)
function resolveDatabaseUrl(): string | undefined {
  const u = process.env.DATABASE_URL;
  if (!u) return undefined;
  if (u.startsWith("file:")) {
    const file = u.slice("file:".length);
    if (!path.isAbsolute(file)) return "file:" + path.resolve(process.cwd(), file);
  }
  return u;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const url = resolveDatabaseUrl();
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
