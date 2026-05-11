"use client";

import { Box, Container, Divider, Grid, Typography } from "@mui/material";

interface Section {
  title: string;
  body: string;
}

interface Props {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: Section[];
}

export default function LegalPage({ title, subtitle, lastUpdated, sections }: Props) {
  return (
    <Box sx={{ py: { xs: 8, md: 12 } }}>
      {/* Header */}
      <Box sx={{ backgroundColor: "background.paper", borderBottom: "1px solid", borderColor: "divider", py: { xs: 6, md: 8 }, mb: 8 }}>
        <Container maxWidth="xl">
          <Typography variant="h2" sx={{ fontWeight: 100, mb: 1 }}>
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>{title}</Box>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>{subtitle}</Typography>
          <Typography variant="caption" color="text.disabled">Last updated: {lastUpdated}</Typography>
        </Container>
      </Box>

      <Container maxWidth="xl">
        <Grid container spacing={8}>
          {/* Sidebar nav */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ position: "sticky", top: 100 }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", display: "block", mb: 2 }}>
                Contents
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {sections.map((s) => (
                  <Typography
                    key={s.title}
                    variant="body2"
                    color="text.secondary"
                    sx={{ cursor: "pointer", "&:hover": { color: "primary.main" }, transition: "color 0.2s", lineHeight: 1.6 }}
                    onClick={() => document.getElementById(s.title)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    {s.title}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Content */}
          <Grid size={{ xs: 12, md: 9 }}>
            {sections.map((section, i) => (
              <Box key={section.title} id={section.title} sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, scrollMarginTop: 120 }}>
                  {section.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                  {section.body}
                </Typography>
                {i < sections.length - 1 && <Divider sx={{ mt: 6 }} />}
              </Box>
            ))}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
