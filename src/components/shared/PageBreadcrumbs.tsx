import Link from "next/link";
import { Box, Breadcrumbs, Typography } from "@mui/material";
import { Home, NavigateNext } from "@mui/icons-material";

interface Crumb {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export default function PageBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 4 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
        <Home sx={{ fontSize: 16, color: "text.secondary" }} />
        <Box component="span" sx={{ color: "text.secondary", fontSize: 14, "&:hover": { color: "text.primary" } }}>
          Home
        </Box>
      </Link>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return isLast ? (
          <Box key={crumb.label} sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "primary.main", fontSize: 14 }}>
            {crumb.icon}
            {crumb.label}
          </Box>
        ) : (
          <Link key={crumb.label} href={crumb.href!} style={{ display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
            {crumb.icon && <Box sx={{ color: "text.secondary", display: "flex", fontSize: 16 }}>{crumb.icon}</Box>}
            <Box component="span" sx={{ color: "text.secondary", fontSize: 14, "&:hover": { color: "text.primary" } }}>
              {crumb.label}
            </Box>
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
