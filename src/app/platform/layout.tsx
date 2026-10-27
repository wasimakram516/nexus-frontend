"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import AccountTree from "@mui/icons-material/AccountTree";
import Assessment from "@mui/icons-material/Assessment";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Dashboard from "@mui/icons-material/Dashboard";
import Delete from "@mui/icons-material/Delete";
import Layers from "@mui/icons-material/Layers";
import Inbox from "@mui/icons-material/Inbox";
import Language from "@mui/icons-material/Language";
import Logout from "@mui/icons-material/Logout";
import Person from "@mui/icons-material/Person";
import NexusLogo from "@/components/shared/NexusLogo";
import ResponsiveSidebar, { useIsMobileLayout } from "@/components/shared/ResponsiveSidebar";
import MobileTopBar from "@/components/shared/MobileTopBar";
import Close from "@mui/icons-material/Close";
import ProfileDialog from "@/components/shared/ProfileDialog";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useForcePasswordChange } from "@/hooks/useForcePasswordChange";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useMessage } from "@/contexts/MessageContext";
import { useNewInquiryCount } from "@/hooks/useNewInquiryCount";
import { apiHandler } from "@/lib/apiHandler";
import { authService } from "@/services/auth.service";

const DRAWER_EXPANDED = 240;
const DRAWER_COLLAPSED = 64;

const navItems = [
  { label: "Overview",       href: "/platform",              icon: <Dashboard /> },
  { label: "Institutions",   href: "/platform/institutions", icon: <AccountTree /> },
  { label: "Plans",          href: "/platform/plans",        icon: <Layers /> },
  { label: "Inquiries",     href: "/platform/inquiries",   icon: <Inbox /> },
  { label: "Audit Logs",     href: "/platform/audit-logs",   icon: <Assessment /> },
  { label: "Recycle Bin",    href: "/platform/recycle-bin",  icon: <Delete /> },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  useForcePasswordChange();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuth();
  const confirm = useConfirm();
  const { showMessage } = useMessage();
  const newInquiries = useNewInquiryCount(pathname, { announce: true });
  const drawerWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_EXPANDED;
  const isMobile = useIsMobileLayout();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign Out",
      message: "Are you sure you want to sign out of the platform console?",
      confirmLabel: "Sign Out",
      confirmColor: "warning",
      confirmIcon: <Logout fontSize="small" />,
    });
    if (!ok) return;
    await apiHandler(() => authService.logout(), { showMessage, silent: true });
    clearAuth();
    router.replace("/login");
  };

  const isActive = (href: string) =>
    href === "/platform" ? pathname === "/platform" : pathname.startsWith(href);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Sidebar: a permanent drawer on desktop, a hamburger-opened drawer on phones. */}
      <ResponsiveSidebar collapsed={collapsed} desktopWidth={drawerWidth} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)}>
        {({ compact, isMobile, closeMobile }) => (
          <>
        {/* Logo + collapse toggle */}
        {compact ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 1.5, gap: 1 }}>
            <NexusLogo size={28} variant="icon" />
            <Tooltip title="Expand sidebar" placement="right">
              <IconButton size="small" onClick={() => setCollapsed(false)}>
                <ChevronRight fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 64 }}>
            <NexusLogo size={28} variant="full" />
            {isMobile ? (
              <IconButton size="small" aria-label="Close navigation menu" onClick={closeMobile}>
                <Close fontSize="small" />
              </IconButton>
            ) : (
              <Tooltip title="Collapse sidebar" placement="right">
                <IconButton size="small" onClick={() => setCollapsed(true)}>
                  <ChevronLeft fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {!compact && (
          <Box sx={{ px: 2.5, pb: 2 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              Platform Console
            </Typography>
          </Box>
        )}

        <Divider />

        {/* Nav items */}
        <List sx={{ px: compact ? 1 : 1.5, py: 1, flex: 1, minHeight: 0, overflowY: "auto" }}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.href} title={compact ? item.label : ""} placement="right">
                <ListItemButton
                  onClick={() => {
                    router.push(item.href);
                    closeMobile();
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    minHeight: 44,
                    px: compact ? 1.5 : 2,
                    justifyContent: compact ? "center" : "flex-start",
                    backgroundColor: active ? "primary.main" : "transparent",
                    "&:hover": { backgroundColor: active ? "primary.dark" : "action.hover" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: compact ? 0 : 36, color: active ? "#fff" : "text.secondary" }}>
                    {item.href === "/platform/inquiries" && newInquiries > 0 ? (
                      <Badge badgeContent={newInquiries} color="error" max={99} aria-label={`${newInquiries} new inquiries`}>
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  {!compact && (
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { variant: "body2", sx: { fontWeight: active ? 700 : 400, color: active ? "#fff" : "text.primary" } } }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>

        <Divider />

        {/* Back to site */}
        <List sx={{ px: compact ? 1 : 1.5, py: 0.5, flexShrink: 0 }}>
          <Tooltip title={compact ? "Back to Site" : ""} placement="right">
            <ListItemButton
              component={Link}
              href="/"
              onClick={closeMobile}
              sx={{ borderRadius: 2, minHeight: 40, px: compact ? 1.5 : 2, justifyContent: compact ? "center" : "flex-start" }}
            >
              <ListItemIcon sx={{ minWidth: compact ? 0 : 36, color: "text.secondary" }}>
                <Language fontSize="small" />
              </ListItemIcon>
              {!compact && (
                <ListItemText
                  primary="Back to Site"
                  slotProps={{ primary: { variant: "body2", sx: { color: "text.secondary" } } }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </List>

        <Divider />

        {/* Bottom — user + actions */}
        <Box sx={{ p: compact ? 1 : 1.5, flexShrink: 0 }}>
          {!compact && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 2, backgroundColor: "background.default", mb: 1 }}>
              <Avatar sx={{ width: 32, height: 32, backgroundColor: "primary.main", fontSize: 13, fontWeight: 700 }}>
                {user?.name?.charAt(0) ?? "S"}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>{user?.name ?? "Superadmin"}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 0.5, justifyContent: compact ? "center" : "flex-start", flexDirection: compact ? "column" : "row", alignItems: "center" }}>
            <ThemeToggle />
            <Tooltip title="Profile" placement="right">
              <IconButton size="small" onClick={() => setProfileOpen(true)}>
                <Person fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout" placement="right">
              <IconButton size="small" onClick={handleLogout}>
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
          </>
        )}
      </ResponsiveSidebar>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, transition: "all 0.2s ease" }}>
        {isMobile && <MobileTopBar onMenu={() => setMobileOpen(true)}>
          <NexusLogo size={26} variant="full" />
        </MobileTopBar>}
        {children}
      </Box>
    </Box>
  );
}
