"use client";

import { createTheme, ThemeOptions } from "@mui/material/styles";

const baseTypography: ThemeOptions["typography"] = {
  fontFamily: '"DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 800 },
  h2: { fontWeight: 800 },
  h3: { fontWeight: 700 },
  h4: { fontWeight: 700 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  body1: { fontWeight: 300 },
  body2: { fontWeight: 300 },
  caption: { fontWeight: 200 },
  overline: { fontWeight: 200, letterSpacing: "0.1em" },
};

const baseComponents: ThemeOptions["components"] = {
  MuiContainer: {
    defaultProps: { maxWidth: "xl" },
    styleOverrides: {
      maxWidthXl: { maxWidth: "1400px !important" },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: { textTransform: "none", borderRadius: 8, fontWeight: 600 },
    },
  },
  MuiCard: {
    styleOverrides: { root: { borderRadius: 12 } },
  },
  MuiPaper: {
    styleOverrides: { root: { borderRadius: 12 } },
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
