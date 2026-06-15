import { prisma } from "./db";
import { itemInclude } from "./items";

// Per-user learning state: bookmarks ("saved") and completion. Available to any
// signed-in user regardless of role.

export async function getProgress(userId: string, itemId: string) {
  return prisma.itemProgress.findUnique({
    where: { userId_itemId: { userId, itemId } },
  });
}

export async function setProgress(
  userId: string,
  itemId: string,
  data: { saved?: boolean; completed?: boolean }
) {
  const patch: { saved?: boolean; completed?: boolean } = {};
  if (typeof data.saved === "boolean") patch.saved = data.saved;
  if (typeof data.completed === "boolean") patch.completed = data.completed;
  return prisma.itemProgress.upsert({
    where: { userId_itemId: { userId, itemId } },
    create: { userId, itemId, ...patch },
    update: patch,
  });
}

async function itemsFor(userId: string, where: { saved?: boolean; completed?: boolean }) {
  const rows = await prisma.itemProgress.findMany({
    where: { userId, ...where },
    orderBy: { updatedAt: "desc" },
    include: { item: { include: itemInclude } },
  });
  return rows.map((r) => r.item).filter((it) => it.status === "published");
}

export async function listSaved(userId: string) {
  return itemsFor(userId, { saved: true });
}

export async function listCompleted(userId: string) {
  return itemsFor(userId, { completed: true });
}

// Set of itemIds the user has marked completed (for path progress).
export async function completedItemIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.itemProgress.findMany({
    where: { userId, completed: true },
    select: { itemId: true },
  });
  return new Set(rows.map((r) => r.itemId));
}
