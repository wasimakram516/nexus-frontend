import type { Metadata } from "next";
import Link from "next/link";
import {
  AutoAwesome,
  CheckCircle,
  Insights,
  Psychology,
  SchoolOutlined,
  Settings,
  SmartToy,
  Timeline,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccountBalance,
  ArrowForward,
  CalendarToday,
  Groups,
  Tune,
  Verified,
} from "@mui/icons-material";
import { AI_POSITIONING } from "@/content/ai";
import HeroSection from "@/components/public/HeroSection";
import AnimatedSection from "@/components/shared/AnimatedSection";
import CountUp from "@/components/shared/CountUp";

export const metadata: Metadata = {
  title: "Nexus - AI-Assisted Education ERP for Schools, Colleges & Universities",
  description:
    "Nexus is an AI-assisted ERP for educational institutions. Manage academics, attendance, finance, people, and campuses from one connected platform with AI-powered assistance and smarter institutional visibility.",
  openGraph: {
    title: "Nexus - AI-Assisted Education ERP for Schools, Colleges & Universities",
    description:
      "The all-in-one education ERP with AI-powered assistance for students, staff, finance, and multi-campus operations.",
    type: "website",
  },
};

const features = [
  {
    icon: <SchoolOutlined fontSize="large" />,
    title: "Academics",
    desc: "Levels, classes, sections, and subjects with cleaner academic structure and AI-ready planning context.",
  },
  {
    icon: <Groups fontSize="large" />,
    title: "People",
    desc: "Students, teachers, and guardians with connected profiles and AI-assisted record discovery potential.",
  },
  {
    icon: <CalendarToday fontSize="large" />,
    title: "Attendance",
    desc: "Daily timing, leave tracking, and attendance patterns that support AI-powered operational insight.",
  },
  {
    icon: <AccountBalance fontSize="large" />,
    title: "Finance",
    desc: "Fee vouchers, payroll, discounts, and bank operations with AI-assisted visibility into institutional finance.",
  },
  {
    icon: <Verified fontSize="large" />,
    title: "Multi-Campus",
    desc: "One platform, many campuses, with cleaner oversight and a stronger base for AI-assisted control.",
  },
  {
    icon: <Tune fontSize="large" />,
    title: "Custom Fields",
    desc: "Extend entities with institution-specific fields that keep Nexus flexible and AI-ready.",
  },
];

const stats = [
  { value: "10+", label: "Connected modules" },
  { value: "6", label: "User roles" },
  { value: "Multi", label: "Campus-ready" },
  { value: "AI", label: "Powered assistance" },
];

const workflowSteps = [
  {
    title: "Structure the institution once",
    body:
      "Set up campuses, academics, people, and policy logic in one connected base instead of rebuilding the same structure across separate tools.",
    icon: <SchoolOutlined sx={{ fontSize: 18 }} />,
  },
  {
    title: "Run daily operations with shared context",
    body:
      "Attendance, fee workflows, payroll, and records all work from the same academic and campus reality, which reduces duplicate entry and reconciliation work.",
    icon: <Timeline sx={{ fontSize: 18 }} />,
  },
  {
    title: "Use Nexus AI for guided help and visibility",
    body:
      "Nexus AI helps users understand the platform faster today and creates a path toward broader AI-powered insights across the operational data already inside the ERP.",
    icon: <SmartToy sx={{ fontSize: 18 }} />,
  },
];

const aiSignals = [
  {
    title: "Nexus AI as your front door",
    body:
      "Ask about features, pricing, rollout direction, or how modules fit together, and get AI-powered guidance grounded in the product story rather than a generic widget experience.",
    icon: <AutoAwesome sx={{ fontSize: 22 }} />,
  },
  {
    title: "Smarter operational visibility",
    body:
      "Because attendance, finance, people, and academic structure already live together, Nexus is better positioned for AI-assisted visibility that feels credible instead of disconnected.",
    icon: <Insights sx={{ fontSize: 22 }} />,
  },
  {
    title: "AI-ready institutional workflows",
    body:
      "The goal is measured progress: practical assistance today, broader AI-powered insights tomorrow, and workflows that keep getting smarter as the institution grows.",
    icon: <Psychology sx={{ fontSize: 22 }} />,
  },
];

const trustStatements = [
  "Built for schools, colleges, and multi-campus education groups",
  "Connected operations instead of disconnected admin tools",
  "AI-assisted direction without inflated automation claims",
];

