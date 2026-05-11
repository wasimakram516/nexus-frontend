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
  Typography,
} from "@mui/material";
import { CheckCircle, RocketLaunch, ViewModule } from "@mui/icons-material";
import { modules } from "../page";
import PageBreadcrumbs from "@/components/shared/PageBreadcrumbs";

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
    title: `${mod.title} — Nexus Features`,
    description: mod.summary,
  };
}

export default async function ModuleFeaturePage({ params }: Props) {
  const { module: slug } = await params;
  const mod = modules.find((m) => m.slug === slug);
  if (!mod) notFound();

  return (
    <>
      {/* Hero */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <PageBreadcrumbs crumbs={[
            { label: "Features", href: "/features", icon: <ViewModule sx={{ fontSize: 16 }} /> },
            { label: mod.title },
          ]} />

          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ color: "primary.main", mb: 2 }}>{mod.icon}</Box>
              <Chip label="Feature Module" color="primary" size="small" sx={{ mb: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 100, mb: 2 }}>
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>{mod.title}</Box>
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, lineHeight: 1.8 }}>
                {mod.summary}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ backgroundColor: "background.default", border: "1px solid", borderColor: "divider", p: 1 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "primary.main", textTransform: "uppercase", letterSpacing: 1 }}>
                    What&apos;s included
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {mod.highlights.map((h) => (
                      <Box key={h} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <CheckCircle sx={{ fontSize: 16, color: "success.main", flexShrink: 0, mt: 0.3 }} />
                        <Typography variant="body2">{h}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Detail sections */}
      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">
          <Typography variant="h4" sx={{ fontWeight: 100, mb: 8 }}>
            How it{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>works</Box>
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {mod.details?.map((section, i) => (
              <Box key={section.heading}>
                <Grid container spacing={6} sx={{ py: 5 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: 36, height: 36, borderRadius: "50%",
                          backgroundColor: "primary.main",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: "#fff", fontWeight: 800 }}>{i + 1}</Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{section.heading}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                      {section.body}
                    </Typography>
                  </Grid>
                </Grid>
                {i < (mod.details?.length ?? 0) - 1 && <Divider />}
              </Box>
            ))}
          </Box>

          {/* CTA */}
          <Box sx={{ mt: 10, p: 5, borderRadius: 4, backgroundColor: "background.paper", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
            <Typography variant="h5" sx={{ fontWeight: 100, mb: 1 }}>
              Ready to see{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>{mod.title}</Box>
              {" "}in action?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Book a demo and we&apos;ll walk you through the full module.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/contact">
                <Button variant="contained" size="large" startIcon={<RocketLaunch />}>Request a Demo</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outlined" size="large">View Pricing</Button>
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
