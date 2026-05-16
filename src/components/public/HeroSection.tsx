"use client";

import Link from "next/link";
import { ArrowForward, RocketLaunch } from "@mui/icons-material";
import { Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { AI_POSITIONING } from "@/content/ai";

const heroTags = [
  "Academics",
  "People",
  "Attendance",
  "Finance",
  "Multi-campus",
  "Nexus AI",
];

export default function HeroSection() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        background: isDark
          ? "linear-gradient(180deg, #09140F 0%, #0B1B14 100%)"
          : "linear-gradient(180deg, #F5FFF9 0%, #ECFBF3 100%)",
        py: { xs: 10, md: 15 },
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Chip label={AI_POSITIONING.eyebrow} color="primary" size="small" sx={{ mb: 3 }} />

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.4rem", md: "4.25rem" },
                lineHeight: 1.08,
                fontWeight: 100,
                letterSpacing: "-0.04em",
                color: "text.primary",
                mb: 2.5,
              }}
            >
              A connected education ERP with{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                AI-powered assistance
              </Box>
              .
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: 760,
                mx: "auto",
                lineHeight: 1.85,
                fontWeight: 400,
                mb: 2.25,
              }}
            >
              Nexus helps schools, colleges, and multi-campus institutions run academics,
              attendance, people, finance, and operational oversight from one shared system.
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 760, mx: "auto", lineHeight: 1.9, mb: 4.5 }}
            >
              Nexus AI adds an AI-assisted layer for faster answers, clearer product guidance, and
              a path toward smarter institutional visibility without overcomplicating the core ERP.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ justifyContent: "center", mb: 4 }}
            >
              <Link href="/contact">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RocketLaunch />}
                  sx={{ px: 4.5, py: 1.5 }}
                >
                  Request a Demo
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  variant="outlined"
                  size="large"
                  endIcon={<ArrowForward />}
                  sx={{ px: 4.5, py: 1.5 }}
                >
                  View Pricing
                </Button>
              </Link>
            </Stack>

            <Stack
              direction="row"
              spacing={1.25}
              useFlexGap
              sx={{ justifyContent: "center", flexWrap: "wrap" }}
            >
              {heroTags.map((tag) => (
                <Box
                  key={tag}
                  sx={{
                    px: 1.4,
                    py: 0.9,
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
                    {tag}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
