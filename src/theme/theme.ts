"use client";

import { createTheme, ThemeOptions } from "@mui/material/styles";

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
  // Card is content surfaces (data tables, tiles) — flat, border-only, no MUI elevation shadow.
  MuiCard: {
    styleOverrides: { root: { borderRadius: 16, backgroundImage: "none", boxShadow: "none" } },
  },
  // Paper backs floating elements (Menu, Dialog, Drawer, Popover) — keeps elevation shadow so those still read as elevated.
  MuiPaper: {
    styleOverrides: { root: { borderRadius: 16 } },
  },
  MuiChip: {
    styleOverrides: { root: { borderRadius: 6 } },
  },
};

// Base palette matches the parent Wisemen Soft site's "Forest & Bone" design
// tokens (styles/tokens.js there) — a single forest-green accent on warm
// bone/charcoal surfaces, both modes first-class. See DEFAULT_BRANDING_COLORS
// in RuntimeConfigContext.tsx for the same palette applied as the fallback
// institution-branding colors.
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#54A87A", light: "#7CC79E", dark: "#3D8862" },
    secondary: { main: "#6366F1", light: "#818CF8", dark: "#4F46E5" },
    background: { default: "#141D18", paper: "#1C2822" },
    text: { primary: "#F0F2EA", secondary: "#AEB6A8" },
    divider: "rgba(94,168,124,0.2)",
    error: { main: "#EF4444" },
    warning: { main: "#F59E0B" },
    success: { main: "#10B981" },
    info: { main: "#6FA8C4" },
  },
  typography: baseTypography,
  components: {
    ...baseComponents,
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: "#1C2822", borderBottom: "1px solid rgba(94,168,124,0.2)", boxShadow: "none" },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: "#1C2822", borderRight: "1px solid rgba(94,168,124,0.2)" },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#141D18" },
      },
    },
  },
});

// Light mode intentionally departs from wisemensoft's warm "bone" surface
// (#F4F3EC/#ECE9DE reads as beige/earthy in a data-dense app) — kept the
// same forest-green accent and text tones, swapped the background for a
// neutral cool gray/white pair instead. Both are customizable per
// institution via InstitutionBranding — see DEFAULT_BRANDING_COLORS.
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2C6B48", light: "#4C8F68", dark: "#1F4E33" },
    secondary: { main: "#6366F1", light: "#818CF8", dark: "#4F46E5" },
    background: { default: "#F7F8FA", paper: "#FFFFFF" },
    text: { primary: "#151810", secondary: "#585F52" },
    divider: "rgba(21,24,16,0.09)",
    error: { main: "#DC2626" },
    warning: { main: "#D97706" },
    success: { main: "#059669" },
    info: { main: "#2F6E86" },
  },
  typography: baseTypography,
  components: {
    ...baseComponents,
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: "#FFFFFF", borderBottom: "1px solid rgba(21,24,16,0.09)", boxShadow: "none", color: "#151810" },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: "#FFFFFF", borderRight: "1px solid rgba(21,24,16,0.09)" },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#F7F8FA" },
      },
    },
  },
});
