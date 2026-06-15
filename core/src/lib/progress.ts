import { prisma } from "./db";
import { itemInclude } from "./items";
import type { Learner } from "./learner";

// Per-learner learning state: bookmarks ("saved") and completion. A learner is
// either a signed-in user or an anonymous device — see lib/learner.ts.

// Filter for findMany/findFirst queries.
function where(l: Learner): { userId: string } | { anonId: string } {
  return l.kind === "user" ? { userId: l.userId } : { anonId: l.anonId };
}

// Compound-unique selector for findUnique/upsert.
function uniqueWhere(l: Learner, itemId: string) {
  return l.kind === "user"
    ? { userId_itemId: { userId: l.userId, itemId } }
    : { anonId_itemId: { anonId: l.anonId, itemId } };
}

export async function getProgress(learner: Learner, itemId: string) {
  return prisma.itemProgress.findUnique({ where: uniqueWhere(learner, itemId) });
}

export async function setProgress(
  learner: Learner,
  itemId: string,
  data: { saved?: boolean; completed?: boolean }
) {
  const patch: { saved?: boolean; completed?: boolean } = {};
  if (typeof data.saved === "boolean") patch.saved = data.saved;
  if (typeof data.completed === "boolean") patch.completed = data.completed;
  return prisma.itemProgress.upsert({
    where: uniqueWhere(learner, itemId),
    create: { ...where(learner), itemId, ...patch },
    update: patch,
  });
}

async function itemsFor(learner: Learner, filter: { saved?: boolean; completed?: boolean }) {
  const rows = await prisma.itemProgress.findMany({
    where: { ...where(learner), ...filter },
    orderBy: { updatedAt: "desc" },
    include: { item: { include: itemInclude } },
  });
  return rows.map((r) => r.item).filter((it) => it.status === "published");
}

export async function listSaved(learner: Learner) {
  return itemsFor(learner, { saved: true });
}

export async function listCompleted(learner: Learner) {
  return itemsFor(learner, { completed: true });
}

// Set of itemIds the learner has marked completed (for path progress).
export async function completedItemIds(learner: Learner): Promise<Set<string>> {
  const rows = await prisma.itemProgress.findMany({
    where: { ...where(learner), completed: true },
    select: { itemId: true },
  });
  return new Set(rows.map((r) => r.itemId));
}

// On login, fold any anonymous device progress into the user's record, then drop
// the anonymous rows. saved/completed are OR-merged (a true on either side wins).
export async function mergeAnonProgress(userId: string, anonId: string) {
  const anonRows = await prisma.itemProgress.findMany({ where: { anonId } });
  for (const r of anonRows) {
    await prisma.itemProgress.upsert({
      where: { userId_itemId: { userId, itemId: r.itemId } },
      create: { userId, itemId: r.itemId, saved: r.saved, completed: r.completed },
      update: { saved: r.saved || undefined, completed: r.completed || undefined },
    });
  }
  await prisma.itemProgress.deleteMany({ where: { anonId } });
  return anonRows.length;
}
