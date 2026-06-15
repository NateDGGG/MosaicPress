import { prisma } from "./db";
import { itemInclude, slugify } from "./items";

// Collections = curated, ordered sets of items. Surfaced to learners as
// "Learning paths": a sequence to work through on a subject.

export async function uniqueCollectionSlug(base: string): Promise<string> {
  const root = slugify(base);
  let slug = root;
  let n = 1;
  while (await prisma.collection.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

// List with enough to render index cards (published item count + a cover).
export async function listCollections() {
  return prisma.collection.findMany({
    orderBy: { createdAt: "asc" },
    include: { items: { include: { item: { select: { id: true, status: true, coverImage: true } } } } },
  });
}

export async function getCollection(slug: string) {
  return prisma.collection.findUnique({
    where: { slug },
    include: { items: { orderBy: { position: "asc" }, include: { item: { include: itemInclude } } } },
  });
}

export async function getCollectionById(id: string) {
  return prisma.collection.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" }, include: { item: { include: itemInclude } } } },
  });
}

export async function createCollection(title: string) {
  const slug = await uniqueCollectionSlug(title);
  return prisma.collection.create({ data: { title, slug } });
}

export async function updateCollection(
  id: string,
  data: { title?: string; description?: string; coverImage?: string; layout?: string }
) {
  const patch: Record<string, string> = {};
  if (typeof data.title === "string" && data.title.trim()) patch.title = data.title.trim();
  if (typeof data.description === "string") patch.description = data.description;
  if (typeof data.coverImage === "string") patch.coverImage = data.coverImage;
  if (typeof data.layout === "string") patch.layout = data.layout;
  return prisma.collection.update({ where: { id }, data: patch });
}

export async function deleteCollection(id: string) {
  return prisma.collection.delete({ where: { id } }); // cascades CollectionItem
}

export async function addCollectionItem(collectionId: string, itemId: string) {
  const existing = await prisma.collectionItem.findUnique({
    where: { collectionId_itemId: { collectionId, itemId } },
  });
  if (existing) return existing;
  const last = await prisma.collectionItem.findFirst({
    where: { collectionId },
    orderBy: { position: "desc" },
  });
  return prisma.collectionItem.create({
    data: { collectionId, itemId, position: (last?.position ?? -1) + 1 },
  });
}

export async function removeCollectionItem(collectionId: string, itemId: string) {
  return prisma.collectionItem
    .delete({ where: { collectionId_itemId: { collectionId, itemId } } })
    .catch(() => null);
}

export async function reorderCollection(collectionId: string, itemIds: string[]) {
  await Promise.all(
    itemIds.map((itemId, i) =>
      prisma.collectionItem.updateMany({ where: { collectionId, itemId }, data: { position: i } })
    )
  );
}
