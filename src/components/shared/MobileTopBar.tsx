"use client";

import type { ReactNode } from "react";
import { AppBar, Box, IconButton, Toolbar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

interface MobileTopBarProps {
  /** Opens the navigation drawer. */
  onMenu: () => void;
  /** Brand shown next to the hamburger (logo, name). */
  children?: ReactNode;
}

/** Slim top bar shown on phones: a hamburger that opens the sidebar drawer, plus the brand. */
export default function MobileTopBar({ onMenu, children }: MobileTopBarProps) {
  return (
    <AppBar position="sticky" elevation={0} color="inherit" component="header">
      <Toolbar variant="dense" sx={{ gap: 1, minHeight: 56 }}>
        <IconButton edge="start" aria-label="Open navigation menu" onClick={onMenu}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>{children}</Box>
      </Toolbar>
    </AppBar>
  );
}
