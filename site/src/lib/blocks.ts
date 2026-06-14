// Block model shared by the editor (client) and renderer (server).
// Article bodies are stored as a JSON array of these blocks.

export type Block =
  | { type: "heading"; text: string; level?: 2 | 3 }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "image"; url: string; alt?: string; caption?: string }
  | { type: "embed"; url: string }
  | { type: "divider" }
  | { type: "code"; text: string; lang?: string };

export type BlockType = Block["type"];

export const BLOCK_TYPES: BlockType[] = [
  "heading", "paragraph", "quote", "list", "image", "embed", "code", "divider",
];

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  quote: "Quote",
  list: "List",
  image: "Image",
  embed: "Embed",
  code: "Code",
  divider: "Divider",
};

export function emptyBlock(type: BlockType): Block {
  switch (type) {
    case "heading": return { type, text: "", level: 2 };
    case "paragraph": return { type, text: "" };
    case "quote": return { type, text: "" };
    case "list": return { type, items: [""], ordered: false };
    case "image": return { type, url: "", alt: "", caption: "" };
    case "embed": return { type, url: "" };
    case "code": return { type, text: "" };
    case "divider": return { type };
  }
}

// Parse a stored body into blocks. Tolerates legacy shapes and plain text.
export function parseBlocks(value?: string | null): Block[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map(normalizeBlock)
        .filter((b): b is Block => b !== null);
    }
  } catch {
    // Not JSON — treat as a single paragraph.
    return [{ type: "paragraph", text: value }];
  }
  return [];
}

function normalizeBlock(raw: any): Block | null {
  if (!raw || typeof raw !== "object") return null;
  switch (raw.type) {
    case "heading": return { type: "heading", text: String(raw.text || ""), level: raw.level === 3 ? 3 : 2 };
    case "paragraph": return { type: "paragraph", text: String(raw.text || "") };
    case "quote": return { type: "quote", text: String(raw.text || "") };
    case "list":
      return { type: "list", ordered: !!raw.ordered, items: Array.isArray(raw.items) ? raw.items.map(String) : [] };
    case "image": return { type: "image", url: String(raw.url || ""), alt: raw.alt || "", caption: raw.caption || "" };
    case "embed": return { type: "embed", url: String(raw.url || "") };
    case "code": return { type: "code", text: String(raw.text || ""), lang: raw.lang || "" };
    case "divider": return { type: "divider" };
    default: return null;
  }
}

// Turn an embed URL into an embeddable iframe src where we recognize it.
export function embedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\./, "");
    if (h === "youtube.com" && u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if (h === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (h === "vimeo.com") return `https://player.vimeo.com/video${u.pathname}`;
    return null;
  } catch {
    return null;
  }
}
