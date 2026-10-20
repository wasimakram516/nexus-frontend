import { darken, type Theme } from "@mui/material/styles";

/**
 * Brand gradient for panels that carry white text (auth hero, chat launcher).
 * Derived from the active theme's primary so it follows light/dark mode and
 * keeps white text readable in both.
 */
export function brandGradient(theme: Theme, angle = 160): string {
  const base = theme.palette.primary.dark;
  return `linear-gradient(${angle}deg, ${darken(base, 0.45)} 0%, ${darken(base, 0.2)} 40%, ${base} 100%)`;
}
