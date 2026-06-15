import { parseAttributes, type FieldDef } from "./fields";

type AnyItem = {
  type: string; title: string; slug: string; summary?: string | null; coverImage?: string | null;
  author?: string | null; publishedAt?: Date | string | null; attributes?: string | null;
  presenter?: { name?: string | null } | null;
  productMeta?: { priceCents?: number | null; currency?: string | null } | null;
};

const TYPE_MAP: Record<string, string> = {
  article: "Article", blog: "BlogPosting", product: "Product", video: "VideoObject", book: "Book", link: "WebPage",
};

// Build a schema.org JSON-LD object for an item. Custom fields with a schemaProp
// are merged in, so owners can describe any domain (recipes, events, products…).
export function buildItemJsonLd(item: AnyItem, defs: FieldDef[] | undefined, opts: { siteName: string; url?: string }): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": TYPE_MAP[item.type] || "WebPage",
    name: item.title,
    headline: item.title,
  };
  if (item.summary) ld.description = item.summary;
  if (item.coverImage) ld.image = item.coverImage;
  if (opts.url) ld.url = opts.url;
  if (item.publishedAt) ld.datePublished = new Date(item.publishedAt).toISOString();
  const authorName = item.presenter?.name || item.author;
  if (authorName) ld.author = { "@type": "Person", name: authorName };
  ld.publisher = { "@type": "Organization", name: opts.siteName };
  if (item.type === "product" && item.productMeta?.priceCents != null) {
    ld.offers = {
      "@type": "Offer",
      price: (item.productMeta.priceCents / 100).toFixed(2),
      priceCurrency: item.productMeta.currency || "USD",
    };
  }
  // Merge owner-mapped custom fields.
  const attrs = parseAttributes(item.attributes);
  for (const f of defs || []) {
    if (f.schemaProp && attrs[f.key] != null && attrs[f.key] !== "") {
      ld[f.schemaProp] = attrs[f.key];
    }
  }
  return ld;
}
