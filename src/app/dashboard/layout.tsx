"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Chip,
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
  createTheme,
  ThemeProvider as BrandThemeProvider,
  useTheme,
} from "@mui/material/styles";
import {
  AccountBalance,
  Business,
  ChevronLeft,
  ChevronRight,
  Dashboard,
  Groups,
  Language,
  Logout,
  ManageAccounts,
  Person,
  SchoolOutlined,
  Today,
  Tune,
} from "@mui/icons-material";
import NexusLogo from "@/components/shared/NexusLogo";
import ProfileDialog from "@/components/shared/ProfileDialog";
import ThemeToggle from "@/components/shared/ThemeToggle";
import TrialBanner from "@/components/dashboard/TrialBanner";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useMessage } from "@/contexts/MessageContext";
import {
  ModuleKey,
  RuntimeConfigProvider,
  useRuntimeConfig,
} from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { authService } from "@/services/auth.service";

const DRAWER_EXPANDED = 240;
const DRAWER_COLLAPSED = 64;

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  module?: ModuleKey;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Overview",      href: "/dashboard",               icon: <Dashboard /> },
  // Module items are permission-driven: visible when the institution has the
  // module AND the user can at least view it (templates/overrides included).
  { label: "People",        href: "/dashboard/people",        icon: <Groups />,         module: "PEOPLE" },
  { label: "Academics",     href: "/dashboard/academics",     icon: <SchoolOutlined />, module: "ACADEMICS" },
  { label: "Attendance",    href: "/dashboard/attendance",    icon: <Today />,          module: "ATTENDANCE" },
  { label: "Finance",       href: "/dashboard/finance",       icon: <AccountBalance />, module: "FINANCE" },
  { label: "Campuses",      href: "/dashboard/campuses",      icon: <Business />,       roles: ["ADMIN"] },
  { label: "Users",         href: "/dashboard/users",         icon: <ManageAccounts />, roles: ["ADMIN"] },
  { label: "Custom Fields", href: "/dashboard/custom-fields", icon: <Tune />,           roles: ["ADMIN"] },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuth();
  const confirm = useConfirm();
  const { showMessage } = useMessage();
  const { config, isModuleEnabled, can } = useRuntimeConfig();
  const drawerWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_EXPANDED;
  const outerTheme = useTheme();

  // Institution branding tints the dashboard: valid hex colors from the
  // branding config override the default palette (light/dark base kept).
  const brandedTheme = useMemo(() => {
    const branding = config?.branding;
    const primary =
      branding?.primaryColor && HEX_COLOR.test(branding.primaryColor)
        ? branding.primaryColor
        : undefined;
    const secondary =
      branding?.secondaryColor && HEX_COLOR.test(branding.secondaryColor)
        ? branding.secondaryColor
        : undefined;
    if (!primary && !secondary) return outerTheme;
    return createTheme(outerTheme, {
      palette: {
        ...(primary ? { primary: { main: primary } } : {}),
        ...(secondary ? { secondary: { main: secondary } } : {}),
      },
    });
  }, [outerTheme, config?.branding]);

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign Out",
      message: "Are you sure you want to sign out of Nexus?",
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
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const visibleItems = navItems.filter((item) => {
    if (item.module && (!isModuleEnabled(item.module) || !can(item.module, "view"))) return false;
    if (item.roles && user && !item.roles.includes(user.role)) return false;
    return true;
  });

  const institutionName = config?.branding?.displayName ?? "Institution";
  const logoUrl = config?.branding?.logoUrl || null;

  return (
    <BrandThemeProvider theme={brandedTheme}>
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
            {logoUrl ? (
              <Box
                component="img"
                src={logoUrl}
                alt={institutionName}
                sx={{ width: 28, height: 28, objectFit: "contain", borderRadius: 1 }}
              />
            ) : (
              <NexusLogo size={28} variant="icon" />
            )}
            <Tooltip title="Expand sidebar" placement="right">
              <IconButton size="small" onClick={() => setCollapsed(false)}>
                <ChevronRight fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 64 }}>
            {logoUrl ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                <Box
                  component="img"
                  src={logoUrl}
                  alt={institutionName}
                  sx={{ height: 32, maxWidth: 150, objectFit: "contain", borderRadius: 1 }}
                />
              </Box>
            ) : (
              <NexusLogo size={28} variant="full" />
            )}
            <Tooltip title="Collapse sidebar" placement="right">
              <IconButton size="small" onClick={() => setCollapsed(true)}>
                <ChevronLeft fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {!collapsed && (
          <Box sx={{ px: 2.5, pb: 2 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }} noWrap>
              {institutionName}
            </Typography>
            {config?.subscription?.planName && (
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={`${config.subscription.planName} · ${config.subscription.status}`}
                  size="small"
                  color={config.subscription.status === "ACTIVE" || config.subscription.status === "TRIAL" ? "success" : "warning"}
                  sx={{ fontSize: 10, height: 20 }}
                />
              </Box>
            )}
          </Box>
        )}

        <Divider />

        {/* Nav items */}
        <List sx={{ px: collapsed ? 1 : 1.5, py: 1, flex: 1 }}>
          {visibleItems.map((item) => {
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
                {user?.name?.charAt(0) ?? "U"}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>{user?.name ?? "User"}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{user?.role}</Typography>
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
        <TrialBanner />
        {children}
      </Box>
    </Box>
    </BrandThemeProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RuntimeConfigProvider>
      <DashboardShell>{children}</DashboardShell>
    </RuntimeConfigProvider>
  );
}
