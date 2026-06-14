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

export async function tagItems(tagId: string, opts?: { publishedOnly?: boolean }) {
  const links = await prisma.itemTag.findMany({
    where: { tagId },
    include: { item: { include: itemInclude } },
  });
  return links
    .map((l) => l.item)
    .filter((it) => (opts?.publishedOnly ? it.status === "published" : true))
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
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
