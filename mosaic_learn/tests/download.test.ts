import { describe, it, expect } from "vitest";
import { signDownload, verifyDownload, downloadUrl } from "@/lib/download";

describe("download: signed links", () => {
  it("verifies a correctly signed token", () => {
    const token = signDownload("order1", "item1");
    expect(verifyDownload("order1", "item1", token)).toBe(true);
  });

  it("rejects a token for a different item (no cross-unlock)", () => {
    const token = signDownload("order1", "item1");
    expect(verifyDownload("order1", "item2", token)).toBe(false);
  });

  it("rejects a token for a different order", () => {
    const token = signDownload("order1", "item1");
    expect(verifyDownload("order2", "item1", token)).toBe(false);
  });

  it("rejects garbage tokens", () => {
    expect(verifyDownload("order1", "item1", "deadbeef")).toBe(false);
    expect(verifyDownload("order1", "item1", "")).toBe(false);
  });

  it("builds a URL containing all three params", () => {
    const url = downloadUrl("order1", "item1", "https://site.test");
    expect(url).toContain("https://site.test/api/download?");
    expect(url).toContain("order=order1");
    expect(url).toContain("item=item1");
    expect(url).toContain("token=");
  });
});
