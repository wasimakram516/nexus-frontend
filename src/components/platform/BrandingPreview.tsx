"use client";

import { useMemo } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, TextField, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { buildBrandedTheme } from "@/theme/branded-theme";
import { sanitizeTokenOverrides, type ColorMode, type ColorOverrides } from "@/theme/branding-tokens";
import { darkTheme, lightTheme } from "@/theme/theme";

interface BrandingPreviewProps {
  mode: ColorMode;
  value: ColorOverrides;
  displayName: string;
  logoUrl: string;
}

/**
 * Renders real themed MUI components inside the institution's branded theme, so the preview
 * is exactly what the dashboard will show rather than a hand-drawn approximation.
 */
export default function BrandingPreview({ mode, value, displayName, logoUrl }: BrandingPreviewProps) {
  const theme = useMemo(
    () => buildBrandedTheme(mode === "dark" ? darkTheme : lightTheme, sanitizeTokenOverrides(value[mode])),
    [mode, value],
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider", backgroundColor: "background.default", color: "text.primary" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.5, backgroundColor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
          {logoUrl ? (
            <Box component="img" src={logoUrl} alt="" sx={{ height: 28, objectFit: "contain" }} onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <Box sx={{ width: 28, height: 28, borderRadius: 1.5, backgroundColor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
              {(displayName || "N").charAt(0).toUpperCase()}
            </Box>
          )}
          <Typography sx={{ fontWeight: 700 }}>{displayName || "Institution Name"}</Typography>
          <Chip size="tiny" color="secondary" label="Trial" sx={{ ml: "auto" }} />
        </Box>

        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography variant="h6">Fee collection</Typography>
              <Typography variant="body2" color="text.secondary">412 of 520 vouchers paid this term.</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip size="small" color="primary" label="Paid" />
                <Chip size="small" color="success" label="Cleared" />
                <Chip size="small" color="warning" label="Due" />
                <Chip size="small" color="error" label="Overdue" />
                <Chip size="small" color="info" label="Draft" />
                <Chip size="small" variant="outlined" label="Grade 8" />
              </Box>
              <TextField size="small" label="Search student" fullWidth />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button variant="contained">Collect fee</Button>
                <Button variant="contained" color="secondary">Remind</Button>
                <Button variant="outlined">Export</Button>
              </Box>
            </CardContent>
          </Card>
          <Alert severity="info">Hover the buttons to check the pressed colors.</Alert>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
