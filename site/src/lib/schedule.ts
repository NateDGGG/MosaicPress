import { prisma } from "./db";

// Scheduled publishing. An Item with status "scheduled" and a future
// `publishedAt` stays hidden from the public site (which only lists "published").
// `publishDue` flips any whose time has arrived. Run it on a cron (every minute
// or few minutes); it's also invoked from the maintenance API.

export interface PublishDueResult {
  published: number;
  titles: string[];
}

export async function publishDue(now: Date = new Date()): Promise<PublishDueResult> {
  const due = await prisma.item.findMany({
    where: { status: "scheduled", publishedAt: { not: null, lte: now } },
    select: { id: true, title: true },
  });
  if (due.length > 0) {
    await prisma.item.updateMany({
      where: { id: { in: due.map((d) => d.id) } },
      data: { status: "published" },
    });
  }
  return { published: due.length, titles: due.map((d) => d.title) };
}

export async function countScheduled(): Promise<number> {
  return prisma.item.count({ where: { status: "scheduled" } });
}
