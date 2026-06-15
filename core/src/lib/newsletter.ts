import { prisma } from "./db";

const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export async function subscribe(email: string, name?: string, source?: string) {
  const e = email.trim().toLowerCase();
  if (!emailOk(e)) throw new Error("Please enter a valid email.");
  return prisma.subscriber.upsert({
    where: { email: e },
    update: { status: "subscribed", name: name?.trim() || undefined, source: source || undefined },
    create: { email: e, name: name?.trim() || null, source: source || null },
  });
}

export async function unsubscribe(email: string) {
  const e = email.trim().toLowerCase();
  return prisma.subscriber.updateMany({ where: { email: e }, data: { status: "unsubscribed" } });
}

export async function listSubscribers() {
  return prisma.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
}

export async function subscriberCounts() {
  const [total, active] = await Promise.all([
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { status: "subscribed" } }),
  ]);
  return { total, active };
}

export function toCsv(rows: { email: string; name: string | null; status: string; source: string | null; createdAt: Date }[]): string {
  const esc = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
  const head = "email,name,status,source,createdAt";
  const body = rows.map((r) => [r.email, r.name || "", r.status, r.source || "", r.createdAt.toISOString()].map(esc).join(",")).join("\n");
  return head + "\n" + body + "\n";
}
