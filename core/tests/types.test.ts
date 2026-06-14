import { describe, it, expect } from "vitest";
import { actionLabel, isItemType, isSource, TYPE_LABELS } from "@/lib/types";

describe("types: validators", () => {
  it("isItemType accepts valid types", () => {
    expect(isItemType("article")).toBe(true);
    expect(isItemType("video")).toBe(true);
    expect(isItemType("nope")).toBe(false);
    expect(isItemType(42)).toBe(false);
  });

  it("isSource accepts valid sources", () => {
    expect(isSource("hosted")).toBe(true);
    expect(isSource("external")).toBe(true);
    expect(isSource("cloud")).toBe(false);
  });

  it("has a label for every type", () => {
    for (const t of ["article", "video", "product", "link"] as const) {
      expect(TYPE_LABELS[t]).toBeTruthy();
    }
  });
});

describe("types: actionLabel (the core hosted/external distinction)", () => {
  it("hosted items get native verbs", () => {
    expect(actionLabel("article", "hosted")).toBe("Read");
    expect(actionLabel("video", "hosted")).toBe("Watch");
    expect(actionLabel("product", "hosted")).toBe("Buy");
  });

  it("external items get attributed, outbound verbs", () => {
    expect(actionLabel("article", "external", "NYT")).toBe("Read on NYT");
    expect(actionLabel("video", "external", "YouTube")).toBe("Watch on YouTube");
    expect(actionLabel("product", "external", "Amazon")).toBe("Buy on Amazon");
  });

  it("falls back to a generic source name", () => {
    expect(actionLabel("article", "external")).toBe("Read on source");
  });
});
