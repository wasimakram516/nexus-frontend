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
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowForward,
  CheckCircle,
  Hub,
  Insights,
  RocketLaunch,
} from "@mui/icons-material";
import { AI_POSITIONING } from "@/content/ai";
import PageBreadcrumbs from "@/components/shared/PageBreadcrumbs";
import { featureModuleMap, featureModules } from "@/content/features";

export const modules = featureModules;

export const metadata: Metadata = {
  title: "Nexus Features | Connected Education ERP for Academics, Attendance, Finance, and Multi-Campus Operations",
  description:
    "Explore the full Nexus feature stack for educational institutions, including AI-powered assistance, connected operations, and AI-ready workflows across academics, attendance, finance, people, campuses, and reporting.",
};

const connectedBenefits = [
  "Academic structure flows into attendance, finance, and reporting instead of being recreated in every module.",
  "Student, guardian, and teacher records stay connected to the operational work that depends on them.",
  "Campus-level scoping, audit trails, and recycle-bin support make the platform safer to run at scale.",
];

const editorialGroups = [
  {
    eyebrow: "Core operations",
    title: "The modules institutions use every day",
    body:
      "These are the modules that shape day-to-day operational work in a school, college, or multi-campus institution. They keep classes organised, people records connected, daily attendance accurate, and financial workflows tied to what is actually happening on the ground.",
    slugs: ["academics", "people", "attendance", "finance"],
  },
  {
    eyebrow: "Oversight and outcomes",
    title: "The modules that turn operations into decisions",
    body:
      "Once the operational foundation is clean, Nexus helps institutions schedule assessments, measure academic outcomes, and turn attendance, finance, and growth data into reporting that leadership can actually use.",
    slugs: ["examinations", "reporting"],
  },
  {
    eyebrow: "Scale and adaptability",
    title: "The modules that make Nexus fit real institutions",
    body:
      "Institutions rarely stay simple for long. Multi-campus control and custom-field flexibility make Nexus more practical for growing organisations that need stronger boundaries, cleaner control, and space for institution-specific workflows.",
    slugs: ["campuses", "custom-fields"],
  },
];

function getModules(slugs: string[]) {
  return slugs
    .map((slug) => featureModuleMap.get(slug))
    .filter((module): module is NonNullable<typeof module> => Boolean(module));
}

