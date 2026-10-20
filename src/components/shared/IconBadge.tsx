"use client";

import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface IconBadgeProps {
  children: ReactNode;
  /** Square size in px. */
  size?: number;
}

/**
 * Rounded tile with a soft primary tint behind an icon. Follows the active theme
 * (and an institution's branding) instead of hard-coding colors in pages. It is a
 * Client Component because the tint is computed from the theme at render time.
 */
export default function IconBadge({ children, size = 42 }: IconBadgeProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: (t) => alpha(t.palette.primary.main, 0.12),
        color: "primary.main",
        mb: 2,
      }}
    >
      {children}
    </Box>
  );
}
