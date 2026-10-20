import { createTheme, type PaletteColorOptions, type Theme } from "@mui/material/styles";
import { type TokenOverrides } from "./branding-tokens";

type PaletteRole = "primary" | "secondary" | "error" | "warning" | "success" | "info";

interface ColorShades {
  main?: string;
  light?: string;
  dark?: string;
  contrastText?: string;
}

/**
 * Builds one palette color (main, light, dark, contrastText) for a role.
 *
 * When the institution sets a main color, the other shades are re-derived from it with
 * `augmentColor`. Replacing only `main` is not enough: MUI would keep the base theme's
 * computed light, dark (hover) and contrastText, so hovering a branded button would flash
 * the Nexus default color. Explicitly overridden shades are then applied on top.
 */
function buildColor(base: Theme, role: PaletteRole, shades: ColorShades): PaletteColorOptions | undefined {
  if (!shades.main && !shades.light && !shades.dark && !shades.contrastText) return undefined;

  const derived = shades.main ? base.palette.augmentColor({ color: { main: shades.main }, name: role }) : base.palette[role];
  return {
    main: derived.main,
    light: shades.light ?? derived.light,
    dark: shades.dark ?? derived.dark,
    contrastText: shades.contrastText ?? derived.contrastText,
  };
}

/** Overridden shades for a two-level role such as primary.* or secondary.*. */
function shadesOf(overrides: TokenOverrides, role: "primary" | "secondary"): ColorShades {
  return {
    main: overrides[`${role}.main`],
    light: overrides[`${role}.light`],
    dark: overrides[`${role}.dark`],
    contrastText: overrides[`${role}.contrastText`],
  };
}

/**
 * Overlays an institution's saved colors (already merged and sanitized, for one mode) on a
 * base theme. Anything not overridden keeps the Nexus default, so the base theme remains the
 * single source for every color an institution has not customized.
 */
export function buildBrandedTheme(base: Theme, overrides: TokenOverrides): Theme {
  if (Object.keys(overrides).length === 0) return base;

  const palette: Record<string, unknown> = {};
  const colors: Array<[PaletteRole, ColorShades]> = [
    ["primary", shadesOf(overrides, "primary")],
    ["secondary", shadesOf(overrides, "secondary")],
    ["error", { main: overrides["status.error"] }],
    ["warning", { main: overrides["status.warning"] }],
    ["success", { main: overrides["status.success"] }],
    ["info", { main: overrides["status.info"] }],
  ];
  for (const [role, shades] of colors) {
    const color = buildColor(base, role, shades);
    if (color) palette[role] = color;
  }

  const bgDefault = overrides["background.default"];
  const bgPaper = overrides["background.paper"];
  if (bgDefault || bgPaper) {
    palette.background = { ...(bgDefault ? { default: bgDefault } : {}), ...(bgPaper ? { paper: bgPaper } : {}) };
  }

  const textPrimary = overrides["text.primary"];
  const textSecondary = overrides["text.secondary"];
  if (textPrimary || textSecondary) {
    palette.text = { ...(textPrimary ? { primary: textPrimary } : {}), ...(textSecondary ? { secondary: textSecondary } : {}) };
  }

  if (overrides.divider) palette.divider = overrides.divider;

  return createTheme(base, { palette });
}
