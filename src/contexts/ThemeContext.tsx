"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { darkTheme, lightTheme } from "@/theme/theme";

type ThemeMode = "dark" | "light";

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("nexus-theme") as ThemeMode | null;
    return stored ?? "light";
  });
  // `mounted` intentionally stays effect-driven: it exists to defer applying the
  // resolved theme until after hydration so server and first client render match,
  // which is a real cross-render (SSR vs. client) synchronization, not a value
  // that's computable once during render.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const markMounted = () => setMounted(true);
    markMounted();
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("nexus-theme", next);
      return next;
    });
  }, []);

  const activeTheme = mounted
    ? mode === "dark" ? darkTheme : lightTheme
    : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={activeTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeProvider");
  return ctx;
}
