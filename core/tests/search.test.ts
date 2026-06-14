import { describe, it, expect } from "vitest";
import { scoreItem } from "@/lib/search";

const base = { title: "", summary: "", author: "", external: null, body: null };

describe("search: scoreItem ranking", () => {
  it("scores a title match higher than a body match", () => {
    const titleHit = scoreItem({ ...base, title: "Climate report" }, ["climate"]);
    const bodyHit = scoreItem(
      { ...base, title: "x", body: JSON.stringify([{ type: "paragraph", text: "climate" }]) },
      ["climate"]
    );
    expect(titleHit).toBeGreaterThan(bodyHit);
  });

  it("rewards a title prefix match extra", () => {
    const prefix = scoreItem({ ...base, title: "climate change" }, ["climate"]);
    const mid = scoreItem({ ...base, title: "the climate" }, ["climate"]);
    expect(prefix).toBeGreaterThan(mid);
  });

  it("matches summary, author, and external source name", () => {
    expect(scoreItem({ ...base, summary: "about whales" }, ["whales"])).toBeGreaterThan(0);
    expect(scoreItem({ ...base, author: "Jane Doe" }, ["jane"])).toBeGreaterThan(0);
    expect(scoreItem({ ...base, external: { sourceName: "YouTube" } }, ["youtube"])).toBeGreaterThan(0);
  });

  it("searches inside the article block body (and ignores inline HTML)", () => {
    const item = { ...base, body: JSON.stringify([{ type: "paragraph", text: "a <b>special</b> word" }]) };
    expect(scoreItem(item, ["special"])).toBeGreaterThan(0);
  });

  it("returns 0 when nothing matches", () => {
    expect(scoreItem({ ...base, title: "hello" }, ["zzz"])).toBe(0);
  });

  it("sums across multiple terms", () => {
    const one = scoreItem({ ...base, title: "alpha beta" }, ["alpha"]);
    const two = scoreItem({ ...base, title: "alpha beta" }, ["alpha", "beta"]);
    expect(two).toBeGreaterThan(one);
  });
});
