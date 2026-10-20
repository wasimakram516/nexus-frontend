import { useTheme, type Theme } from "@mui/material/styles";
import { MASCOT_COLORS } from "@/theme/tokens";

/** Every color Nex is drawn with, resolved from the active theme (never hard-coded in the SVG). */
export interface NexColors {
  body: string;
  hand: string;
  accent: string;
  capShade: string;
  visor: string;
  glow: string;
}

export function resolveNexColors(theme: Theme): NexColors {
  const dark = theme.palette.mode === "dark";
  return {
    body: theme.palette.primary.main,
    hand: theme.palette.primary.light,
    accent: theme.palette.secondary.main,
    capShade: theme.palette.secondary.dark,
    visor: dark ? theme.palette.background.default : theme.palette.text.primary,
    glow: dark ? MASCOT_COLORS.glow.dark : MASCOT_COLORS.glow.light,
  };
}

export function useNexColors(): NexColors {
  return resolveNexColors(useTheme());
}
