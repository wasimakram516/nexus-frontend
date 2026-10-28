"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { darkTheme, lightTheme } from "@/theme/theme";

type ThemeMode = "dark" | "light";

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
  /** Uses the school's chosen mode, unless this person already picked one themselves. */
  applyDefaultMode: (preferred: string | null | undefined) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The first render must match the server, so the saved theme is applied after
  // mount. Reading localStorage while rendering makes anything that shows the
  // mode (e.g. the theme toggle icon) differ between server and client.
  const [mode, setMode] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const restoreTheme = () => {
      const stored = localStorage.getItem("nexus-theme") as ThemeMode | null;
      if (stored === "dark" || stored === "light") setMode(stored);
      setMounted(true);
    };
    restoreTheme();
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("nexus-theme", next);
      return next;
    });
  }, []);

  const applyDefaultMode = useCallback((preferred: string | null | undefined) => {
    if (preferred !== "dark" && preferred !== "light") return;
    if (localStorage.getItem("nexus-theme")) return;
    setMode(preferred);
  }, []);

  const activeTheme = mounted
    ? mode === "dark" ? darkTheme : lightTheme
    : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, applyDefaultMode }}>
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

/** Like useThemeMode, but null outside a ThemeProvider, for screens that also render without one. */
export function useOptionalThemeMode() {
  return useContext(ThemeContext);
}
