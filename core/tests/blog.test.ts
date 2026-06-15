import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";
import { renderBlogHtml, parseBlogBody, makeBlogBody } from "@/lib/blog";

describe("markdown: renderMarkdown", () => {
  it("renders headings, emphasis, links and lists", () => {
    const html = renderMarkdown("## Title\n\nHello **world** and *you* [here](https://x.com)\n\n- a\n- b");
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain("<em>you</em>");
    expect(html).toContain('<a href="https://x.com">here</a>');
    expect(html).toContain("<li>a</li>");
    expect(html).toContain("<ul>");
  });

  it("escapes raw HTML in markdown source", () => {
    const html = renderMarkdown("a <script>alert(1)</script> b");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("blog: renderBlogHtml sanitization", () => {
  it("strips scripts from markdown bodies", () => {
    const body = makeBlogBody("markdown", "# Hi\n\n<script>bad()</script>\n\ntext");
    const html = renderBlogHtml(body);
    expect(html).toContain("<h1>Hi</h1>");
    expect(html).not.toContain("<script>");
  });

  it("sanitizes HTML bodies (drops events, scripts, js: images)", () => {
    const body = makeBlogBody("html", '<h3>Keep</h3><p onclick="x">P</p><script>bad()</script><img src="javascript:bad"><img src="/ok.png">');
    const html = renderBlogHtml(body);
    expect(html).toContain("<h3>Keep</h3>");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('src="/ok.png"');
  });

  it("parses and round-trips the stored body shape", () => {
    expect(parseBlogBody(makeBlogBody("html", "<p>x</p>"))).toEqual({ format: "html", content: "<p>x</p>" });
    expect(parseBlogBody("legacy plain")).toEqual({ format: "markdown", content: "legacy plain" });
  });
});
