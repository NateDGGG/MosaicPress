import * as cheerio from "cheerio";
import dns from "node:dns/promises";
import net from "node:net";
import type { ItemType, NormalizedDraft } from "./types";

// Use a realistic browser User-Agent. Many sites (WordPress + CDN/WAF, news
// sites, shops) serve unknown "bot" agents a 403 or a JS challenge page with no
// Open Graph tags, which would leave us with a title-only draft (no image or
// summary). A normal browser UA gets the real HTML with its meta tags.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 2_000_000; // 2 MB cap on fetched HTML

// ---------------------------------------------------------------------------
// SSRF protection: validate the URL and refuse to fetch private / internal
// addresses or non-HTTP(S) schemes. (§10 "Safe outbound fetching")
// ---------------------------------------------------------------------------
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    return v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  return false;
}

export async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed.");
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Refusing to fetch internal host.");
  }
  if (net.isIP(host) && isPrivateIp(host)) {
    throw new Error("Refusing to fetch private address.");
  }
  // Resolve DNS and ensure no record points at a private range.
  try {
    const records = await dns.lookup(host, { all: true });
    if (records.some((r) => isPrivateIp(r.address))) {
      throw new Error("Refusing to fetch host that resolves to a private address.");
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Refusing")) throw e;
    // DNS failure: let the fetch attempt surface a clearer error later.
  }
  return url;
}

async function safeFetch(url: URL): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Type detection from the URL.
// ---------------------------------------------------------------------------
function detectType(url: URL): ItemType {
  const h = url.hostname.replace(/^www\./, "").toLowerCase();
  const videoHosts = ["youtube.com", "youtu.be", "vimeo.com", "tiktok.com", "twitch.tv"];
  const shopHosts = ["amazon.", "etsy.com", "ebay.com", "shopify.com", "gumroad.com"];
  if (videoHosts.some((v) => h.includes(v))) return "video";
  if (shopHosts.some((s) => h.includes(s))) return "product";
  return "article"; // refined later from OG `og:type`
}

function domainName(url: URL): { domain: string; name: string } {
  const domain = url.hostname.replace(/^www\./, "");
  const base = domain.split(".")[0];
  const name = base.charAt(0).toUpperCase() + base.slice(1);
  return { domain, name };
}

