import { describe, it, expect } from "vitest";
import { renderReceipt } from "@/lib/email";

describe("email: renderReceipt", () => {
  const receipt = renderReceipt({
    siteName: "Mosaic",
    orderId: "abcdefgh1234",
    currency: "USD",
    totalCents: 4200,
    lines: [
      { title: "Workbook", quantity: 1, unitCents: 1900, downloadUrl: "https://x/dl" },
      { title: "Sticker", quantity: 2, unitCents: 1150 },
    ],
  });

  it("includes the site name and short order id in the subject", () => {
    expect(receipt.subject).toContain("Mosaic");
    expect(receipt.subject).toContain("abcdefgh");
  });

  it("renders each line item and the formatted total", () => {
    expect(receipt.html).toContain("Workbook");
    expect(receipt.html).toContain("Sticker");
    expect(receipt.html).toContain("$42.00");
  });

  it("includes a download link only for digital lines", () => {
    expect(receipt.html).toContain("https://x/dl");
    expect(receipt.html).toContain("Download your file");
  });

  it("escapes HTML in titles", () => {
    const r = renderReceipt({
      siteName: "S", orderId: "o1", currency: "USD", totalCents: 100,
      lines: [{ title: "<script>alert(1)</script>", quantity: 1, unitCents: 100 }],
    });
    expect(r.html).not.toContain("<script>alert(1)</script>");
    expect(r.html).toContain("&lt;script&gt;");
  });
});
