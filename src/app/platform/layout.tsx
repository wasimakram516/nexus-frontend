"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AccountTree,
  Assessment,
  ChevronLeft,
  ChevronRight,
  Dashboard,
  Delete,
  Layers,
  Language,
  Logout,
  Person,
} from "@mui/icons-material";
import NexusLogo from "@/components/shared/NexusLogo";
import ProfileDialog from "@/components/shared/ProfileDialog";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { authService } from "@/services/auth.service";

const DRAWER_EXPANDED = 240;
const DRAWER_COLLAPSED = 64;

const navItems = [
  { label: "Overview",       href: "/platform",              icon: <Dashboard /> },
  { label: "Institutions",   href: "/platform/institutions", icon: <AccountTree /> },
  { label: "Plans",          href: "/platform/plans",        icon: <Layers /> },
  { label: "Audit Logs",     href: "/platform/audit-logs",   icon: <Assessment /> },
  { label: "Recycle Bin",    href: "/platform/recycle-bin",  icon: <Delete /> },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuth();
  const confirm = useConfirm();
  const { showMessage } = useMessage();
  const drawerWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_EXPANDED;

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
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            transition: "width 0.2s ease",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Logo + collapse toggle */}
        {collapsed ? (
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
            <Tooltip title="Collapse sidebar" placement="right">
              <IconButton size="small" onClick={() => setCollapsed(true)}>
                <ChevronLeft fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {!collapsed && (
          <Box sx={{ px: 2.5, pb: 2 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              Platform Console
            </Typography>
          </Box>
        )}

        <Divider />

        {/* Nav items */}
        <List sx={{ px: collapsed ? 1 : 1.5, py: 1, flex: 1 }}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.href} title={collapsed ? item.label : ""} placement="right">
                <ListItemButton
                  onClick={() => router.push(item.href)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    minHeight: 44,
                    px: collapsed ? 1.5 : 2,
                    justifyContent: collapsed ? "center" : "flex-start",
                    backgroundColor: active ? "primary.main" : "transparent",
                    "&:hover": { backgroundColor: active ? "primary.dark" : "action.hover" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: active ? "#fff" : "text.secondary" }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
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
        <List sx={{ px: collapsed ? 1 : 1.5, py: 0.5 }}>
          <Tooltip title={collapsed ? "Back to Site" : ""} placement="right">
            <ListItemButton
              component={Link}
              href="/"
              sx={{ borderRadius: 2, minHeight: 40, px: collapsed ? 1.5 : 2, justifyContent: collapsed ? "center" : "flex-start" }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: "text.secondary" }}>
                <Language fontSize="small" />
              </ListItemIcon>
              {!collapsed && (
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
        <Box sx={{ p: collapsed ? 1 : 1.5 }}>
          {!collapsed && (
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

          <Box sx={{ display: "flex", gap: 0.5, justifyContent: collapsed ? "center" : "flex-start", flexDirection: collapsed ? "column" : "row", alignItems: "center" }}>
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
      </Drawer>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, transition: "all 0.2s ease" }}>
        {children}
      </Box>
    </Box>
  );
}
