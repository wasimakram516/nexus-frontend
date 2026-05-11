"use client";

import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

interface Props {
  institutionId: string;
  runtimeConfig: Record<string, unknown> | null;
  onSaved?: () => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 130, flexShrink: 0, pt: 0.2 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || "—"}</Typography>
    </Box>
  );
}

export default function InstitutionBrandingTab({ runtimeConfig }: Props) {
  const branding = runtimeConfig?.branding as Record<string, string | null> | null;

  const displayName = branding?.displayName ?? "";
  const logoUrl = branding?.logoUrl ?? "";
  const primaryColor = branding?.primaryColor ?? "#059669";
  const secondaryColor = branding?.secondaryColor ?? "#6366F1";
  const accentColor = branding?.accentColor ?? "#34D399";
  const theme = branding?.theme ?? "default";

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Branding</Typography>
            <InfoRow label="Display Name" value={displayName} />
            <InfoRow label="Theme" value={theme} />
            <InfoRow label="Logo URL" value={logoUrl ? "Configured" : "Not set"} />

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>Colors</Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {[
                  { label: "Primary", color: primaryColor },
                  { label: "Secondary", color: secondaryColor },
                  { label: "Accent", color: accentColor },
                ].map(({ label, color }) => (
                  <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: 1, backgroundColor: color, border: "1px solid", borderColor: "divider", flexShrink: 0 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1 }}>{label}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 600 }}>{color}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Preview</Typography>
            <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
              <Box sx={{ backgroundColor: primaryColor, px: 3, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                {logoUrl ? (
                  <Box component="img" src={logoUrl} sx={{ height: 28, borderRadius: 1 }} />
                ) : (
                  <Box sx={{ width: 28, height: 28, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>N</Typography>
                  </Box>
                )}
                <Typography sx={{ color: "#fff", fontWeight: 700 }}>{displayName || "Institution Name"}</Typography>
              </Box>
              <Box sx={{ p: 3, backgroundColor: "background.paper" }}>
                <Box sx={{ width: 80, height: 8, borderRadius: 1, backgroundColor: primaryColor, mb: 1, opacity: 0.8 }} />
                <Box sx={{ width: 140, height: 6, borderRadius: 1, backgroundColor: "divider", mb: 2 }} />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Box sx={{ px: 2, py: 0.75, borderRadius: 1, backgroundColor: primaryColor }}>
                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Primary</Typography>
                  </Box>
                  <Box sx={{ px: 2, py: 0.75, borderRadius: 1, backgroundColor: accentColor }}>
                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Accent</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