export default function FeaturesPage() {
  return (
    <>
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background:
            "linear-gradient(180deg, rgba(5,150,105,0.10) 0%, rgba(255,255,255,0) 100%)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl">
          <PageBreadcrumbs crumbs={[{ label: "Features" }]} />
          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip label="Education ERP Modules" color="primary" sx={{ mb: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 200, mb: 2, maxWidth: 920 }}>
                The Nexus feature stack built for{" "}
                <Box component="span" sx={{ color: "primary.main", fontWeight: 800 }}>
                  real institutional operations
                </Box>
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontWeight: 400, lineHeight: 1.8, maxWidth: 920, mb: 2.5 }}
              >
                Nexus is designed for the way education actually works. Academics, people,
                attendance, finance, reporting, and multi-campus controls are not isolated tools
                here. They share the same structure, context, and operational logic.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.9, maxWidth: 880, mb: 3.5 }}
              >
                That means fewer duplicate records, fewer spreadsheet handoffs, and a much clearer
                path from daily activity to leadership insight. If you are evaluating education ERP
                software for a school, college, or campus network, this page gives you a grounded
                view of how the Nexus modules fit together.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.9, maxWidth: 880, mb: 3.5 }}
              >
                {AI_POSITIONING.long}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Link href="/contact">
                  <Button variant="contained" size="large" startIcon={<RocketLaunch />}>
                    Request a Demo
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outlined" size="large">
                    View Pricing
                  </Button>
                </Link>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "background.paper",
                  boxShadow: "0 24px 60px rgba(2, 6, 23, 0.08)",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                    <Hub sx={{ color: "primary.main" }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      Why Nexus feels different
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    {connectedBenefits.map((item) => (
                      <Box key={item} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <CheckCircle sx={{ color: "success.main", fontSize: 18, mt: 0.3 }} />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ lineHeight: 1.8 }}
                        >
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 9 }, backgroundColor: "background.paper" }}>
        <Container maxWidth="xl">
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Insights sx={{ color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  A connected platform, not a tool bundle
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                Most institutions do not struggle because they lack software. They struggle because
                their software is fragmented. Attendance sits in one place, billing in another,
                staff records somewhere else, and reporting becomes a manual monthly exercise.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={2.25}>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.95 }}>
                  Nexus is built so each module strengthens the others. Academic structure informs
                  student placement. Student and guardian records stay available to operations and
                  finance. Attendance becomes useful beyond a daily register because it feeds salary
                  deductions, fine logic, and reporting. Campus configuration affects the real
                  policies each branch follows.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.95 }}>
                  That connection is what makes an ERP valuable. It reduces duplicate setup, avoids
                  mismatched data across teams, and gives leadership a cleaner view of what is
                  happening across the institution.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.95 }}>
                  Nexus AI sits on top of that connected foundation as an AI-powered assistance
                  layer. It gives institutions a credible path toward AI-assisted operations,
                  smarter visibility, and AI-ready workflows because the underlying academic,
                  people, attendance, finance, and campus context already lives in one place.
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default", borderTop: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Stack spacing={8}>
            {editorialGroups.map((group, groupIndex) => {
              const groupModules = getModules(group.slugs);

              return (
                <Box key={group.title}>
                  <Box sx={{ maxWidth: 940, mb: 4.5 }}>
                    <Chip label={group.eyebrow} size="small" color="primary" sx={{ mb: 2 }} />
                    <Typography variant="h3" sx={{ fontWeight: 200, mb: 1.5 }}>
                      {group.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                      {group.body}
                    </Typography>
                  </Box>

                  <Stack spacing={3}>
                    {groupModules.map((mod, index) => (
                      <Card
                        key={mod.slug}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          backgroundColor: "background.paper",
                          overflow: "hidden",
                        }}
                      >
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                          <Grid
                            container
                            spacing={4}
                            sx={{
                              alignItems: "flex-start",
                              flexDirection: {
                                xs: "column",
                                md:
                                  index % 2 === 1 && groupIndex !== 2
                                    ? "row-reverse"
                                    : "row",
                              },
                            }}
                          >
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Box sx={{ color: "primary.main", mb: 2 }}>{mod.icon}</Box>
                              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.25 }}>
                                {mod.title}
                              </Typography>
                              <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 2, flexWrap: "wrap" }}>
                                {mod.audience.slice(0, 3).map((role) => (
                                  <Chip key={role} label={role} size="small" variant="outlined" />
                                ))}
                              </Stack>
                              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                                {mod.summary}
                              </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 8 }}>
                              <Stack spacing={2.25}>
                                {mod.heroIntro.slice(0, 2).map((paragraph) => (
                                  <Typography
                                    key={paragraph}
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.95 }}
                                  >
                                    {paragraph}
                                  </Typography>
                                ))}
                                {mod.aiAssist ? (
                                  <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.95 }}
                                  >
                                    {mod.aiAssist.body}
                                  </Typography>
                                ) : null}
                              </Stack>

                              <Grid container spacing={2.5} sx={{ mt: 1 }}>
                                <Grid size={{ xs: 12, lg: 7 }}>
                                  <Box
                                    sx={{
                                      p: 2.5,
                                      borderRadius: 3,
                                      backgroundColor: "background.default",
                                      border: "1px solid",
                                      borderColor: "divider",
                                    }}
                                  >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
                                      What this module helps you do
                                    </Typography>
                                    <Stack spacing={1.15}>
                                      {mod.highlights.slice(0, 4).map((item) => (
                                        <Box
                                          key={item}
                                          sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 1.25,
                                          }}
                                        >
                                          <CheckCircle
                                            sx={{
                                              fontSize: 16,
                                              color: "success.main",
                                              mt: 0.35,
                                            }}
                                          />
                                          <Typography variant="body2" sx={{ lineHeight: 1.75 }}>
                                            {item}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Stack>
                                  </Box>
                                </Grid>

                                <Grid size={{ xs: 12, lg: 5 }}>
                                  <Box
                                    sx={{
                                      p: 2.5,
                                      borderRadius: 3,
                                      backgroundColor: "background.default",
                                      border: "1px solid",
                                      borderColor: "divider",
                                    }}
                                  >
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
                                      Why it matters operationally
                                    </Typography>
                                    <Stack spacing={1.15}>
                                      {mod.operationalWins.slice(0, 3).map((item) => (
                                        <Typography
                                          key={item}
                                          variant="body2"
                                          color="text.secondary"
                                          sx={{ lineHeight: 1.75 }}
                                        >
                                          {item}
                                        </Typography>
                                      ))}
                                    </Stack>
                                  </Box>
                                </Grid>
                              </Grid>

                              <Box
                                sx={{
                                  mt: 3,
                                  display: "flex",
                                  gap: 2,
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                }}
                              >
                                <Link href={`/features/${mod.slug}`}>
                                  <Button endIcon={<ArrowForward />} size="small">
                                    Read more about {mod.title}
                                  </Button>
                                </Link>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 9 }, backgroundColor: "background.paper", borderTop: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Grid container spacing={4} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h3" sx={{ fontWeight: 200, mb: 1.5 }}>
                Want to see how these modules fit{" "}
                <Box component="span" sx={{ color: "primary.main", fontWeight: 800 }}>
                  your institution
                </Box>
                ?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, maxWidth: 860 }}>
                We can walk through the exact workflows your school, college, or campus network
                cares about, from setup and admissions to attendance, fee operations, reporting,
                and role-based access.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction={{ xs: "column", sm: "row", md: "column" }} spacing={2}>
                <Link href="/contact">
                  <Button variant="contained" size="large" fullWidth startIcon={<RocketLaunch />}>
                    Request a Demo
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outlined" size="large" fullWidth>
                    View Pricing
                  </Button>
                </Link>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
