/**
 * Single source of truth for Nexus colors. Everything that needs a brand color
 * (the MUI theme, institution-branding fallbacks, the logo, the OG image, the
 * module tiles) imports from here. Pages must never hard-code a color: use a
 * theme palette reference ("primary.main", `alpha(theme.palette.primary.main, 0.1)`)
 * instead, so a rebrand or an institution's saved branding reaches them.
 *
 * Brand: "Navy & Coral", deliberately distinct from the forest green used
 * across the other Wisemen Soft products. Green is reserved for the success
 * status color.
 *
 * AFTER ANY COLOR CHANGE IN THIS FILE, RUN `npm run brand:assets`.
 * It regenerates the favicon, logo SVGs and PNG icons, which are static files
 * and cannot read these tokens at runtime.
 */

interface PaletteTriplet {
  main: string;
  light: string;
  dark: string;
}

export interface BrandPalette {
  primary: PaletteTriplet;
  secondary: PaletteTriplet;
  background: { default: string; paper: string };
  text: { primary: string; secondary: string };
  divider: string;
  status: { error: string; warning: string; success: string; info: string };
}

export const BRAND_PALETTE: { light: BrandPalette; dark: BrandPalette } = {
  light: {
    primary: { main: "#1E3A8A", light: "#4B61A1", dark: "#172C68" },
    secondary: { main: "#D9482B", light: "#E16D55", dark: "#AE3A22" },
    background: { default: "#EEF2FA", paper: "#FFFFFF" },
    text: { primary: "#0E1A36", secondary: "#4B5675" },
    divider: "rgba(14,26,54,0.1)",
    status: { error: "#DC2626", warning: "#D97706", success: "#059669", info: "#2F6E86" },
  },
  dark: {
    primary: { main: "#8FA9E8", light: "#B1C3EF", dark: "#6B7FAE" },
    secondary: { main: "#FF8A70", light: "#FFA18D", dark: "#CC6E5A" },
    background: { default: "#0A1226", paper: "#121C38" },
    text: { primary: "#EAF0FF", secondary: "#A8B3CF" },
    divider: "rgba(143,169,232,0.2)",
    status: { error: "#EF4444", warning: "#F59E0B", success: "#10B981", info: "#6FA8C4" },
  },
};

/** Fallback institution-branding colors, used wherever an institution has not saved its own. */
export const DEFAULT_BRANDING_COLORS = {
  light: {
    primaryColor: BRAND_PALETTE.light.primary.main,
    secondaryColor: BRAND_PALETTE.light.secondary.main,
    accentColor: BRAND_PALETTE.light.primary.light,
    backgroundColor: BRAND_PALETTE.light.background.default,
  },
  dark: {
    primaryColor: BRAND_PALETTE.dark.primary.main,
    secondaryColor: BRAND_PALETTE.dark.secondary.main,
    accentColor: BRAND_PALETTE.dark.primary.light,
    backgroundColor: BRAND_PALETTE.dark.background.default,
  },
};

/**
 * Colors for the generated social-preview image. It renders outside React, so it
 * cannot read the MUI theme and imports these constants instead.
 */
export const OG_COLORS = {
  gradient: ["#0A1226", "#121C38", "#1E3A8A"] as const,
  accent: BRAND_PALETTE.dark.primary.main,
  highlight: BRAND_PALETTE.dark.secondary.main,
  highlightText: BRAND_PALETTE.dark.secondary.light,
  glow: "rgba(255,138,112,0.16)",
  glowBorder: "rgba(255,138,112,0.4)",
};

/** Mascot-only colors that have no theme palette equivalent: the glowing visor face and AI spark. */
export const MASCOT_COLORS = {
  glow: { light: "#A9C7FF", dark: "#CFE0FF" },
};

/** Identity colors for the institution-management module tiles (data colors, not brand). */
export const MODULE_ACCENTS = {
  campuses: "#10B981",
  people: "#3B82F6",
  academics: "#8B5CF6",
  attendance: "#F59E0B",
  finance: "#EF4444",
  users: "#06B6D4",
  customFields: "#A855F7",
  reports: "#64748B",
  examinations: "#D946EF",
  documents: "#0EA5E9",
  realtime: "#22C55E",
  notices: "#F97316",
} as const;

export const DEFAULT_MODULE_ACCENT = MODULE_ACCENTS.reports;
