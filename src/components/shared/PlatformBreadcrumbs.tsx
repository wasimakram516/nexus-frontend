import Link from "next/link";
import { Breadcrumbs, Typography } from "@mui/material";
import { NavigateNext } from "@mui/icons-material";

interface Crumb {
  label: string;
  href?: string;
}

export default function PlatformBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Breadcrumbs
      separator={<NavigateNext fontSize="small" sx={{ color: "text.disabled" }} />}
      sx={{ mb: { xs: 2, sm: 3 } }}
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return isLast ? (
          <Typography key={crumb.label} variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
            {crumb.label}
          </Typography>
        ) : (
          <Link key={crumb.label} href={crumb.href!} style={{ textDecoration: "none" }}>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", "&:hover": { color: "primary.main" }, transition: "color 0.15s" }}
            >
              {crumb.label}
            </Typography>
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
