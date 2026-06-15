import { prisma } from "./db";
import { itemInclude, slugify } from "./items";

// Presenters (hosts) and topics (tags) — the taxonomy layer Mosaic Learn adds
// on top of Mosaic to feel like a PragerU-style catalog.

export async function listPresenters() {
  return prisma.presenter.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function getPresenterBySlug(slug: string) {
  return prisma.presenter.findUnique({ where: { slug } });
}

export async function presenterItems(presenterId: string, opts?: { publishedOnly?: boolean }) {
  return prisma.item.findMany({
    where: { presenterId, ...(opts?.publishedOnly ? { status: "published" } : {}) },
    include: itemInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function listTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({ where: { slug } });
}

export async function tagItems(
  tagId: string,
  opts?: { publishedOnly?: boolean; sortMode?: string }
) {
  const sortMode = opts?.sortMode || "newest";
  const links = await prisma.itemTag.findMany({
    where: { tagId },
    include: { item: { include: itemInclude } },
    ...(sortMode === "manual" ? { orderBy: { position: "asc" } } : {}),
  });
  const items = links
    .map((l) => l.item)
    .filter((it) => (opts?.publishedOnly ? it.status === "published" : true));
  if (sortMode === "newest") {
    items.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
  } else if (sortMode === "oldest") {
    items.sort((a, b) => (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0));
  }
  // manual: preserve link order (already ordered by position)
  return items;
}

// Update a topic's intro copy and/or its sort mode.
export async function setTopicMeta(
  id: string,
  data: { intro?: string; sortMode?: string }
) {
  const patch: { intro?: string; sortMode?: string } = {};
  if (typeof data.intro === "string") patch.intro = data.intro;
  if (typeof data.sortMode === "string" && ["newest", "oldest", "manual"].includes(data.sortMode)) {
    patch.sortMode = data.sortMode;
  }
  return prisma.tag.update({ where: { id }, data: patch });
}

// Persist a manual ordering of a topic's items (array of itemIds in order).
export async function reorderTopicItems(tagId: string, itemIds: string[]) {
  await Promise.all(
    itemIds.map((itemId, i) =>
      prisma.itemTag.updateMany({ where: { tagId, itemId }, data: { position: i } })
    )
  );
}

// Items related to the given one — shared topics and/or same presenter, ranked.
type RelItem = { id: string; presenterId: string | null; tags: { tagId: string }[] };
export async function relatedItems(item: RelItem, limit = 6) {
  const tagIds = item.tags.map((t) => t.tagId);
  const presenterId = item.presenterId;
  if (tagIds.length === 0 && !presenterId) return [];
  const or: any[] = [];
  if (tagIds.length) or.push({ tags: { some: { tagId: { in: tagIds } } } });
  if (presenterId) or.push({ presenterId });
  const candidates = await prisma.item.findMany({
    where: { status: "published", id: { not: item.id }, OR: or },
    include: itemInclude,
    take: limit * 4,
  });
  return candidates
    .map((c) => {
      let score = 0;
      if (presenterId && c.presenterId === presenterId) score += 2;
      score += c.tags.filter((t) => tagIds.includes(t.tagId)).length;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score || (b.c.publishedAt?.getTime() ?? 0) - (a.c.publishedAt?.getTime() ?? 0))
    .slice(0, limit)
    .map((s) => s.c);
}

// The natural "up next" item: next in a collection this item belongs to,
// else the next item in its primary topic's order.
type NextSrc = { id: string; tags: { tagId: string }[] };
export async function nextItem(item: NextSrc) {
  const ci = await prisma.collectionItem.findFirst({
    where: { itemId: item.id },
    include: { collection: true },
  });
  if (ci) {
    const siblings = await prisma.collectionItem.findMany({
      where: { collectionId: ci.collectionId },
      orderBy: { position: "asc" },
      include: { item: { include: itemInclude } },
    });
    const idx = siblings.findIndex((sb) => sb.itemId === item.id);
    for (let j = idx + 1; j < siblings.length; j++) {
      if (siblings[j].item.status === "published") {
        return { item: siblings[j].item, label: `Next in ${ci.collection.title}` };
      }
    }
  }
  const primaryTagId = item.tags[0]?.tagId;
  if (primaryTagId) {
    const tag = await prisma.tag.findUnique({ where: { id: primaryTagId } });
    const ordered = await tagItems(primaryTagId, { publishedOnly: true, sortMode: tag?.sortMode });
    const idx = ordered.findIndex((i) => i.id === item.id);
    if (idx >= 0 && idx + 1 < ordered.length) {
      return { item: ordered[idx + 1], label: `Next in ${tag?.name}` };
    }
  }
  return null;
}

export async function uniquePresenterSlug(name: string) {
  const root = slugify(name);
  let slug = root;
  let n = 1;
  while (await prisma.presenter.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

export async function ensureTag(name: string) {
  const slug = slugify(name);
  return prisma.tag.upsert({ where: { slug }, update: {}, create: { slug, name } });
}

// The default topic — content with no topic falls under it. Created on demand
// if one hasn't been designated yet.
export async function getDefaultTag() {
  const existing = await prisma.tag.findFirst({ where: { isDefault: true } });
  if (existing) return existing;
  return prisma.tag.upsert({
    where: { slug: "general" },
    update: { isDefault: true },
    create: { slug: "general", name: "General", isDefault: true },
  });
}

// Replace an item's topics. If none are given, the item is assigned the default
// topic so nothing is ever left untagged.
export async function setItemTags(itemId: string, tagIds: string[]) {
  await prisma.itemTag.deleteMany({ where: { itemId } });
  let ids = tagIds.filter(Boolean);
  if (ids.length === 0) ids = [(await getDefaultTag()).id];
  await prisma.itemTag.createMany({ data: ids.map((tagId) => ({ itemId, tagId })) });
}

export async function renameTag(id: string, name: string) {
  return prisma.tag.update({ where: { id }, data: { name } });
}

// Make a tag the default (only one at a time).
export async function setDefaultTag(id: string) {
  await prisma.tag.updateMany({ data: { isDefault: false } });
  return prisma.tag.update({ where: { id }, data: { isDefault: true } });
}

// Delete a topic. The default can't be deleted; items left with no topic are
// reassigned to the default.
export async function deleteTag(id: string) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) return;
  if (tag.isDefault) throw new Error("The default topic can't be deleted.");
  const def = await getDefaultTag();
  const links = await prisma.itemTag.findMany({ where: { tagId: id } });
  for (const l of links) {
    const count = await prisma.itemTag.count({ where: { itemId: l.itemId } });
    if (count <= 1) {
      await prisma.itemTag
        .create({ data: { itemId: l.itemId, tagId: def.id } })
        .catch(() => {});
    }
  }
  await prisma.tag.delete({ where: { id } }); // cascades remaining ItemTag rows
}

// Backfill: assign the default topic to any items that currently have none.
export async function assignDefaultToUntagged() {
  const def = await getDefaultTag();
  const untagged = await prisma.item.findMany({ where: { tags: { none: {} } }, select: { id: true } });
  if (untagged.length > 0) {
    await prisma.itemTag.createMany({ data: untagged.map((i) => ({ itemId: i.id, tagId: def.id })) });
  }
  return untagged.length;
}

// Topics flagged to appear on the home page.
export async function homeTags() {
  return prisma.tag.findMany({ where: { showOnHome: true }, orderBy: { name: "asc" } });
}

export async function setShowOnHome(id: string, value: boolean) {
  return prisma.tag.update({ where: { id }, data: { showOnHome: value } });
}
