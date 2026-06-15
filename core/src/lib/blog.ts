import { renderMarkdown } from "./markdown";
import { sanitizeArticleHtml } from "./sanitize";

// Blog bodies are stored as JSON: {"format":"markdown"|"html","content":"…"}.
export function parseBlogBody(body?: string | null): { format: "markdown" | "html"; content: string } {
  if (!body) return { format: "markdown", content: "" };
  try {
    const o = JSON.parse(body);
    if (o && typeof o.content === "string") {
      return { format: o.format === "html" ? "html" : "markdown", content: o.content };
    }
  } catch {
    /* legacy/plain text */
  }
  return { format: "markdown", content: body };
}

export function makeBlogBody(format: string, content: string): string {
  return JSON.stringify({ format: format === "html" ? "html" : "markdown", content: content || "" });
}

// Render a stored blog body to safe HTML.
export function renderBlogHtml(body?: string | null): string {
  const { format, content } = parseBlogBody(body);
  const html = format === "html" ? content : renderMarkdown(content);
  return sanitizeArticleHtml(html);
}
