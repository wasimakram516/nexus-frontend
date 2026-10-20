"use client";

import { alpha, createTheme, ThemeOptions } from "@mui/material/styles";
import { BRAND_PALETTE, type BrandPalette } from "./tokens";

declare module "@mui/material/Chip" {
  interface ChipPropsSizeOverrides {
    tiny: true;
  }
}

const displayFont = "var(--font-display), Georgia, serif";

const baseTypography: ThemeOptions["typography"] = {
  fontFamily: 'var(--font-inter), "Helvetica Neue", Arial, sans-serif',
  h1: { fontFamily: displayFont, fontWeight: 500, lineHeight: 1.05 },
  h2: { fontFamily: displayFont, fontWeight: 500, lineHeight: 1.12 },
  h3: { fontFamily: displayFont, fontWeight: 500, lineHeight: 1.2 },
  h4: { fontFamily: displayFont, fontWeight: 500 },
  h5: { fontFamily: displayFont, fontWeight: 600 },
  h6: { fontFamily: displayFont, fontWeight: 600 },
  body1: { fontWeight: 400, lineHeight: 1.75 },
  body2: { fontWeight: 400, lineHeight: 1.7 },
  caption: { fontWeight: 400 },
  overline: { fontWeight: 600, letterSpacing: "0.1em" },
};

const baseComponents: ThemeOptions["components"] = {
  // Matches the parent Wisemen Soft site's container scale: 1400px primary, 1000px for narrow/reading content.
  MuiContainer: {
    defaultProps: { maxWidth: "xl" },
    styleOverrides: {
      maxWidthXl: { maxWidth: "1400px !important" },
      maxWidthLg: { maxWidth: "1400px !important" },
      maxWidthMd: { maxWidth: "1000px !important" },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
        borderRadius: 999,
        fontWeight: 600,
        transition: "transform 0.2s ease",
        "&:hover": { transform: "translateY(-2px)" },
      },
    },
  },
  // Card is the content surface (data tables, tiles): large radius, a hairline
  // border for definition (shadows vanish on dark backgrounds), and a soft layered
  // elevation shadow. Pages should not restyle this; use <Card> as-is.
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => {
        const shadow = alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.45 : 0.07);
        return {
          borderRadius: 24,
          backgroundImage: "none",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: `0 1px 2px ${shadow}, 0 8px 24px ${shadow}`,
        };
      },
    },
  },
  // Paper backs floating elements (Menu, Dialog, Drawer, Popover) — keeps elevation shadow so those still read as elevated.
  MuiPaper: {
    styleOverrides: { root: { borderRadius: 16 } },
  },
  // Inputs are pill-shaped to match buttons and chips; multiline fields get a
  // softer radius because a full pill distorts a textarea. Horizontal padding is
  // widened so text clears the curve, and tightened next to adornments.
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ ownerState }) => ({
        borderRadius: ownerState.multiline ? 20 : 999,
        ...(ownerState.startAdornment ? { paddingLeft: 16 } : {}),
        ...(ownerState.endAdornment ? { paddingRight: 16 } : {}),
      }),
      input: ({ ownerState }) => ({
        paddingLeft: ownerState.startAdornment ? 8 : 20,
        paddingRight: ownerState.endAdornment ? 8 : 20,
      }),
    },
  },
  MuiChip: {
    styleOverrides: { root: { borderRadius: 999 } },
    // size="tiny": compact status/count badges (replaces ad-hoc height/fontSize sx overrides).
    variants: [
      { props: { size: "tiny" }, style: { height: 18, fontSize: 10, "& .MuiChip-label": { paddingLeft: 6, paddingRight: 6 } } },
    ],
  },
};

// Palette values live in ./tokens.ts (the single source of truth); this file only
// maps them onto MUI. Light mode uses a neutral cool gray/white surface pair (a
// warm "bone" tone reads as beige in a data-dense app). Both modes are
// customizable per institution via InstitutionBranding, which the dashboard
// layout overlays on top of these base themes.
function buildTheme(mode: "light" | "dark", p: BrandPalette) {
  return createTheme({
    palette: {
      mode,
      primary: p.primary,
      secondary: p.secondary,
      background: p.background,
      text: p.text,
      divider: p.divider,
      error: { main: p.status.error },
      warning: { main: p.status.warning },
      success: { main: p.status.success },
      info: { main: p.status.info },
    },
    typography: baseTypography,
    components: {
      ...baseComponents,
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: p.background.paper,
            borderBottom: `1px solid ${p.divider}`,
            boxShadow: "none",
            color: p.text.primary,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundColor: p.background.paper, borderRight: `1px solid ${p.divider}` },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: p.background.default },
        },
      },
    },
  });
}

export const darkTheme = buildTheme("dark", BRAND_PALETTE.dark);
export const lightTheme = buildTheme("light", BRAND_PALETTE.light);
