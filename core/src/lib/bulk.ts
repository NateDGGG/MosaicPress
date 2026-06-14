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

export interface BulkResult {
  url: string;
  ok: boolean;
  type?: string;
  title?: string;
  id?: string;
  error?: string;
}

export async function bulkImport(urls: string[]): Promise<BulkResult[]> {
  const out: BulkResult[] = [];
  for (const url of urls) {
    try {
      // Try a book first for book-ish links; fall back to general ingestion.
      if (bookish(url)) {
        try {
          const bd = await importBook(url);
          const item = await createFromBookDraft(bd);
          out.push({ url, ok: true, type: "book", title: item.title, id: item.id });
          continue;
        } catch {
          // not actually a book — fall through
        }
      }
      const draft = await ingestUrl(url);
      const item = await createFromDraft(draft);
      out.push({ url, ok: true, type: item.type, title: item.title, id: item.id });
    } catch (e) {
      out.push({ url, ok: false, error: e instanceof Error ? e.message : "Failed to import." });
    }
  }
  return out;
}
