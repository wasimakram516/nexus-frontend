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

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#059669", light: "#34D399", dark: "#047857" },
    secondary: { main: "#6366F1", light: "#818CF8", dark: "#4F46E5" },
    background: { default: "#0A1410", paper: "#111C17" },
    text: { primary: "#F1F5F9", secondary: "#94A3B8" },
    divider: "#1E3329",
    error: { main: "#EF4444" },
    warning: { main: "#F59E0B" },
    success: { main: "#10B981" },
    info: { main: "#06B6D4" },
  },
  typography: baseTypography,
  components: {
    ...baseComponents,
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: "#111C17", borderBottom: "1px solid #1E3329", boxShadow: "none" },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: "#111C17", borderRight: "1px solid #1E3329" },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#0A1410" },
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#059669", light: "#34D399", dark: "#047857" },
    secondary: { main: "#6366F1", light: "#818CF8", dark: "#4F46E5" },
    background: { default: "#F0FDF4", paper: "#FFFFFF" },
    text: { primary: "#0F172A", secondary: "#475569" },
    divider: "#D1FAE5",
    error: { main: "#DC2626" },
    warning: { main: "#D97706" },
    success: { main: "#059669" },
    info: { main: "#0891B2" },
  },
  typography: baseTypography,
  components: {
    ...baseComponents,
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: "#FFFFFF", borderBottom: "1px solid #D1FAE5", boxShadow: "none", color: "#0F172A" },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: "#FFFFFF", borderRight: "1px solid #D1FAE5" },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#F0FDF4" },
      },
    },
  },
});
