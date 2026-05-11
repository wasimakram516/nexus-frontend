import type { Metadata } from "next";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import {
  AccountBalance,
  ArrowForward,
  CalendarToday,
  CheckCircle,
  Groups,
  SchoolOutlined,
  Settings,
  Tune,
  Verified,
} from "@mui/icons-material";
import HeroSection from "@/components/public/HeroSection";
import AnimatedSection from "@/components/shared/AnimatedSection";
import CountUp from "@/components/shared/CountUp";

export const metadata: Metadata = {
  title: "Nexus — Education ERP for Schools, Colleges & Universities",
  description:
    "Nexus is a powerful ERP for educational institutions. Manage academics, attendance, finance, and staff across multiple campuses from a single platform.",
  openGraph: {
    title: "Nexus — Education ERP for Schools, Colleges & Universities",
    description: "The all-in-one ERP for managing students, staff, fees, and campuses.",
    type: "website",
  },
};

const features = [
  { icon: <SchoolOutlined fontSize="large" />, title: "Academics", desc: "Levels, classes, sections, and subjects — structured the way your institution operates." },
  { icon: <Groups fontSize="large" />, title: "People", desc: "Students, teachers, and guardians with complete profiles and history." },
  { icon: <CalendarToday fontSize="large" />, title: "Attendance", desc: "Daily check-in/out, leave tracking, and auto-absent marking with summaries." },
  { icon: <AccountBalance fontSize="large" />, title: "Finance", desc: "Fee vouchers, salary payroll, discounts, fines, and bank account management." },
  { icon: <Verified fontSize="large" />, title: "Multi-Campus", desc: "One platform, many campuses. Assign staff, track data per location." },
  { icon: <Tune fontSize="large" />, title: "Custom Fields", desc: "Extend any entity with dynamic fields tailored to your institution's needs." },
];

const stats = [
  { value: "10+", label: "Modules" },
  { value: "6", label: "User Roles" },
  { value: "∞", label: "Campuses" },
  { value: "100%", label: "Cloud-based" },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Stats */}
      <AnimatedSection>
      <Box sx={{ backgroundColor: "background.paper", py: 6, borderTop: "1px solid", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Grid container spacing={3} sx={{ justifyContent: "center" }}>
            {stats.map((stat) => (
              <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                <Box sx={{ textAlign: "center" }}>
                  <CountUp value={stat.value} />
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      </AnimatedSection>

      {/* Features */}
      <AnimatedSection delay={0.1}>
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography variant="h4" sx={{ fontWeight: 100, mb: 1.5 }}>
              Everything your institution{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>needs</Box>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mx: "auto" }}>
              From first-day enrollment to end-of-year payroll — Nexus handles the full lifecycle.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {features.map((feature) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.title}>
                <Card
                  sx={{
                    height: "100%",
                    p: 1,
                    backgroundColor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: 6, borderColor: "primary.main" },
                  }}
                >
                  <CardContent>
                    <Box sx={{ color: "primary.main", mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{feature.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{feature.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: "center", mt: 6 }}>
            <Link href="/features">
              <Button variant="outlined" size="large" endIcon={<ArrowForward />}>Explore All Features</Button>
            </Link>
          </Box>
        </Container>
      </Box>

      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection delay={0.1}>
        <Box sx={{ backgroundColor: "primary.main", py: { xs: 8, md: 10 }, textAlign: "center" }}>
          <Container maxWidth="sm">
            <Typography variant="h4" sx={{ fontWeight: 100, color: "#fff", mb: 2 }}>
              Ready to{" "}
              <Box component="span" sx={{ fontWeight: 800 }}>modernize</Box>{" "}
              your institution?
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.85)", mb: 4 }}>
              Trusted by schools, colleges, and universities across the GCC region.
            </Typography>
            <Link href="/contact">
              <Button variant="contained" size="large" startIcon={<Settings />} sx={{ backgroundColor: "#fff", color: "primary.dark", fontWeight: 700, px: 5, "&:hover": { backgroundColor: "#F0FDF4" } }}>
                Get Started
              </Button>
            </Link>
          </Container>
        </Box>
      </AnimatedSection>
    </>
  );
}
