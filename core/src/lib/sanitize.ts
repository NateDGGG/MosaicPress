import * as cheerio from "cheerio";

// Allowlist sanitizer for the WYSIWYG editor's inline HTML. Rich-text blocks
// (paragraph, quote) store a small subset of HTML; this strips everything else
// at render time so user/editor input can never inject scripts or markup.

const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "code", "a", "br"]);

export function sanitizeRichText(html: string): string {
  if (!html) return "";
  // If there are no tags at all, return as-is (plain text / legacy content).
  if (!/[<>]/.test(html)) return html;

  const $ = cheerio.load(html, null, false);

  // Multiple passes so newly-unwrapped children are re-checked.
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    $("*").each((_, el) => {
      const node = el as any;
      const tag = (node.tagName || "").toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        $(node).replaceWith($(node).contents());
        changed = true;
        return;
      }
      const attribs = node.attribs || {};
      const allowed = tag === "a" ? ["href", "title"] : [];
      for (const attr of Object.keys(attribs)) {
        if (!allowed.includes(attr)) $(node).removeAttr(attr);
      }
      if (tag === "a") {
        const href = $(node).attr("href") || "";
        if (!/^(https?:|mailto:)/i.test(href)) {
          $(node).removeAttr("href");
        } else {
          $(node).attr("rel", "noopener noreferrer nofollow");
          $(node).attr("target", "_blank");
        }
      }
    });
    if (!changed) break;
  }

  return $.html();
}

// Broader allowlist for full article/blog bodies (headings, lists, images…).
const ARTICLE_TAGS = new Set([
  "h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "blockquote",
  "pre", "code", "a", "strong", "b", "em", "i", "u", "img", "hr", "br", "figure", "figcaption",
]);

export function sanitizeArticleHtml(html: string): string {
  if (!html) return "";
  const $ = cheerio.load(html, null, false);
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    $("*").each((_, el) => {
      const node = el as any;
      const tag = (node.tagName || "").toLowerCase();
      if (!ARTICLE_TAGS.has(tag)) {
        $(node).replaceWith($(node).contents());
        changed = true;
        return;
      }
      const attribs = node.attribs || {};
      const allowed = tag === "a" ? ["href", "title"] : tag === "img" ? ["src", "alt"] : [];
      for (const attr of Object.keys(attribs)) {
        if (!allowed.includes(attr)) $(node).removeAttr(attr);
      }
      if (tag === "a") {
        const href = $(node).attr("href") || "";
        if (!/^(https?:|mailto:|\/)/i.test(href)) $(node).removeAttr("href");
        else { $(node).attr("rel", "noopener noreferrer nofollow"); $(node).attr("target", "_blank"); }
      }
      if (tag === "img") {
        const src = $(node).attr("src") || "";
        if (!/^(https?:|\/)/i.test(src)) { $(node).remove(); changed = true; }
      }
    });
    if (!changed) break;
  }
  return $.html();
}
