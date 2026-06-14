import { describe, it, expect } from "vitest";
import { assertSafeUrl } from "@/lib/ingest";

// These reject-cases never hit the network (they fail before DNS/fetch).
describe("ingest: assertSafeUrl SSRF guards", () => {
  it("rejects non-http(s) schemes", async () => {
    await expect(assertSafeUrl("ftp://example.com")).rejects.toThrow();
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toThrow();
  });

  it("rejects localhost and internal hosts", async () => {
    await expect(assertSafeUrl("http://localhost/secret")).rejects.toThrow(/internal/i);
    await expect(assertSafeUrl("http://service.internal/")).rejects.toThrow(/internal/i);
  });

  it("rejects private IP literals", async () => {
    await expect(assertSafeUrl("http://10.0.0.1/")).rejects.toThrow(/private/i);
    await expect(assertSafeUrl("http://192.168.1.1/")).rejects.toThrow(/private/i);
    await expect(assertSafeUrl("http://127.0.0.1/")).rejects.toThrow();
  });

  it("rejects malformed URLs", async () => {
    await expect(assertSafeUrl("not a url")).rejects.toThrow(/invalid/i);
  });
});
