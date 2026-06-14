import { prisma } from "./db";
import type { NormalizedDraft } from "./types";
import type { BookDraft } from "./books";

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

export async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base);
  let slug = root;
  let n = 1;
  // Loop until we find a free slug.
  while (await prisma.item.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

// Eager include used everywhere we render an Item.
export const itemInclude = {
  external: true,
  videoMeta: true,
  productMeta: true,
  linkMeta: true,
  bookMeta: true,
  presenter: true,
  tags: { include: { tag: true } },
} as const;

export type FullItem = Awaited<ReturnType<typeof getItemBySlug>>;

export async function getItemBySlug(slug: string) {
  return prisma.item.findUnique({ where: { slug }, include: itemInclude });
}

export async function getItemById(id: string) {
  return prisma.item.findUnique({ where: { id }, include: itemInclude });
}

export async function listItems(opts?: { publishedOnly?: boolean }) {
  return prisma.item.findMany({
    where: opts?.publishedOnly ? { status: "published" } : undefined,
    include: itemInclude,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

// Persist a normalized ingestion draft as a draft Item (+ external + type meta).
export async function createFromDraft(draft: NormalizedDraft) {
  const slug = await uniqueSlug(draft.title);
  return prisma.item.create({
    data: {
      slug,
      type: draft.type,
      source: "external",
      title: draft.title,
      summary: draft.summary,
      coverImage: draft.coverImage,
      author: draft.author,
      status: "draft",
      external: {
        create: {
          url: draft.external.url,
          canonicalUrl: draft.external.canonicalUrl,
          sourceName: draft.external.sourceName,
          sourceDomain: draft.external.sourceDomain,
          favicon: draft.external.favicon,
          embedHtml: draft.external.embedHtml,
          embedAllowed: draft.external.embedAllowed,
          adapter: draft.external.adapter,
        },
      },
      videoMeta:
        draft.type === "video"
          ? { create: { playerUrl: draft.video?.playerUrl, duration: draft.video?.duration } }
          : undefined,
      productMeta:
        draft.type === "product"
          ? {
              create: {
                priceCents: draft.product?.priceCents,
                currency: draft.product?.currency || "USD",
                buyUrl: draft.product?.buyUrl || draft.external.url,
                priceCheckedAt: new Date(),
              },
            }
          : undefined,
      linkMeta:
        draft.type === "link"
          ? { create: { url: draft.link?.url || draft.external.url } }
          : undefined,
    },
    include: itemInclude,
  });
}

export function priceFormat(cents?: number | null, currency = "USD"): string | null {
  if (cents == null) return null;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export function durationFormat(seconds?: number | null): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Persist a book draft (from importBook) as a published-ready book Item.
export async function createFromBookDraft(draft: BookDraft) {
  const slug = await uniqueSlug(draft.title);
  return prisma.item.create({
    data: {
      slug,
      type: "book",
      source: "external",
      title: draft.title,
      summary: draft.summary,
      coverImage: draft.coverImage,
      author: draft.author,
      status: "draft",
      external: {
        create: {
          url: draft.book.buyUrl,
          sourceName: draft.book.sourceName,
          sourceDomain: draft.book.sourceDomain,
          favicon: draft.book.sourceDomain
            ? `https://www.google.com/s2/favicons?domain=${draft.book.sourceDomain}&sz=64`
            : null,
          embedAllowed: false,
          adapter: "book",
        },
      },
      bookMeta: {
        create: {
          isbn: draft.book.isbn,
          authors: draft.book.authors.join(", ") || null,
          description: draft.book.description,
          pageCount: draft.book.pageCount,
          publishedYear: draft.book.publishedYear,
          publisher: draft.book.publisher,
          buyUrl: draft.book.buyUrl,
        },
      },
    },
    include: itemInclude,
  });
}
