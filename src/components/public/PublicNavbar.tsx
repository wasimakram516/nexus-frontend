"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  AccountBalance,
  AssignmentTurnedIn,
  BarChart,
  CalendarToday,
  Close as CloseIcon,
  ExpandMore,
  Groups,
  KeyboardArrowRight,
  Login,
  Menu as MenuIcon,
  SchoolOutlined,
  Tune,
  Verified,
} from "@mui/icons-material";
import ThemeToggle from "@/components/shared/ThemeToggle";
import NexusLogo from "@/components/shared/NexusLogo";
import { useAuth } from "@/contexts/AuthContext";

const featureItems = [
  { label: "Academics", href: "/features/academics", icon: <SchoolOutlined fontSize="small" /> },
  { label: "People", href: "/features/people", icon: <Groups fontSize="small" /> },
  { label: "Attendance", href: "/features/attendance", icon: <CalendarToday fontSize="small" /> },
  { label: "Finance", href: "/features/finance", icon: <AccountBalance fontSize="small" /> },
  { label: "Examinations", href: "/features/examinations", icon: <AssignmentTurnedIn fontSize="small" /> },
  { label: "Reporting", href: "/features/reporting", icon: <BarChart fontSize="small" /> },
  { label: "Multi-Campus", href: "/features/campuses", icon: <Verified fontSize="small" /> },
  { label: "Custom Fields", href: "/features/custom-fields", icon: <Tune fontSize="small" /> },
];

const simpleLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
];

export default function PublicNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [featuresAnchor, setFeaturesAnchor] = useState<null | HTMLElement>(null);
  const { user } = useAuth();
  const dashboardHref = user?.role === "SUPERADMIN" ? "/platform" : "/dashboard";

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Box
            component={Link}
            href="/"
            onClick={(e: React.MouseEvent) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            sx={{ display: "flex", alignItems: "center", mr: 4, textDecoration: "none" }}
          >
            <NexusLogo size={32} variant="full" />
          </Box>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, flex: 1, alignItems: "center" }}>
            {/* Features dropdown */}
            <Button
              color="inherit"
              size="small"
              endIcon={<ExpandMore sx={{ fontSize: "16px !important", transition: "transform 0.2s", transform: featuresAnchor ? "rotate(180deg)" : "none" }} />}
              onClick={(e) => setFeaturesAnchor(e.currentTarget)}
              sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
            >
              Features
            </Button>
            <Menu
              anchorEl={featuresAnchor}
              open={Boolean(featuresAnchor)}
              onClose={() => setFeaturesAnchor(null)}
              slotProps={{ paper: { sx: { mt: 1, minWidth: 220, border: "1px solid", borderColor: "divider" } } }}
            >
              <MenuItem component={Link} href="/features" onClick={() => setFeaturesAnchor(null)} sx={{ fontWeight: 600, color: "primary.main" }}>
                All Features <KeyboardArrowRight fontSize="small" sx={{ ml: "auto" }} />
              </MenuItem>
              <Divider />
              {featureItems.map((item) => (
                <MenuItem key={item.href} component={Link} href={item.href} onClick={() => setFeaturesAnchor(null)}>
                  <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>

            {simpleLinks.map((link) => (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                color="inherit"
                size="small"
                sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
            <ThemeToggle />
            {user ? (
              <Button component={Link} href={dashboardHref} variant="contained" size="small">
                Go to Dashboard
              </Button>
            ) : (
              <Button component={Link} href="/login" variant="contained" size="small" startIcon={<Login />}>
                Sign In
              </Button>
            )}
          </Box>

          {/* Mobile */}
          <Box sx={{ display: { xs: "flex", md: "none" }, ml: "auto", alignItems: "center", gap: 1 }}>
            <ThemeToggle />
            <IconButton onClick={() => setDrawerOpen(true)} color="inherit">
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, pt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, mb: 1 }}>
            <NexusLogo size={28} variant="full" />
            <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <Divider />
          <List dense>
            <ListItemButton component={Link} href="/features" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="Features" slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
            </ListItemButton>
            {featureItems.map((item) => (
              <ListItemButton key={item.href} component={Link} href={item.href} onClick={() => setDrawerOpen(false)} sx={{ pl: 4 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 1 }} />
            {simpleLinks.map((link) => (
              <ListItemButton key={link.href} component={Link} href={link.href} onClick={() => setDrawerOpen(false)}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
            {user ? (
              <Button component={Link} href={dashboardHref} variant="contained" fullWidth onClick={() => setDrawerOpen(false)}>
                Go to Dashboard
              </Button>
            ) : (
              <Button component={Link} href="/login" variant="contained" fullWidth startIcon={<Login />} onClick={() => setDrawerOpen(false)}>
                Sign In
              </Button>
            )}
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}
