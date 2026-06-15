import { prisma } from "./db";
import { itemInclude } from "./items";
import { parseBlocks } from "./blocks";

// Full-text search over published items. Implemented as in-memory ranking so it
// is provider-agnostic (identical on SQLite and Postgres) and can search inside
// the JSON article body. For large catalogs, swap this for Postgres full-text
// search or a dedicated index — the `searchItems` signature stays the same.

export interface SearchHit {
  item: Awaited<ReturnType<typeof loadAll>>[number];
  score: number;
}

function loadAll() {
  return prisma.item.findMany({
    where: { status: "published" },
    include: itemInclude,
    orderBy: [{ publishedAt: "desc" }],
  });
}

// Plain text from an article's block body, for indexing.
function bodyText(body?: string | null): string {
  if (!body) return "";
  return parseBlocks(body)
    .map((b) => {
      if ("text" in b && b.text) return b.text;
      if (b.type === "list") return b.items.join(" ");
      return "";
    })
    .join(" ")
    // strip any inline HTML from rich-text blocks
    .replace(/<[^>]+>/g, " ");
}

export function scoreItem(item: any, terms: string[]): number {
  const title = (item.title || "").toLowerCase();
  const summary = (item.summary || "").toLowerCase();
  const author = (item.author || "").toLowerCase();
  const source = (item.external?.sourceName || "").toLowerCase();
  const body = bodyText(item.body).toLowerCase();
  const commentary = (item.commentary || "").toLowerCase();
  const attrs = (item.attributes || "").toLowerCase();

  let score = 0;
  for (const t of terms) {
    if (!t) continue;
    if (title.includes(t)) score += 10;
    if (title.startsWith(t)) score += 5;
    if (summary.includes(t)) score += 4;
    if (author.includes(t)) score += 3;
    if (source.includes(t)) score += 2;
    if (body.includes(t)) score += 1;
    if (commentary.includes(t)) score += 1;
    if (attrs.includes(t)) score += 1;
  }
  return score;
}

export async function searchItems(query: string, limit = 30) {
  const terms = query.toLowerCase().split(/\s+/).map((t) => t.trim()).filter(Boolean);
  if (terms.length === 0) return [];
  const all = await loadAll();
  return all
    .map((item) => ({ item, score: scoreItem(item, terms) }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
