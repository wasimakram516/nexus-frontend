import type { Metadata } from "next";
import { Box, Card, CardContent, Container, Divider, Grid, Typography } from "@mui/material";
import { BarChart, Lock, RocketLaunch, School } from "@mui/icons-material";
import PageBreadcrumbs from "@/components/shared/PageBreadcrumbs";
import AnimatedSection from "@/components/shared/AnimatedSection";
import CountUp from "@/components/shared/CountUp";

export const metadata: Metadata = {
  title: "About — Nexus Education ERP",
  description:
    "Learn about Nexus — the multi-campus ERP built by Wisemen Soft to modernize education management across the GCC region.",
};

const values = [
  {
    icon: <School />,
    title: "Education First",
    desc: "Every feature is designed around how real educational institutions operate — not retrofitted from generic enterprise software.",
  },
  {
    icon: <RocketLaunch />,
    title: "Multi-Campus by Design",
    desc: "Nexus was architected from day one to handle multiple campuses. It's not a single-school tool with multi-campus bolted on.",
  },
  {
    icon: <Lock />,
    title: "You Own Your Data",
    desc: "No hidden fees, no lock-in. Your institution's data belongs to you and can be exported at any time.",
  },
  {
    icon: <BarChart />,
    title: "Built to Evolve",
    desc: "We ship continuous improvements based on direct feedback from administrators, faculty, and finance teams using Nexus daily.",
  },
];

const stats = [
  { value: "2020", label: "Started as Desktop App" },
  { value: "2026", label: "Web Version Launched" },
  { value: "6+", label: "User Roles" },
  { value: "∞", label: "Campuses Supported" },
];

const story = [
  {
    year: "2020",
    title: "It started as a desktop app",
    body: "Nexus began in 2020 as a desktop application — built to solve a real problem seen firsthand at educational institutions struggling with disconnected tools. Attendance in spreadsheets, fees in separate billing software, payroll calculated manually. The desktop version proved the concept worked.",
  },
  {
    year: "2026",
    title: "Rebuilt for the web",
    body: "In 2026, Nexus was rebuilt from the ground up as a modern web platform. Multi-campus support, real-time updates, role-based access, and a fully documented API — everything the desktop version couldn't be. One platform, accessible from anywhere.",
  },
  {
    year: "Now",
    title: "A full ERP for any educational institution",
    body: "Nexus today covers academics, people management, attendance, finance, multi-campus operations, and custom fields. It's designed to scale from a single-campus school to a multi-branch university network — without ever needing to switch tools.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h2" sx={{ fontWeight: 100, mb: 3, lineHeight: 1.3 }}>
                We built Nexus because{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  education ops deserved better
                </Box>
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, lineHeight: 1.8 }}>
                Fragmented spreadsheets, disconnected attendance tools, manual payroll — we saw
                these problems firsthand across institutions in the GCC. Nexus is our answer:
                one unified platform that actually fits how schools, colleges, and universities work.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Grid container spacing={2}>
                {stats.map((s) => (
                  <Grid size={{ xs: 6 }} key={s.label}>
                    <Card sx={{ p: 1, border: "1px solid", borderColor: "divider", backgroundColor: "background.default" }}>
                      <CardContent>
                        <CountUp value={s.value} />
                        <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Story */}
      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">
          <Typography variant="h4" sx={{ fontWeight: 100, mb: 8 }}>
            How Nexus{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>came to be</Box>
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {story.map((s, i) => (
              <Box key={s.year}>
                <Grid container spacing={6} sx={{ py: 5 }}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 2 }}>
                      {s.year}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>{s.title}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 9 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                      {s.body}
                    </Typography>
                  </Grid>
                </Grid>
                {i < story.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 8 }} />

          {/* Values */}
          <Typography variant="h4" sx={{ fontWeight: 100, mb: 6 }}>
            What we{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>stand for</Box>
          </Typography>

          <Grid container spacing={3}>
            {values.map((v) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={v.title}>
                <Card sx={{ height: "100%", p: 1, border: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
                  <CardContent>
                    <Box sx={{ color: "primary.main", mb: 2 }}>{v.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{v.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                      {v.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 8 }} />

          {/* Wisemen Soft */}
          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h4" sx={{ fontWeight: 100, mb: 2 }}>
                A product of{" "}
                <Box
                  component="a"
                  href="https://wisemensoft.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ fontWeight: 800, color: "primary.main", textDecoration: "none", "&:hover": { color: "primary.light" } }}
                >
                  Wisemen Soft
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                Wisemen Soft is a software house specializing in enterprise and SaaS products
                for clients across Pakistan and the GCC region. We build software that solves
                real operational problems — and Nexus is our most ambitious one yet.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: 4, borderRadius: 3, border: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, fontStyle: "italic" }}>
                  &ldquo;We&apos;ve shipped software for insurance platforms, event management systems,
                  and real-time dashboards. But education kept pulling us back — it&apos;s one of
                  the most underserved sectors when it comes to quality operational software.
                  Nexus is us fixing that.&rdquo;
                </Typography>
                <Typography variant="body2" color="primary" sx={{ mt: 2, fontWeight: 700 }}>
                  — Wisemen Soft Team
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
