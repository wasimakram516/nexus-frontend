"use client";

import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface TintedBandProps {
  children: ReactNode;
}

/** Page-header band that fades from a faint primary tint into the page background. */
export default function TintedBand({ children }: TintedBandProps) {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        background: (t) =>
          `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.1)} 0%, ${alpha(t.palette.background.paper, 0)} 100%)`,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      {children}
    </Box>
  );
}
