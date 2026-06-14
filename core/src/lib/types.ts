// Allowed values for the String "enum" columns (SQLite has no native enums).

export const ITEM_TYPES = ["article", "video", "product", "link", "book"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const SOURCES = ["hosted", "external"] as const;
export type Source = (typeof SOURCES)[number];

export const STATUSES = ["draft", "scheduled", "published"] as const;
export type Status = (typeof STATUSES)[number];

export const SYNC_STATUSES = ["ok", "stale", "broken", "paywalled"] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

export function isItemType(v: unknown): v is ItemType {
  return typeof v === "string" && (ITEM_TYPES as readonly string[]).includes(v);
}
export function isSource(v: unknown): v is Source {
  return typeof v === "string" && (SOURCES as readonly string[]).includes(v);
}

// Shape returned by the ingestion pipeline — a normalized draft for any URL.
export interface NormalizedDraft {
  type: ItemType;
  source: "external";
  title: string;
  summary?: string;
  coverImage?: string;
  author?: string;
  external: {
    url: string;
    canonicalUrl?: string;
    sourceName?: string;
    sourceDomain?: string;
    favicon?: string;
    embedHtml?: string;
    embedAllowed: boolean;
    adapter: string;
  };
  video?: { playerUrl?: string; duration?: number };
  product?: { priceCents?: number; currency?: string; buyUrl?: string };
  link?: { url: string };
}

export const TYPE_LABELS: Record<ItemType, string> = {
  article: "Article",
  video: "Video",
  product: "Product",
  link: "Link",
  book: "Book",
};

// Human-friendly action label for a card/page given type + source.
export function actionLabel(type: ItemType, source: Source, sourceName?: string | null): string {
  if (source === "hosted") {
    switch (type) {
      case "article": return "Read";
      case "video": return "Watch";
      case "product": return "Buy";
      case "link": return "Open";
      case "book": return "Read";
    }
  }
  const where = sourceName || "source";
  switch (type) {
    case "article": return `Read on ${where}`;
    case "video": return `Watch on ${where}`;
    case "product": return `Buy on ${where}`;
    case "link": return `Open ${where}`;
    case "book": return `View on ${where}`;
  }
}
