import type { Metadata } from "next";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import { BarChart, Lock, RocketLaunch, School } from "@mui/icons-material";
import { AI_POSITIONING } from "@/content/ai";
import PageBreadcrumbs from "@/components/shared/PageBreadcrumbs";
import CountUp from "@/components/shared/CountUp";

export const metadata: Metadata = {
  title: "About - Nexus Education ERP by Wisemen Soft",
  description:
    "Learn why Nexus was built, how it evolved from a desktop education system into a modern AI-assisted web ERP, and what Wisemen Soft stands for in education technology.",
};

const values = [
  {
    icon: <School />,
    title: "Education first",
    desc: "Every module is shaped around real academic, administrative, and finance workflows instead of being retrofitted from generic business software assumptions.",
  },
  {
    icon: <RocketLaunch />,
    title: "Built for scale",
    desc: "Nexus was designed to support institutions that begin small and grow across campuses, modules, and operational complexity without rebuilding everything later.",
  },
  {
    icon: <Lock />,
    title: "Operational trust matters",
    desc: "Education systems deal with sensitive people, attendance, and finance records. We treat data ownership, access boundaries, and exportability as product fundamentals.",
  },
  {
    icon: <BarChart />,
    title: "Shaped by real use",
    desc: "The product evolves through practical operational feedback from the kinds of teams who live inside attendance, academics, finance, and admin work every day.",
  },
];

const stats = [
  { value: "2020", label: "Started as desktop software" },
  { value: "2026", label: "Rebuilt for the web" },
  { value: "6+", label: "Core user roles" },
  { value: "Multi", label: "Campus-ready by design" },
];

const story = [
  {
    phase: "Phase 1",
    year: "2020",
    title: "It started with a real operational problem",
    body:
      "Nexus began as a desktop application because the problem was already obvious. Educational institutions were managing attendance in spreadsheets, fees in separate billing tools, salary calculations by hand, and student records in scattered formats that never stayed aligned for long.",
  },
  {
    phase: "Validation",
    year: "2020-2025",
    title: "The product idea was proven in the field",
    body:
      "The early version showed something important: institutions did not only need digital forms. They needed their operational layers to work together. Once people, academics, attendance, and finance started sharing context, administration became faster and less fragile.",
  },
  {
    phase: "Web Rebuild",
    year: "2026",
    title: "Nexus was rebuilt as a modern web ERP",
    body:
      "The web rebuild was not just a redesign. It was a structural shift toward multi-campus operations, role-based access, live institutional workflows, stronger APIs, and a product that could serve serious growth without being trapped by desktop-era limits.",
  },
  {
    phase: "Today",
    year: "Current Direction",
    title: "A platform for real institutional operations",
    body:
      "Today Nexus covers academics, people management, attendance, finance, examinations, reporting, and multi-campus structure in one connected direction. It already includes AI-powered assistance through Nexus AI and is evolving toward broader AI-assisted operations and smarter institutional decision support.",
  },
];

const perspectivePoints = [
  "Educational institutions usually do not suffer from a lack of software. They suffer from software that does not speak to the rest of their operation.",
  "A good ERP for education should reduce reconciliation work, not create more of it at the end of every month or term.",
  "The real test of a product is whether academic staff, administrators, finance teams, and leadership can all trust the same operational picture.",
];

