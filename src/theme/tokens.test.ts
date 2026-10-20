import { describe, expect, it } from "vitest";
import { DEFAULT_BRANDING_COLORS as fromContext } from "@/contexts/RuntimeConfigContext";
import { darkTheme, lightTheme } from "@/theme/theme";
import { BRAND_PALETTE, DEFAULT_BRANDING_COLORS } from "@/theme/tokens";

describe("theme tokens", () => {
  it("builds both MUI themes from the token palette", () => {
    expect(lightTheme.palette.primary.main).toBe(BRAND_PALETTE.light.primary.main);
    expect(darkTheme.palette.primary.main).toBe(BRAND_PALETTE.dark.primary.main);
    expect(lightTheme.palette.background.default).toBe(BRAND_PALETTE.light.background.default);
    expect(darkTheme.palette.secondary.main).toBe(BRAND_PALETTE.dark.secondary.main);
  });

  it("keeps institution-branding fallbacks identical to the base theme", () => {
    expect(fromContext).toBe(DEFAULT_BRANDING_COLORS);
    expect(DEFAULT_BRANDING_COLORS.light.primaryColor).toBe(lightTheme.palette.primary.main);
    expect(DEFAULT_BRANDING_COLORS.dark.backgroundColor).toBe(darkTheme.palette.background.default);
  });

  it("styles shared components once, in the theme", () => {
    const overrides = lightTheme.components;
    expect(overrides?.MuiButton?.styleOverrides?.root).toMatchObject({ borderRadius: 999 });
    expect(overrides?.MuiChip?.styleOverrides?.root).toMatchObject({ borderRadius: 999 });
    const card = overrides?.MuiCard?.styleOverrides?.root as (a: { theme: typeof lightTheme }) => Record<string, unknown>;
    expect(card({ theme: lightTheme })).toMatchObject({ borderRadius: 24 });
  });
});
