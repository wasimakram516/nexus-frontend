import { darkTheme, lightTheme } from "./theme";
import { BRAND_PALETTE } from "./tokens";

export type ColorMode = "light" | "dark";

export type BrandingColorToken =
  | "primary.main"
  | "primary.light"
  | "primary.dark"
  | "primary.contrastText"
  | "secondary.main"
  | "secondary.light"
  | "secondary.dark"
  | "secondary.contrastText"
  | "background.default"
  | "background.paper"
  | "text.primary"
  | "text.secondary"
  | "divider"
  | "status.error"
  | "status.warning"
  | "status.success"
  | "status.info";

/** Overridden colors for one mode. Only colors an admin changed are present. */
export type TokenOverrides = Partial<Record<BrandingColorToken, string>>;
/** Per-institution overrides, as stored in InstitutionBranding.colorOverrides. */
export type ColorOverrides = Partial<Record<ColorMode, TokenOverrides>>;

export interface BrandingColorTokenDef {
  token: BrandingColorToken;
  label: string;
  hint: string;
}

export interface BrandingColorGroup {
  id: string;
  title: string;
  tokens: BrandingColorTokenDef[];
}

/** Every theme color an institution may set, grouped the way the editor shows them. Keep in sync with the backend whitelist. */
export const BRANDING_COLOR_GROUPS: BrandingColorGroup[] = [
  {
    id: "primary",
    title: "Primary",
    tokens: [
      { token: "primary.main", label: "Main", hint: "Buttons, links, active menu item, focus rings" },
      { token: "primary.light", label: "Light", hint: "Lighter shade for accents and highlights" },
      { token: "primary.dark", label: "Dark (hover)", hint: "Hover and pressed state of primary buttons" },
      { token: "primary.contrastText", label: "Text on primary", hint: "Label color on primary buttons and chips" },
    ],
  },
  {
    id: "secondary",
    title: "Secondary",
    tokens: [
      { token: "secondary.main", label: "Main", hint: "Secondary actions and highlights" },
      { token: "secondary.light", label: "Light", hint: "Lighter shade of the secondary color" },
      { token: "secondary.dark", label: "Dark (hover)", hint: "Hover and pressed state" },
      { token: "secondary.contrastText", label: "Text on secondary", hint: "Label color on secondary buttons" },
    ],
  },
  {
    id: "surfaces",
    title: "Surfaces",
    tokens: [
      { token: "background.default", label: "Page background", hint: "Behind everything" },
      { token: "background.paper", label: "Cards and panels", hint: "Cards, sidebar, top bar, dialogs" },
      { token: "divider", label: "Dividers and borders", hint: "Lines between sections and card outlines" },
    ],
  },
  {
    id: "text",
    title: "Text",
    tokens: [
      { token: "text.primary", label: "Main text", hint: "Headings and body copy" },
      { token: "text.secondary", label: "Muted text", hint: "Captions, helper text, subtitles" },
    ],
  },
  {
    id: "status",
    title: "Status",
    tokens: [
      { token: "status.error", label: "Error", hint: "Errors and destructive actions" },
      { token: "status.warning", label: "Warning", hint: "Warnings and pending states" },
      { token: "status.success", label: "Success", hint: "Success and completed states" },
      { token: "status.info", label: "Info", hint: "Informational messages" },
    ],
  },
];

export const BRANDING_COLOR_TOKENS: BrandingColorToken[] = BRANDING_COLOR_GROUPS.flatMap((g) => g.tokens.map((t) => t.token));

/** Strictly 6-digit hex: the only form the backend accepts and the native color input produces. */
export const HEX_COLOR_6 = /^#[0-9a-fA-F]{6}$/;

/** Expands #RGB and uppercases, so theme-computed values (e.g. "#fff") compare and display consistently. */
export function normalizeHex(value: string): string {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toUpperCase();
  return v.toUpperCase();
}

/**
 * Turns any theme color string into a solid 6-digit hex. MUI computes "text on color" as
 * rgba(0,0,0,0.87) for light backgrounds, which the color picker cannot show, so a
 * translucent color is composited over `over` (the color it is drawn on).
 */
