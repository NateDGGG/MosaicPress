import { describe, it, expect } from "vitest";
import { sanitizeRichText } from "@/lib/sanitize";

describe("sanitize: sanitizeRichText", () => {
  it("keeps allowed inline tags", () => {
    expect(sanitizeRichText("<b>bold</b> and <em>em</em>")).toContain("<b>bold</b>");
    expect(sanitizeRichText("<b>bold</b> and <em>em</em>")).toContain("<em>em</em>");
  });

  it("removes script tags entirely (no execution surface)", () => {
    const out = sanitizeRichText('hi <script>alert(1)</script> there');
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("alert(1)</script>");
    expect(out).toContain("hi");
    expect(out).toContain("there");
  });

  it("unwraps disallowed tags but keeps their text", () => {
    const out = sanitizeRichText("<div onclick=\"x\">keep <b>me</b></div>");
    expect(out).not.toContain("<div");
    expect(out).not.toContain("onclick");
    expect(out).toContain("keep");
    expect(out).toContain("<b>me</b>");
  });

  it("strips event-handler and style attributes", () => {
    const out = sanitizeRichText('<b onmouseover="evil()" style="color:red">x</b>');
    expect(out).toContain("<b>x</b>");
    expect(out).not.toContain("onmouseover");
    expect(out).not.toContain("style");
  });

  it("allows safe links and forces rel/target", () => {
    const out = sanitizeRichText('<a href="https://example.com">link</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });

  it("drops javascript: hrefs", () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain("javascript:");
  });

  it("passes plain text through unchanged", () => {
    expect(sanitizeRichText("just text")).toBe("just text");
  });
});
