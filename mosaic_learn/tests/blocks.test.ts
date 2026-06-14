import { describe, it, expect } from "vitest";
import { parseBlocks, emptyBlock, embedSrc, BLOCK_TYPES } from "@/lib/blocks";

describe("blocks: parseBlocks", () => {
  it("parses a valid block array", () => {
    const json = JSON.stringify([
      { type: "heading", text: "Hi", level: 2 },
      { type: "paragraph", text: "Body" },
    ]);
    const blocks = parseBlocks(json);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: "heading", text: "Hi", level: 2 });
  });

  it("treats plain (non-JSON) text as a single paragraph", () => {
    const blocks = parseBlocks("just some text");
    expect(blocks).toEqual([{ type: "paragraph", text: "just some text" }]);
  });

  it("returns [] for empty/nullish", () => {
    expect(parseBlocks("")).toEqual([]);
    expect(parseBlocks(null)).toEqual([]);
    expect(parseBlocks(undefined)).toEqual([]);
  });

  it("drops unknown block types but keeps valid ones", () => {
    const json = JSON.stringify([{ type: "bogus" }, { type: "divider" }]);
    expect(parseBlocks(json)).toEqual([{ type: "divider" }]);
  });

  it("normalizes a heading level to 2 or 3", () => {
    const json = JSON.stringify([{ type: "heading", text: "x", level: 9 }]);
    expect(parseBlocks(json)[0]).toMatchObject({ level: 2 });
  });

  it("coerces list items to strings", () => {
    const json = JSON.stringify([{ type: "list", items: ["a", "b"], ordered: true }]);
    expect(parseBlocks(json)[0]).toMatchObject({ type: "list", ordered: true, items: ["a", "b"] });
  });
});

describe("blocks: emptyBlock", () => {
  it("creates a sensible default for each type", () => {
    for (const t of BLOCK_TYPES) {
      const b = emptyBlock(t);
      expect(b.type).toBe(t);
    }
    expect(emptyBlock("list")).toMatchObject({ items: [""] });
    expect(emptyBlock("heading")).toMatchObject({ level: 2 });
  });
});

describe("blocks: embedSrc", () => {
  it("maps YouTube watch URLs to embed URLs", () => {
    expect(embedSrc("https://www.youtube.com/watch?v=abc123")).toBe("https://www.youtube.com/embed/abc123");
  });
  it("maps youtu.be short URLs", () => {
    expect(embedSrc("https://youtu.be/abc123")).toBe("https://www.youtube.com/embed/abc123");
  });
  it("maps Vimeo URLs", () => {
    expect(embedSrc("https://vimeo.com/12345")).toBe("https://player.vimeo.com/video/12345");
  });
  it("returns null for unknown hosts", () => {
    expect(embedSrc("https://example.com/x")).toBeNull();
    expect(embedSrc("not a url")).toBeNull();
  });
});