// ---------------------------------------------------------------------------
// Adapter 1: oEmbed for well-known providers (video first-class).
// ---------------------------------------------------------------------------
function oembedEndpoint(url: URL): string | null {
  const h = url.hostname.replace(/^www\./, "");
  if (h.includes("youtube.com") || h.includes("youtu.be")) {
    return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url.toString())}`;
  }
  if (h.includes("vimeo.com")) {
    return `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url.toString())}`;
  }
  return null;
}

async function tryOEmbed(url: URL): Promise<NormalizedDraft | null> {
  const endpoint = oembedEndpoint(url);
  if (!endpoint) return null;
  try {
    const ep = await assertSafeUrl(endpoint);
    const res = await safeFetch(ep);
    if (!res.ok) return null;
    const data: any = await res.json();
    const { domain, name } = domainName(url);
    return {
      type: "video",
      source: "external",
      title: data.title || url.toString(),
      summary: data.author_name ? `By ${data.author_name}` : undefined,
      coverImage: data.thumbnail_url,
      author: data.author_name,
      external: {
        url: url.toString(),
        sourceName: data.provider_name || name,
        sourceDomain: domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        embedHtml: typeof data.html === "string" ? data.html : undefined,
        embedAllowed: Boolean(data.html),
        adapter: "oembed",
      },
      video: { playerUrl: undefined, duration: data.duration },
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Adapter 2/3: Open Graph / Twitter Card / schema.org, then generic scrape.
// ---------------------------------------------------------------------------
async function tryHtml(url: URL): Promise<NormalizedDraft> {
  const res = await safeFetch(url);
  const { domain, name } = domainName(url);

  if (!res.ok) {
    // Couldn't read the page — still produce a minimal, linkable draft.
    return {
      type: detectType(url),
      source: "external",
      title: url.toString(),
      external: {
        url: url.toString(),
        sourceName: name,
        sourceDomain: domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        embedAllowed: false,
        adapter: "scrape",
      },
    };
  }

  // Cap body size.
  const reader = res.body?.getReader();
  let html = "";
  if (reader) {
    let received = 0;
    const decoder = new TextDecoder();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (received > MAX_BYTES) break;
    }
  } else {
    html = await res.text();
  }

  const $ = cheerio.load(html);
  const meta = (sel: string) => $(sel).attr("content")?.trim() || undefined;

  const ogType = meta('meta[property="og:type"]');
  const title =
    meta('meta[property="og:title"]') ||
    meta('meta[name="twitter:title"]') ||
    $("title").first().text().trim() ||
    url.toString();
  const summary =
    meta('meta[property="og:description"]') ||
    meta('meta[name="twitter:description"]') ||
    meta('meta[name="description"]');
  const image =
    meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]');
  const author =
    meta('meta[name="author"]') || meta('meta[property="article:author"]');
  const canonical = $('link[rel="canonical"]').attr("href") || undefined;
  const siteName = meta('meta[property="og:site_name"]');

  // Price (product pages often expose these).
  const priceRaw =
    meta('meta[property="product:price:amount"]') ||
    meta('meta[property="og:price:amount"]') ||
    $('[itemprop="price"]').attr("content");
  const currency =
    meta('meta[property="product:price:currency"]') ||
    meta('meta[property="og:price:currency"]') ||
    undefined;

  // Refine the type using og:type / presence of a price.
  let type: ItemType = detectType(url);
  if (ogType?.includes("video")) type = "video";
  else if (ogType?.includes("product") || priceRaw) type = "product";
  else if (ogType?.includes("article")) type = "article";

  const draft: NormalizedDraft = {
    type,
    source: "external",
    title,
    summary,
    coverImage: image,
    author,
    external: {
      url: url.toString(),
      canonicalUrl: canonical,
      sourceName: siteName || name,
      sourceDomain: domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      embedAllowed: false,
      adapter: "opengraph",
    },
  };

  if (type === "product") {
    draft.product = {
      priceCents: priceRaw ? Math.round(parseFloat(priceRaw) * 100) : undefined,
      currency: currency || "USD",
      buyUrl: url.toString(),
    };
  }
  if (type === "link") {
    draft.link = { url: url.toString() };
  }
  return draft;
}

// ---------------------------------------------------------------------------
// Public entry point: turn any URL into a normalized external draft.
// Order of preference: oEmbed/API -> OG/schema.org -> generic scrape.
// ---------------------------------------------------------------------------
export async function ingestUrl(raw: string): Promise<NormalizedDraft> {
  const url = await assertSafeUrl(raw);
  const viaOEmbed = await tryOEmbed(url);
  if (viaOEmbed) return viaOEmbed;
  return tryHtml(url);
}

// ---------------------------------------------------------------------------
// Lightweight metadata preview: fetch a URL and pull its og:image / title /
// description, resolving relative image URLs. Used by authoring forms to
// auto-fill a preview image without a full ingest. SSRF-safe via assertSafeUrl.
export interface LinkPreview {
  image?: string;
  title?: string;
  description?: string;
}

export async function fetchLinkPreview(raw: string): Promise<LinkPreview> {
  const url = await assertSafeUrl(raw);
  const res = await safeFetch(url);
  const ctype = res.headers.get("content-type") || "";
  // If the URL itself is an image, use it directly.
  if (ctype.startsWith("image/")) return { image: url.toString() };
  if (!ctype.includes("html")) return {};
  const html = await res.text();
  const $ = cheerio.load(html);
  const meta = (sel: string) => $(sel).attr("content")?.trim() || undefined;

  let image =
    meta('meta[property="og:image"]') ||
    meta('meta[property="og:image:url"]') ||
    meta('meta[name="twitter:image"]') ||
    meta('meta[name="twitter:image:src"]') ||
    $('link[rel="image_src"]').attr("href") ||
    undefined;
  // Resolve protocol-relative and relative image URLs against the page URL.
  if (image) {
    try { image = new URL(image, url).toString(); } catch { /* leave as-is */ }
  }
  const title =
    meta('meta[property="og:title"]') ||
    meta('meta[name="twitter:title"]') ||
    $("title").first().text().trim() ||
    undefined;
  const description =
    meta('meta[property="og:description"]') ||
    meta('meta[name="twitter:description"]') ||
    meta('meta[name="description"]') ||
    undefined;
  return { image, title, description };
}

