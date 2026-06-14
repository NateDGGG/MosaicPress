import * as cheerio from "cheerio";
import { assertSafeUrl } from "./ingest";

// Book import: turn a book link (Amazon, Open Library, Goodreads, Google Books,
// publisher sites…) into a normalized book draft with cover, info, and an
// "about" description — enriched from Open Library. Throws if the link doesn't
// resolve to a book so the admin can show a clear error.

const UA = "MosaicBot/0.1 (+book import)";
const TIMEOUT = 9000;

async function timed(url: URL, accept = "text/html,application/json;q=0.9,*/*"): Promise<Response | null> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT);
  try {
    return await fetch(url, { signal: c.signal, redirect: "follow", headers: { "User-Agent": UA, Accept: accept } });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const isbn10 = (s: string) => /^\d{9}[\dX]$/i.test(s);
const isbn13 = (s: string) => /^97[89]\d{10}$/.test(s);
const normIsbn = (s: string) => s.replace(/[-\s]/g, "").toUpperCase();

function isbnFromUrl(url: URL): string | null {
  const p = url.pathname;
  // Amazon/B&N book pages: the ASIN in /dp/ or /gp/product/ is the ISBN-10 for books.
  let m = p.match(/\/(?:dp|gp\/product|product)\/([0-9X]{10})(?:[/?]|$)/i);
  if (m && isbn10(m[1])) return normIsbn(m[1]);
  // any ISBN-13/10 embedded in the path
  m = p.match(/(97[89]\d{10}|\d{9}[\dX])/i);
  if (m) {
    const v = normIsbn(m[1]);
    if (isbn13(v) || isbn10(v)) return v;
  }
  return null;
}

function yearOf(s?: string): number | undefined {
  if (!s) return undefined;
  const m = String(s).match(/\d{4}/);
  return m ? parseInt(m[0]) : undefined;
}

interface BookData {
  title: string;
  authors: string[];
  description?: string;
  coverImage?: string;
  isbn?: string;
  pageCount?: number;
  publishedYear?: number;
  publisher?: string;
}

async function openLibraryByIsbn(isbn: string): Promise<BookData | null> {
  const dataUrl = await assertSafeUrl(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
  const res = await timed(dataUrl, "application/json");
  if (!res || !res.ok) return null;
  const j: any = await res.json();
  const b = j[`ISBN:${isbn}`];
  if (!b || !b.title) return null;

  let description: string | undefined;
  // Pull an "about" blurb from the work record (best effort).
  const dRes = await timed(await assertSafeUrl(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`), "application/json").catch(() => null);
  if (dRes && dRes.ok) {
    const dj: any = await dRes.json();
    const det = dj[`ISBN:${isbn}`]?.details || {};
    const ed = typeof det.description === "string" ? det.description : det.description?.value;
    if (ed && ed.length > 40) description = ed;
    const workKey = det.works?.[0]?.key;
    if (!description && workKey) {
      const wRes = await timed(await assertSafeUrl(`https://openlibrary.org${workKey}.json`), "application/json").catch(() => null);
      if (wRes && wRes.ok) {
        const wj: any = await wRes.json();
        description = typeof wj.description === "string" ? wj.description : wj.description?.value;
      }
    }
  }

  return {
    title: b.subtitle ? `${b.title}: ${b.subtitle}` : b.title,
    authors: (b.authors || []).map((a: any) => a.name).filter(Boolean),
    coverImage: b.cover?.large || b.cover?.medium,
    isbn,
    pageCount: b.number_of_pages,
    publishedYear: yearOf(b.publish_date),
    publisher: (b.publishers || [])[0]?.name,
    description,
  };
}

async function openLibrarySearch(query: string): Promise<BookData | null> {
  const u = await assertSafeUrl(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`);
  const res = await timed(u, "application/json");
  if (!res || !res.ok) return null;
  const j: any = await res.json();
  const d = j.docs?.[0];
  if (!d || !d.title) return null;
  const isbn = (d.isbn || [])[0];
  if (isbn) {
    const byIsbn = await openLibraryByIsbn(normIsbn(isbn));
    if (byIsbn) return byIsbn;
  }
  return {
    title: d.title,
    authors: d.author_name || [],
    coverImage: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : undefined,
    isbn: isbn ? normIsbn(isbn) : undefined,
    publishedYear: d.first_publish_year,
  };
}

// Parse OG / JSON-LD from the page for book signals + a description fallback.
function parsePage(html: string, url: URL) {
  const $ = cheerio.load(html);
  const meta = (s: string) => $(s).attr("content")?.trim();
  let isBook = false;
  const ogType = meta('meta[property="og:type"]');
  if (ogType && /book/i.test(ogType)) isBook = true;

  let ldIsbn: string | undefined;
  let ldDesc: string | undefined;
  let ldTitle: string | undefined;
  let ldAuthors: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text());
      for (const o of Array.isArray(parsed) ? parsed : [parsed]) {
        const t = o["@type"];
        const isBookType = t === "Book" || (Array.isArray(t) && t.includes("Book"));
        if (isBookType) {
          isBook = true;
          ldTitle = o.name || ldTitle;
          ldIsbn = o.isbn || ldIsbn;
          ldDesc = (typeof o.description === "string" ? o.description : undefined) || ldDesc;
          const a = o.author;
          if (a) ldAuthors = (Array.isArray(a) ? a : [a]).map((x: any) => x?.name || x).filter(Boolean);
        }
      }
    } catch {}
  });

  const metaIsbn = ldIsbn || meta('meta[property="book:isbn"]') || meta('meta[property="books:isbn"]') || meta('meta[itemprop="isbn"]');
  if (metaIsbn) isBook = true;
  const host = url.hostname.replace(/^www\./, "");
  if (/(goodreads\.com|openlibrary\.org|books\.google\.|bookshop\.org|barnesandnoble\.com\/w\/|penguinrandomhouse|harpercollins)/.test(url.href)) isBook = true;

  return {
    isBook,
    isbn: metaIsbn ? normIsbn(String(metaIsbn)) : undefined,
    title: ldTitle || meta('meta[property="og:title"]') || $("title").first().text().trim() || undefined,
    description: ldDesc || meta('meta[property="og:description"]') || meta('meta[name="description"]'),
    coverImage: meta('meta[property="og:image"]'),
    authors: ldAuthors,
  };
}

export interface BookDraft {
  type: "book";
  source: "external";
  title: string;
  summary?: string;
  coverImage?: string;
  author?: string;
  book: {
    isbn?: string;
    authors: string[];
    description?: string;
    pageCount?: number;
    publishedYear?: number;
    publisher?: string;
    buyUrl: string;
    sourceName?: string;
    sourceDomain?: string;
  };
}

export async function importBook(raw: string): Promise<BookDraft> {
  const url = await assertSafeUrl(raw);
  const host = url.hostname.replace(/^www\./, "");

  // 1) ISBN straight from the URL (Amazon ASIN = ISBN-10 for books).
  let ol: BookData | null = null;
  const urlIsbn = isbnFromUrl(url);
  if (urlIsbn) ol = await openLibraryByIsbn(urlIsbn);

  // 2) Read the page for OG/JSON-LD signals + description fallback.
  let page: ReturnType<typeof parsePage> | null = null;
  const res = await timed(url);
  if (res && res.ok) {
    const html = await res.text();
    if (html) page = parsePage(html, url);
  }

  // 3) If still no structured data, try ISBN/title from the page.
  if (!ol && page?.isbn) ol = await openLibraryByIsbn(page.isbn);
  if (!ol && page?.title && (page.isBook || urlIsbn)) ol = await openLibrarySearch(`${page.title} ${page.authors?.[0] || ""}`.trim());

  // Decide whether this is really a book.
  const looksLikeBook = !!ol || !!page?.isBook || !!urlIsbn;
  if (!looksLikeBook) {
    throw new Error("This doesn't look like a book link. Try an Amazon book page, Open Library, Goodreads, Google Books, or a publisher's book page.");
  }

  const title = ol?.title || page?.title;
  if (!title) {
    throw new Error("Couldn't read the book's details from that link. Try a different book link (e.g. Open Library or Amazon).");
  }

  const authors = (ol?.authors?.length ? ol.authors : page?.authors) || [];
  const description = ol?.description || page?.description;
  const coverImage = ol?.coverImage || page?.coverImage;
  const nice = host.split(".")[0];

  return {
    type: "book",
    source: "external",
    title,
    summary: authors.length ? `by ${authors.join(", ")}` : undefined,
    coverImage,
    author: authors[0],
    book: {
      isbn: ol?.isbn || page?.isbn,
      authors,
      description,
      pageCount: ol?.pageCount,
      publishedYear: ol?.publishedYear,
      publisher: ol?.publisher,
      buyUrl: url.toString(),
      sourceName: nice.charAt(0).toUpperCase() + nice.slice(1),
      sourceDomain: host,
    },
  };
}
