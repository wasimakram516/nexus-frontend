import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  CheckCircle,
  ExpandMore,
  RocketLaunch,
  ViewModule,
} from "@mui/icons-material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import { modules } from "../page";
import { AI_POSITIONING } from "@/content/ai";
import FeatureSectionNav from "@/components/public/FeatureSectionNav";
import PageBreadcrumbs from "@/components/shared/PageBreadcrumbs";
import { toSlug } from "@/lib/slugify";

interface Props {
  params: Promise<{ module: string }>;
}

export async function generateStaticParams() {
  return modules.map((m) => ({ module: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module: slug } = await params;
  const mod = modules.find((m) => m.slug === slug);
  if (!mod) return {};
  return {
    title: `${mod.title} - Nexus Features`,
    description: mod.summary,
  };
}

export default async function ModuleFeaturePage({ params }: Props) {
  const { module: slug } = await params;
  const mod = modules.find((m) => m.slug === slug);
  if (!mod) notFound();
  const sectionItems =
    mod.sections?.map((section, index) => ({
      id: `${mod.slug}-${toSlug(section.heading)}`,
      label: section.heading,
      number: index + 1,
    })) ?? [];

  return (
    <>
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl">
          <PageBreadcrumbs
            crumbs={[
              { label: "Features", href: "/features", icon: <ViewModule sx={{ fontSize: 16 }} /> },
              { label: mod.title },
            ]}
          />

          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ color: "primary.main", mb: 2 }}>{mod.icon}</Box>
              <Chip label="Feature Module" color="primary" size="small" sx={{ mb: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 100, mb: 2 }}>
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  {mod.title}
                </Box>
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, lineHeight: 1.8 }}>
                {mod.summary}
              </Typography>
              {mod.heroIntro?.length ? (
                <Stack spacing={1.75} sx={{ mt: 3 }}>
                  {mod.heroIntro.map((paragraph) => (
                    <Typography
                      key={paragraph}
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.9 }}
                    >
                      {paragraph}
                    </Typography>
                  ))}
                </Stack>
              ) : null}
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={2.5}>
                <Card
                  sx={{
                    backgroundColor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                    p: 1,
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        color: "primary.main",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      What&apos;s included
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      {mod.highlights.map((h) => (
                        <Box key={h} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                          <CheckCircle
                            sx={{ fontSize: 16, color: "success.main", flexShrink: 0, mt: 0.3 }}
                          />
                          <Typography variant="body2">{h}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {mod.aiAssist ? (
                  <Card
                    sx={{
                      backgroundColor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      p: 1,
                    }}
                  >
                    <CardContent>
                      <Chip label={AI_POSITIONING.eyebrow} color="primary" size="small" sx={{ mb: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.25 }}>
                        {mod.aiAssist.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.85 }}>
                        {mod.aiAssist.body}
                      </Typography>
                    </CardContent>
                  </Card>
                ) : null}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">
          <Typography variant="h4" sx={{ fontWeight: 100, mb: 8 }}>
            How it{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
              works
            </Box>
          </Typography>

          <Grid
            container
            spacing={6}
            sx={{ alignItems: "flex-start", position: "relative" }}
            id={`${mod.slug}-how-it-works`}
          >
            <Grid
              size={{ xs: 12, md: 4, lg: 3 }}
              sx={{
                display: { xs: "none", md: "block" },
                alignSelf: "flex-start",
              }}
            >
              <FeatureSectionNav items={sectionItems} boundaryId={`${mod.slug}-how-it-works`} />
            </Grid>
            <Grid size={{ xs: 12, md: 8, lg: 9 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {mod.sections?.map((section, i) => {
                  const sectionId = sectionItems[i]?.id ?? `${mod.slug}-section-${i + 1}`;

                  return (
                    <Box key={section.heading} id={sectionId} sx={{ scrollMarginTop: 120 }}>
                      <Box sx={{ py: 5, maxWidth: 860 }}>
                        <Typography
                          component="h3"
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            lineHeight: 1.25,
                            mb: 3,
                          }}
                        >
                          {section.heading}
                        </Typography>
                        <Stack spacing={2}>
                          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                            {section.body}
                          </Typography>
                          {section.paragraphs?.map((paragraph) => (
                            <Typography
                              key={paragraph}
                              variant="body1"
                              color="text.secondary"
                              sx={{ lineHeight: 1.9 }}
                            >
                              {paragraph}
                            </Typography>
                          ))}
                          {section.bullets?.length ? (
                            <Stack spacing={1.25} sx={{ pt: 0.5 }}>
                              {section.bullets.map((bullet) => (
                                <Box
                                  key={bullet}
                                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}
                                >
                                  <CheckCircle
                                    sx={{ fontSize: 16, color: "success.main", mt: 0.35 }}
                                  />
                                  <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                                    {bullet}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          ) : null}
                        </Stack>
                      </Box>
                      {i < (mod.sections?.length ?? 0) - 1 && <Divider />}
                    </Box>
                  );
                })}
              </Box>
            </Grid>
          </Grid>

          {mod.workflow?.length ? (
            <Box sx={{ mt: 10 }}>
              <Typography variant="h4" sx={{ fontWeight: 100, mb: 5 }}>
                How the{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  workflow
                </Box>{" "}
                fits together
              </Typography>
              <Grid container spacing={3}>
                {mod.workflow.map((step, index) => (
                  <Grid key={step.title} size={{ xs: 12, md: 6 }}>
                    <Card
                      sx={{
                        height: "100%",
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                      }}
                    >
                      <CardContent>
                        <Chip
                          label={`Step ${index + 1}`}
                          color="primary"
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.25 }}>
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
            </Box>
          ) : null}

          {mod.faqs?.length ? (
            <Box sx={{ mt: 10 }}>
              <Typography variant="h4" sx={{ fontWeight: 100, mb: 4 }}>
                Frequently asked{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  questions
                </Box>
              </Typography>
              <Stack spacing={2}>
                {mod.faqs.map((faq) => (
                  <Accordion
                    key={faq.question}
                    disableGutters
                    sx={{
                      backgroundColor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "12px !important",
                      overflow: "hidden",
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography sx={{ fontWeight: 700 }}>{faq.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.85 }}>
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </Box>
          ) : null}

          <Box
            sx={{
              mt: 10,
              p: 5,
              borderRadius: 4,
              backgroundColor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              textAlign: "center",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 100, mb: 1 }}>
              Ready to see{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                {mod.title}
              </Box>{" "}
              in action?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Book a demo and we&apos;ll walk you through the full module.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
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
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
