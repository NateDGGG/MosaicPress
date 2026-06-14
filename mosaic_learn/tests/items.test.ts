import { describe, it, expect } from "vitest";
import { slugify, priceFormat, durationFormat } from "@/lib/items";

describe("items: slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("strips punctuation and collapses separators", () => {
    expect(slugify("  The Basics: A Guide!! ")).toBe("the-basics-a-guide");
  });
  it("falls back to 'item' for empty input", () => {
    expect(slugify("!!!")).toBe("item");
    expect(slugify("")).toBe("item");
  });
});

describe("items: priceFormat", () => {
  it("formats cents as currency", () => {
    expect(priceFormat(1900, "USD")).toBe("$19.00");
    expect(priceFormat(0, "USD")).toBe("$0.00");
  });
  it("returns null for nullish", () => {
    expect(priceFormat(null)).toBeNull();
    expect(priceFormat(undefined)).toBeNull();
  });
});

describe("items: durationFormat", () => {
  it("formats seconds as m:ss", () => {
    expect(durationFormat(305)).toBe("5:05");
    expect(durationFormat(59)).toBe("0:59");
    expect(durationFormat(634)).toBe("10:34");
  });
  it("returns null for zero/nullish", () => {
    expect(durationFormat(0)).toBeNull();
    expect(durationFormat(null)).toBeNull();
  });
});