export default function AboutPage() {
  return (
    <>
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl">
          <PageBreadcrumbs crumbs={[{ label: "About" }]} />

          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h2" sx={{ fontWeight: 100, mb: 3, lineHeight: 1.3 }}>
                We built Nexus because{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  education operations deserved better
                </Box>
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontWeight: 400, lineHeight: 1.8, mb: 3 }}
              >
                Nexus exists because fragmented education operations create real
                friction. Attendance lives in one place, fee tracking in another,
                payroll in side calculations, and leadership reporting becomes a
                cleanup exercise at the end of every cycle.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                We wanted a better answer than another isolated admin tool. The
                result is a connected education ERP designed around how schools,
                colleges, and multi-campus institutions actually work, not how
                generic enterprise software assumes they should work.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Grid container spacing={2}>
                {stats.map((stat) => (
                  <Grid size={{ xs: 6 }} key={stat.label}>
                    <Card
                      sx={{
                        p: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "background.default",
                      }}
                    >
                      <CardContent>
                        <CountUp value={stat.value} />
                        <Typography variant="body2" color="text.secondary">
                          {stat.label}
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

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
              gap: 5,
              mb: 8,
              alignItems: "start",
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 100, mb: 2 }}>
                Why this{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  product exists
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                Nexus was not created because the world needed one more school
                management dashboard. It was created because real institutions
                were paying the cost of disconnected operations every day:
                duplicate data entry, reporting delays, weak accountability, and
                software choices that never quite fit the full operational model.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                Our approach has always been to treat education as its own
                operational domain. That means the ERP should understand academic
                structure, people relationships, campus separation, attendance
                realities, fee logic, and leadership reporting as connected
                layers, not isolated screens.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, mt: 2 }}>
                {AI_POSITIONING.long} We want that AI layer to feel useful because
                it sits on real institutional context, not because it relies on
                exaggerated claims.
              </Typography>
            </Box>

            <Card
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 4,
                backgroundColor: "background.paper",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    mb: 2,
                  }}
                >
                  Our point of view
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
                  {perspectivePoints.map((point) => (
                    <Box
                      key={point}
                      sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "primary.main",
                          mt: 1,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {point}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 100, mb: 2 }}>
            How Nexus{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
              came to be
            </Box>
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ lineHeight: 1.9, maxWidth: 880, mb: 5 }}
          >
            The product journey matters because it explains why Nexus feels the
            way it does today. It did not begin as a theoretical SaaS idea. It
            grew out of real institutional friction, then evolved into a broader
            platform once the operational pattern became clear.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {story.map((item, index) => (
              <Box key={item.phase}>
                <Grid container spacing={6} sx={{ py: 5 }}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                        display: "block",
                        mb: 1,
                      }}
                    >
                      {item.phase}
                    </Typography>
                    <Typography
                      variant="overline"
                      color="text.disabled"
                      sx={{ fontWeight: 700, letterSpacing: 2, display: "block", mb: 1 }}
                    >
                      {item.year}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.45 }}>
                      {item.title}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 9 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.95 }}>
                      {item.body}
                    </Typography>
                  </Grid>
                </Grid>
                {index < story.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 8 }} />

          <Typography variant="h4" sx={{ fontWeight: 100, mb: 6 }}>
            What we{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
              stand for
            </Box>
          </Typography>

          <Grid container spacing={3}>
            {values.map((value) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={value.title}>
                <Card
                  sx={{
                    height: "100%",
                    p: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                  }}
                >
                  <CardContent>
                    <Box sx={{ color: "primary.main", mb: 2 }}>{value.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.25 }}>
                      {value.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                      {value.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 8 }} />

          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                component="a"
                href="https://wisemensoft.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: "inline-flex", alignItems: "center", mb: 2.5 }}
              >
                <Image
                  src="/icons/wisemensoft-logo.svg"
                  alt="Wisemen Soft"
                  width={180}
                  height={42}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 100, mb: 2 }}>
                A product of{" "}
                <Box
                  component="a"
                  href="https://wisemensoft.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontWeight: 800,
                    color: "primary.main",
                    textDecoration: "none",
                    "&:hover": { color: "primary.light" },
                  }}
                >
                  Wisemen Soft
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
                Wisemen Soft builds enterprise and SaaS products for clients
                across Pakistan and the GCC region. Our focus is not just writing
                software. It is solving operational problems that teams feel every
                day when their systems do not fit the way they actually work.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                Nexus is our strongest expression of that approach in education:
                a product that aims to stay practical for operators, trustworthy
                for leadership, flexible enough for institutions that expect
                to grow, and ready to support AI-powered assistance in a way
                that stays grounded in real operational data.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 4,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "background.paper",
                }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.9, fontStyle: "italic" }}
                >
                  &ldquo;We have built software for other serious industries, but
                  education kept demanding a better operational product story.
                  Nexus is our answer to that challenge: software that respects
                  the complexity of institutions without making day-to-day work
                  feel heavier.&rdquo;
                </Typography>
                <Typography variant="body2" color="primary" sx={{ mt: 2, fontWeight: 700 }}>
                  - Wisemen Soft Team
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: 10,
              p: { xs: 4, md: 5 },
              borderRadius: 4,
              backgroundColor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              textAlign: "center",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 100, mb: 1.25 }}>
              Want to see how{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                Nexus fits your institution?
              </Box>
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ lineHeight: 1.85, maxWidth: 760, mx: "auto" }}
            >
              If you are exploring ERP options for a school, college, or
              multi-campus education group, we would be happy to show you how
              Nexus approaches the operational problems most institutions still
              struggle with.
            </Typography>
          </Box>
        </Container>
      </Box>
    </>
  );
}
