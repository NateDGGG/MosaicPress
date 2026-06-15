import { ingestUrl } from "./ingest";
import { importBook } from "./books";
import { createFromBookDraft, createFromDraft } from "./items";

// Bulk import: take a list of URLs, classify each (book vs. article/video/
// product/link), and create a draft Item of the right type for each one.

function bookish(u: string): boolean {
  try {
    const url = new URL(u);
    return (
      /(amazon\.|goodreads\.com|openlibrary\.org|books\.google\.|bookshop\.org|barnesandnoble\.com\/w\/)/.test(url.href) ||
      /\/(dp|gp\/product)\//.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function parseUrlList(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//i.test(s))
    )
  );
}

const FORCEABLE = ["article", "video", "product", "link"] as const;

// Build a bare "link" draft from a URL when ingestion fails but the user
// explicitly wants a link.
function minimalLinkDraft(u: string) {
  const url = new URL(u);
  const domain = url.hostname.replace(/^www\./, "");
  return {
    type: "link" as const,
    source: "external" as const,
    title: domain + (url.pathname !== "/" ? url.pathname : ""),
    external: {
      url: u,
      sourceDomain: domain,
      sourceName: domain.charAt(0).toUpperCase() + domain.slice(1),
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      embedAllowed: false,
      adapter: "manual",
    },
    link: { url: u },
  };
}

export interface BulkResult {
  url: string;
  ok: boolean;
  type?: string;
  title?: string;
  id?: string;
  error?: string;
}

export async function bulkImport(urls: string[], forceType?: string): Promise<BulkResult[]> {
  const force = forceType && (FORCEABLE as readonly string[]).includes(forceType) ? forceType : null;
  const out: BulkResult[] = [];
  for (const url of urls) {
    try {
      // Auto mode only: try a book first for book-ish links.
      if (!force && bookish(url)) {
        try {
          const bd = await importBook(url);
          const item = await createFromBookDraft(bd);
          out.push({ url, ok: true, type: "book", title: item.title, id: item.id });
          continue;
        } catch {
          // not actually a book — fall through
        }
      }
      let draft;
      try {
        draft = await ingestUrl(url);
      } catch (e) {
        // If the user forced "link", a bare link is fine even when ingestion fails.
        if (force === "link") draft = minimalLinkDraft(url) as Awaited<ReturnType<typeof ingestUrl>>;
        else throw e;
      }
      if (force) (draft as { type: string }).type = force;
      const item = await createFromDraft(draft);
      out.push({ url, ok: true, type: item.type, title: item.title, id: item.id });
    } catch (e) {
      out.push({ url, ok: false, error: e instanceof Error ? e.message : "Failed to import." });
    }
  }
  return out;
}
