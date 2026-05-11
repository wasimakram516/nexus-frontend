"use client";

import Link from "next/link";
import { Box, Container, Divider, Grid, Typography } from "@mui/material";
import NexusLogo from "@/components/shared/NexusLogo";

const footerLinks = {
  Product: [
    { label: "All Features", href: "/features" },
    { label: "Academics", href: "/features/academics" },
    { label: "People", href: "/features/people" },
    { label: "Attendance", href: "/features/attendance" },
    { label: "Finance", href: "/features/finance" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Cookie Policy", href: "/cookie-policy" },
  ],
};

export default function PublicFooter() {
  return (
    <Box
      component="footer"
      sx={{ backgroundColor: "background.paper", borderTop: "1px solid", borderColor: "divider", pt: 6, pb: 4, mt: "auto" }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box component={Link} href="/" sx={{ display: "inline-flex", mb: 1.5, textDecoration: "none" }}>
              <NexusLogo size={44} variant="full" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
              The all-in-one ERP for schools, colleges, and universities. Built by Wisemen Soft.
            </Typography>
          </Grid>

          {Object.entries(footerLinks).map(([section, links]) => (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={section}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                {section}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {links.map((link) => (
                  <Typography
                    key={link.href}
                    component={Link}
                    href={link.href}
                    variant="body2"
                    sx={{ textDecoration: "none", color: "text.secondary", "&:hover": { color: "primary.main" }, transition: "color 0.2s" }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Nexus. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Powered by</Typography>
            <Box
              component="a"
              href="https://wisemensoft.com"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "flex", alignItems: "center", textDecoration: "none", opacity: 0.85, "&:hover": { opacity: 1 }, transition: "opacity 0.2s" }}
            >
              <Box component="img" src="/icons/wisemensoft-logo.svg" alt="Wisemen Soft" sx={{ height: 24 }} />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
