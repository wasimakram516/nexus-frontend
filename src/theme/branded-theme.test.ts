import { describe, expect, it } from "vitest";
import { buildBrandedTheme } from "@/theme/branded-theme";
import {
  getDefaultTokenColor,
  mergeLegacyBranding,
  sanitizeTokenOverrides,
  BRANDING_COLOR_TOKENS,
} from "@/theme/branding-tokens";
import { darkTheme, lightTheme } from "@/theme/theme";

describe("buildBrandedTheme", () => {
  it("returns the base theme untouched when nothing is overridden", () => {
    expect(buildBrandedTheme(lightTheme, {})).toBe(lightTheme);
  });

  it("derives hover, light and contrast shades from the institution primary, not the base theme", () => {
    const branded = buildBrandedTheme(lightTheme, { "primary.main": "#2C6B48" });
    const { main, dark, light } = branded.palette.primary;

    expect(main).toBe("#2C6B48");
    expect(dark.toLowerCase()).not.toBe(lightTheme.palette.primary.dark.toLowerCase());
    expect(light.toLowerCase()).not.toBe(lightTheme.palette.primary.light.toLowerCase());
  });

  it("picks readable contrast text for a light institution color", () => {
    const branded = buildBrandedTheme(lightTheme, { "primary.main": "#FACC15" });
    expect(branded.palette.primary.contrastText).not.toBe("#fff");
  });

  it("lets an explicit shade win over the derived one", () => {
    const branded = buildBrandedTheme(lightTheme, { "primary.main": "#2C6B48", "primary.dark": "#112233", "primary.contrastText": "#ABCDEF" });
    expect(branded.palette.primary.dark).toBe("#112233");
    expect(branded.palette.primary.contrastText).toBe("#ABCDEF");
  });

  it("applies surface, text, divider and status overrides and leaves the rest alone", () => {
    const branded = buildBrandedTheme(darkTheme, {
      "background.default": "#101010",
      "background.paper": "#202020",
      "text.primary": "#FAFAFA",
      divider: "#333333",
      "status.error": "#FF0000",
    });
    expect(branded.palette.background.default).toBe("#101010");
    expect(branded.palette.background.paper).toBe("#202020");
    expect(branded.palette.text.primary).toBe("#FAFAFA");
    expect(branded.palette.text.secondary).toBe(darkTheme.palette.text.secondary);
    expect(branded.palette.divider).toBe("#333333");
    expect(branded.palette.error.main).toBe("#FF0000");
    expect(branded.palette.primary.main).toBe(darkTheme.palette.primary.main);
  });

  it("drives the app bar and drawer from the live theme so surface overrides reach them", () => {
    const branded = buildBrandedTheme(lightTheme, { "background.paper": "#202020" });
    const appBar = branded.components?.MuiAppBar?.styleOverrides?.root as (a: { theme: typeof branded }) => Record<string, string>;
    expect(appBar({ theme: branded }).backgroundColor).toBe("#202020");
  });
});

describe("branding token helpers", () => {
  it("provides a valid hex default for every token in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      for (const token of BRANDING_COLOR_TOKENS) {
        expect(getDefaultTokenColor(mode, token)).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });

  it("defaults primary.main to the Nexus theme color", () => {
    expect(getDefaultTokenColor("light", "primary.main").toLowerCase()).toBe(lightTheme.palette.primary.main.toLowerCase());
    expect(getDefaultTokenColor("dark", "background.default").toLowerCase()).toBe(darkTheme.palette.background.default.toLowerCase());
  });

  it("sanitizes stored overrides: unknown tokens and non-hex values are dropped", () => {
    expect(
      sanitizeTokenOverrides({ "primary.main": "#112233", "primary.hover": "#445566", divider: "red", "text.primary": "#FFF", "status.info": 5 }),
    ).toEqual({ "primary.main": "#112233" });
    expect(sanitizeTokenOverrides(null)).toEqual({});
    expect(sanitizeTokenOverrides([])).toEqual({});
  });

  it("merges legacy flat colors under explicit overrides", () => {
    expect(mergeLegacyBranding({ primary: "#111111", background: "#222222" }, { "primary.main": "#333333" })).toEqual({
      "primary.main": "#333333",
      "background.default": "#222222",
    });
  });
});
