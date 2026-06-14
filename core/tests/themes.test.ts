import { describe, it, expect } from "vitest";
import { THEMES, getTheme, DEFAULT_THEME_ID } from "@/lib/themes";

describe("themes: registry", () => {
  it("has unique ids", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every theme has complete tokens", () => {
    for (const t of THEMES) {
      expect(t.name).toBeTruthy();
      expect(t.primaryColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.accentColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(["light", "dark"]).toContain(t.mode);
      expect(t.fontFamily).toBeTruthy();
    }
  });

  it("getTheme returns the requested theme", () => {
    expect(getTheme("midnight").id).toBe("midnight");
  });

  it("getTheme falls back to the first theme for unknown ids", () => {
    expect(getTheme("does-not-exist").id).toBe(THEMES[0].id);
    expect(getTheme(null).id).toBe(THEMES[0].id);
  });

  it("the default theme id exists", () => {
    expect(THEMES.some((t) => t.id === DEFAULT_THEME_ID)).toBe(true);
  });
});
