"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ThemeProvider as BrandThemeProvider,
  useTheme,
} from "@mui/material/styles";
import AccountBalance from "@mui/icons-material/AccountBalance";
import Assessment from "@mui/icons-material/Assessment";
import Business from "@mui/icons-material/Business";
import AutoStories from "@mui/icons-material/AutoStories";
import Campaign from "@mui/icons-material/Campaign";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Dashboard from "@mui/icons-material/Dashboard";
import Groups from "@mui/icons-material/Groups";
import Language from "@mui/icons-material/Language";
import Logout from "@mui/icons-material/Logout";
import ManageAccounts from "@mui/icons-material/ManageAccounts";
import Person from "@mui/icons-material/Person";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import Shield from "@mui/icons-material/Shield";
import Today from "@mui/icons-material/Today";
import Tune from "@mui/icons-material/Tune";
import NexusLogo from "@/components/shared/NexusLogo";
import ResponsiveSidebar, { useIsMobileLayout } from "@/components/shared/ResponsiveSidebar";
import MobileTopBar from "@/components/shared/MobileTopBar";
import Close from "@mui/icons-material/Close";
import ProfileDialog from "@/components/shared/ProfileDialog";
import ThemeToggle from "@/components/shared/ThemeToggle";
import NoticeBell from "@/components/dashboard/NoticeBell";
import TrialBanner from "@/components/dashboard/TrialBanner";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useMessage } from "@/contexts/MessageContext";
import {
  ModuleKey,
  PermissionAction,
  RuntimeConfigProvider,
  useRuntimeConfig,
} from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { authService } from "@/services/auth.service";
import { buildBrandedTheme } from "@/theme/branded-theme";
import DashboardBreadcrumbs from "@/components/shared/DashboardBreadcrumbs";
import { HEX_COLOR_6, mergeLegacyBranding, sanitizeTokenOverrides } from "@/theme/branding-tokens";

const DRAWER_EXPANDED = 240;
const DRAWER_COLLAPSED = 64;

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  module?: ModuleKey;
  /** Visible when the institution has the module, with no permission needed (students and guardians). */
  requiresModule?: ModuleKey;
  roles?: UserRole[];
  permission?: { feature: string; action: PermissionAction };
}

const navItems: NavItem[] = [
  { label: "Overview",      href: "/dashboard",               icon: <Dashboard /> },
  // Module items are permission-driven: visible when the institution has the
  // module AND the user can at least view it (templates/overrides included).
  { label: "People",        href: "/dashboard/people",        icon: <Groups />,         module: "PEOPLE" },
  { label: "Academics",     href: "/dashboard/academics",     icon: <SchoolOutlined />, module: "ACADEMICS" },
  { label: "Attendance",    href: "/dashboard/attendance",    icon: <Today />,          module: "ATTENDANCE" },
  { label: "Finance",       href: "/dashboard/finance",       icon: <AccountBalance />, module: "FINANCE" },
  { label: "Notices",       href: "/dashboard/notices",       icon: <Campaign />,       module: "NOTICES" },
  { label: "Exams",         href: "/dashboard/exams",         icon: <AutoStories />,    module: "EXAMINATIONS" },
  { label: "My Exams",      href: "/dashboard/my-exams",      icon: <AutoStories />,    requiresModule: "EXAMINATIONS", roles: ["STUDENT", "GUARDIAN"] },
  { label: "My Fees",       href: "/dashboard/my-fees",       icon: <AccountBalance />, requiresModule: "FINANCE", roles: ["STUDENT", "GUARDIAN"] },
  { label: "Campuses",      href: "/dashboard/campuses",      icon: <Business />,       roles: ["ADMIN"] },
  { label: "Users",         href: "/dashboard/users",         icon: <ManageAccounts />, roles: ["ADMIN"] },
  { label: "Roles",         href: "/dashboard/roles",         icon: <Shield />,         roles: ["ADMIN"] },
  { label: "Custom Fields", href: "/dashboard/custom-fields", icon: <Tune />,           roles: ["ADMIN"] },
  // Not role-restricted like the items above: any STAFF actor with a
  // delegated audit_logs.read grant should see it too, not just ADMIN.
  { label: "Activity",      href: "/dashboard/activity",      icon: <Assessment />,     permission: { feature: "audit_logs", action: "read" } },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuth();
  const confirm = useConfirm();
  const { showMessage } = useMessage();
  const { config, isModuleEnabled, canViewModule, can } = useRuntimeConfig();
  const drawerWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_EXPANDED;
  const isMobile = useIsMobileLayout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const outerTheme = useTheme();

  // Institution branding tints the dashboard. Which mode's colors apply follows whichever
  // theme mode is active. Per-token overrides win over the legacy flat color columns, and
  // anything the institution did not set keeps the Nexus default.
  const brandedTheme = useMemo(() => {
    const branding = config?.branding;
    const mode = outerTheme.palette.mode;
    const suffix = mode === "dark" ? "Dark" : "Light";
    const valid = (c: string | null | undefined) => (c && HEX_COLOR_6.test(c) ? c : undefined);
    const merged = mergeLegacyBranding(
      {
        primary: valid(branding?.[`primaryColor${suffix}`]),
        secondary: valid(branding?.[`secondaryColor${suffix}`]),
        background: valid(branding?.[`backgroundColor${suffix}`]),
      },
      sanitizeTokenOverrides(branding?.colorOverrides?.[mode]),
    );
    return buildBrandedTheme(outerTheme, merged);
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
    if (item.module && (!isModuleEnabled(item.module) || !canViewModule(item.module))) return false;
    if (item.requiresModule && !isModuleEnabled(item.requiresModule)) return false;
    if (item.roles && user && !item.roles.includes(user.role)) return false;
    if (item.permission && !can(item.permission.feature, item.permission.action)) return false;
    return true;
  });

  const institutionName = config?.branding?.displayName ?? "Institution";
  const logoUrl = config?.branding?.logoUrl || null;

  return (
    <BrandThemeProvider theme={brandedTheme}>
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Sidebar: a permanent drawer on desktop, a hamburger-opened drawer on phones. */}
      <ResponsiveSidebar collapsed={collapsed} desktopWidth={drawerWidth} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)}>
        {({ compact, isMobile, closeMobile }) => (
          <>
        {/* Logo + collapse toggle */}
        {compact ? (
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
        <List sx={{ px: compact ? 1 : 1.5, py: 1, flex: 1, minHeight: 0, overflowY: "auto" }}>
          {visibleItems.map((item) => {
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
                    {item.icon}
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
                {user?.name?.charAt(0) ?? "U"}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>{user?.name ?? "User"}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{user?.role}</Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 0.5, justifyContent: compact ? "center" : "flex-start", flexDirection: compact ? "column" : "row", alignItems: "center", flexWrap: "wrap" }}>
            <NoticeBell />
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
          {logoUrl ? (
            <Box component="img" src={logoUrl} alt={institutionName} sx={{ height: 28, maxWidth: 160, objectFit: "contain", borderRadius: 1 }} />
          ) : (
            <NexusLogo size={26} variant="full" />
          )}
        </MobileTopBar>}
        <TrialBanner />
        <DashboardBreadcrumbs pathname={pathname} items={navItems} />
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
