"use client";

import { Box } from "@mui/material";
import PlatformBreadcrumbs from "@/components/shared/PlatformBreadcrumbs";
import { useSectionCrumbLabel } from "@/lib/urlSection";

interface DashboardBreadcrumbsProps {
  pathname: string;
  /** The sidebar entries, which name each module page. */
  items: Array<{ label: string; href: string }>;
}

/**
 * The trail above every dashboard page: Dashboard, the module, and the place
 * inside the module that is open (such as Fee Vouchers). The module links back
 * to its own page whenever a place inside it is open. The overview has no trail.
 */
export default function DashboardBreadcrumbs({ pathname, items }: DashboardBreadcrumbsProps) {
  const section = useSectionCrumbLabel();
  const current = items
    .filter((item) => item.href !== "/dashboard" && (pathname === item.href || pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (!current) return null;

  const crumbs = section
    ? [
        { label: "Dashboard", href: "/dashboard" },
        { label: current.label, href: current.href },
        { label: section },
      ]
    : [{ label: "Dashboard", href: "/dashboard" }, { label: current.label }];

  return (
    <Box sx={{ px: { xs: 2, sm: 4 }, pt: 2 }}>
      <PlatformBreadcrumbs crumbs={crumbs} />
    </Box>
  );
}
