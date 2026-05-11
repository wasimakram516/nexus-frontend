"use client";

import Link from "next/link";
import { Box, Button, Chip, Container, Typography } from "@mui/material";
import { ArrowForward, RocketLaunch } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";

export default function HeroSection() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        background: isDark
          ? "linear-gradient(135deg, #0A1410 0%, #0D2318 50%, #0A1410 100%)"
          : "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #F0FDF4 100%)",
        py: { xs: 10, md: 16 },
        textAlign: "center",
      }}
    >
      <Container maxWidth="lg">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Chip label="Now in Beta" color="primary" size="small" sx={{ mb: 3 }} />
        <Typography
          variant="h2"
          sx={{ color: "text.primary", mb: 2, fontSize: { xs: "2rem", md: "3.5rem" }, lineHeight: 1.3, fontWeight: 100 }}
        >
          The ERP That{" "}
          <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>Runs</Box>{" "}
          Your Entire{" "}
          <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>Institution.</Box>
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 5, fontWeight: 400, maxWidth: 560, mx: "auto" }}>
          Nexus is the all-in-one ERP built for schools, colleges, and universities.
          Academics, attendance, finance, and HR — unified across every campus.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/contact">
            <Button variant="contained" size="large" startIcon={<RocketLaunch />} sx={{ px: 4, py: 1.5 }}>
              Request a Demo
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outlined" size="large" endIcon={<ArrowForward />} sx={{ px: 4, py: 1.5 }}>
              View Pricing
            </Button>
          </Link>
        </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
