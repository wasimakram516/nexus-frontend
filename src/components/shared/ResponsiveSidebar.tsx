"use client";

import type { ReactNode } from "react";
import { Drawer } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

/** What the sidebar content needs to know about how it is being shown. */
export interface SidebarContext {
  /** Icon-only rail (desktop, collapsed). Never true in the mobile drawer, which always shows full labels. */
  compact: boolean;
  isMobile: boolean;
  /** Closes the mobile drawer; a no-op on desktop. Call it after navigating. */
  closeMobile: () => void;
}

const MOBILE_DRAWER_WIDTH = 280;

/** True below the md breakpoint, where the sidebar becomes a drawer opened from a hamburger button. */
export function useIsMobileLayout(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
}

interface ResponsiveSidebarProps {
  /** Desktop only: show the icon-only rail. */
  collapsed: boolean;
  /** Desktop width in px for the current collapsed state. */
  desktopWidth: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
  children: (ctx: SidebarContext) => ReactNode;
}

/**
 * The logged-in sidebar. On desktop it is a permanent drawer (collapsible to a rail); on phones and
 * small tablets it is a temporary drawer that slides over the page, opened from MobileTopBar.
 *
 * Layout contract for the content: the header and footer stay put and only the middle scrolls. The
 * drawer paper does not scroll itself, so give the menu `flex: 1; minHeight: 0; overflowY: auto` and
 * the footer `flexShrink: 0`.
 */
export default function ResponsiveSidebar({ collapsed, desktopWidth, mobileOpen, onMobileClose, children }: ResponsiveSidebarProps) {
  const isMobile = useIsMobileLayout();
  const paper = { display: "flex", flexDirection: "column", overflow: "hidden" } as const;

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        sx={{ "& .MuiDrawer-paper": { ...paper, width: MOBILE_DRAWER_WIDTH, maxWidth: "85vw" } }}
      >
        {children({ compact: false, isMobile: true, closeMobile: onMobileClose })}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: desktopWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": { ...paper, width: desktopWidth, transition: "width 0.2s ease" },
      }}
    >
      {children({ compact: collapsed, isMobile: false, closeMobile: onMobileClose })}
    </Drawer>
  );
}
