import { describe, it, expect } from "vitest";
import { hexToRgbTriplet, darken, DEFAULT_SETTINGS } from "@/lib/settings";

describe("settings: color helpers", () => {
  it("converts hex to an rgb triplet", () => {
    expect(hexToRgbTriplet("#1d4ed8")).toBe("29 78 216");
    expect(hexToRgbTriplet("#000000")).toBe("0 0 0");
    expect(hexToRgbTriplet("#ffffff")).toBe("255 255 255");
  });

  it("expands shorthand hex", () => {
    expect(hexToRgbTriplet("#fff")).toBe("255 255 255");
    expect(hexToRgbTriplet("#000")).toBe("0 0 0");
  });

  it("falls back on invalid input", () => {
    expect(hexToRgbTriplet("not-a-color")).toBe("29 78 216");
  });

  it("darkens by a factor", () => {
    expect(darken("#ffffff", 0.5)).toBe("128 128 128");
    expect(darken("#1d4ed8", 1)).toBe("29 78 216");
  });
});

describe("settings: defaults", () => {
  it("has the expected default identity", () => {
    expect(DEFAULT_SETTINGS.siteName).toBe("Mosaic");
    expect(DEFAULT_SETTINGS.themeId).toBe("classic");
    expect(DEFAULT_SETTINGS.theme).toBe("light");
  });
});