function toSolidHex(value: string, over: string): string {
  const m = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (!m) return normalizeHex(value);
  const alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
  const fg = `#${[m[1], m[2], m[3]].map((c) => Number(c).toString(16).padStart(2, "0")).join("")}`;
  return blendHex(fg, normalizeHex(over), alpha);
}

function blendHex(fg: string, bg: string, alpha: number): string {
  const f = [1, 3, 5].map((i) => parseInt(fg.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
  return `#${f.map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/**
 * The Nexus default for one color: what an institution gets until it overrides it.
 * Read from the theme tokens, never stored on the institution, so a future Nexus
 * rebrand reaches every institution that has not customized that color.
 */
export function getDefaultTokenColor(mode: ColorMode, token: BrandingColorToken): string {
  const palette = BRAND_PALETTE[mode];
  const theme = mode === "dark" ? darkTheme : lightTheme;
  switch (token) {
    case "primary.main": return palette.primary.main;
    case "primary.light": return palette.primary.light;
    case "primary.dark": return palette.primary.dark;
    case "primary.contrastText": return toSolidHex(theme.palette.primary.contrastText, theme.palette.primary.main);
    case "secondary.main": return palette.secondary.main;
    case "secondary.light": return palette.secondary.light;
    case "secondary.dark": return palette.secondary.dark;
    case "secondary.contrastText": return toSolidHex(theme.palette.secondary.contrastText, theme.palette.secondary.main);
    case "background.default": return palette.background.default;
    case "background.paper": return palette.background.paper;
    case "text.primary": return palette.text.primary;
    case "text.secondary": return palette.text.secondary;
    // The theme divider is translucent; show its solid equivalent over the page background.
    case "divider": return blendHex(palette.text.primary, palette.background.paper, mode === "dark" ? 0.2 : 0.1);
    case "status.error": return palette.status.error;
    case "status.warning": return palette.status.warning;
    case "status.success": return palette.status.success;
    case "status.info": return palette.status.info;
  }
}

/** Keeps only known tokens with valid hex values, so a malformed stored value can never reach the theme. */
export function sanitizeTokenOverrides(raw: unknown): TokenOverrides {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const out: TokenOverrides = {};
  for (const token of BRANDING_COLOR_TOKENS) {
    const value = (raw as Record<string, unknown>)[token];
    if (typeof value === "string" && HEX_COLOR_6.test(value)) out[token] = value;
  }
  return out;
}

/**
 * Legacy flat branding colors (primary/secondary/background per mode) expressed as token
 * overrides, so old and new storage feed one pipeline. Explicit overrides win over legacy.
 */
export function mergeLegacyBranding(
  legacy: { primary?: string; secondary?: string; background?: string },
  overrides: TokenOverrides,
): TokenOverrides {
  return {
    ...(legacy.primary ? { "primary.main": legacy.primary } : {}),
    ...(legacy.secondary ? { "secondary.main": legacy.secondary } : {}),
    ...(legacy.background ? { "background.default": legacy.background } : {}),
    ...overrides,
  };
}

/**
 * Returns new overrides with one color set (hex) or cleared (null). A color equal to the
 * Nexus default is stored as "not overridden", so only real customizations are persisted.
 */
export function setTokenOverride(overrides: ColorOverrides, mode: ColorMode, token: BrandingColorToken, hex: string | null): ColorOverrides {
  const current = { ...(overrides[mode] ?? {}) };
  const normalized = hex === null ? null : normalizeHex(hex);
  if (normalized === null || normalized === getDefaultTokenColor(mode, token)) delete current[token];
  else current[token] = normalized;

  const next: ColorOverrides = { ...overrides, [mode]: current };
  if (Object.keys(current).length === 0) delete next[mode];
  return next;
}

/** Number of customized colors, in one mode or across both. */
export function countOverrides(overrides: ColorOverrides, mode?: ColorMode): number {
  const modes: ColorMode[] = mode ? [mode] : ["light", "dark"];
  return modes.reduce((sum, m) => sum + Object.keys(overrides[m] ?? {}).length, 0);
}