export default function LandingPage() {
  return (
    <>
      <HeroSection />

      <AnimatedSection>
        <Box
          sx={{
            backgroundColor: "background.paper",
            py: 6,
            borderTop: "1px solid",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Container maxWidth="xl">
            <Grid container spacing={3} sx={{ justifyContent: "center" }}>
              {stats.map((stat) => (
                <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                  <Box sx={{ textAlign: "center" }}>
                    <CountUp value={stat.value} />
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </AnimatedSection>

      <AnimatedSection delay={0.05}>
        <Box sx={{ py: { xs: 7, md: 10 }, backgroundColor: "background.paper" }}>
          <Container maxWidth="xl">
            <Grid container spacing={5} sx={{ alignItems: "start" }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 100, mb: 1.5 }}>
                  How Nexus{" "}
                  <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                    works together
                  </Box>
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, mb: 2.5 }}>
                  The value of an ERP is not in having many modules. It is in making those modules
                  reinforce each other so your institution spends less time stitching data together
                  and more time acting on it.
                </Typography>
                <Stack spacing={1.25}>
                  {trustStatements.map((statement) => (
                    <Box key={statement} sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                      <CheckCircle sx={{ color: "success.main", fontSize: 18, mt: 0.35 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {statement}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                <Grid container spacing={3}>
                  {workflowSteps.map((step, index) => (
                    <Grid size={{ xs: 12, md: 4 }} key={step.title}>
                      <Card
                        sx={{
                          height: "100%",
                          border: "1px solid",
                          borderColor: "divider",
                          backgroundColor: "background.default",
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: 3,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "rgba(5,150,105,0.12)",
                              color: "primary.main",
                              mb: 2,
                            }}
                          >
                            {step.icon}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "primary.main",
                              fontWeight: 700,
                              letterSpacing: 1.1,
                              textTransform: "uppercase",
                            }}
                          >
                            Step {index + 1}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, mt: 1, mb: 1.25 }}>
                            {step.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.85 }}>
                            {step.body}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: "background.default" }}>
          <Container maxWidth="xl">
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography variant="h4" sx={{ fontWeight: 100, mb: 1.5 }}>
                Everything your institution{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  needs
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: "auto" }}>
                From first-day enrollment to end-of-year payroll, Nexus handles the full lifecycle
                with connected operations and an AI-assisted layer that helps teams work smarter.
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 760, mx: "auto", mt: 2, lineHeight: 1.9 }}
              >
                {AI_POSITIONING.long}
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
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 6,
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ color: "primary.main", mb: 2 }}>{feature.icon}</Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ textAlign: "center", mt: 6 }}>
              <Link href="/features">
                <Button variant="outlined" size="large" endIcon={<ArrowForward />}>
                  Explore All Features
                </Button>
              </Link>
            </Box>
          </Container>
        </Box>
      </AnimatedSection>

      <AnimatedSection delay={0.15}>
        <Box sx={{ py: { xs: 7, md: 10 }, backgroundColor: "background.paper" }}>
          <Container maxWidth="xl">
            <Grid container spacing={5} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="h4" sx={{ fontWeight: 100, mb: 1.5 }}>
                  Why the{" "}
                  <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                    AI-assisted layer
                  </Box>{" "}
                  matters
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, mb: 2.5 }}>
                  We are not positioning Nexus as hype-first AI software. We are positioning it as a
                  connected education ERP that already includes AI-powered assistance and can grow
                  into smarter institutional visibility because the operational context is already in
                  the platform.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                  That is the difference between a shiny chatbot and a useful AI-assisted product
                  direction. The more connected the academics, attendance, finance, people, and
                  campus data become, the more useful the assistance layer becomes too.
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <Grid container spacing={3}>
                  {aiSignals.map((signal) => (
                    <Grid size={{ xs: 12, md: 4 }} key={signal.title}>
                      <Card
                        sx={{
                          height: "100%",
                          border: "1px solid",
                          borderColor: "divider",
                          backgroundColor: "background.default",
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box
                            sx={{
                              width: 46,
                              height: 46,
                              borderRadius: 3,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "rgba(5,150,105,0.12)",
                              color: "primary.main",
                              mb: 2,
                            }}
                          >
                            {signal.icon}
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.25 }}>
                            {signal.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.85 }}>
                            {signal.body}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <Box sx={{ backgroundColor: "primary.main", py: { xs: 8, md: 10 }, textAlign: "center" }}>
          <Container maxWidth="sm">
            <Typography variant="h4" sx={{ fontWeight: 100, color: "#fff", mb: 2 }}>
              Ready to{" "}
              <Box component="span" sx={{ fontWeight: 800 }}>
                modernize
              </Box>{" "}
              your institution?
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.85)", mb: 4 }}>
              Modernize with connected operations, AI-powered assistance, and a product direction
              built for smarter institutional decisions.
            </Typography>
            <Link href="/contact">
              <Button
                variant="contained"
                size="large"
                startIcon={<Settings />}
                sx={{
                  backgroundColor: "#fff",
                  color: "primary.dark",
                  fontWeight: 700,
                  px: 5,
                  "&:hover": { backgroundColor: "#F0FDF4" },
                }}
              >
                Talk to the Nexus Team
              </Button>
            </Link>
          </Container>
        </Box>
      </AnimatedSection>
    </>
  );
}
