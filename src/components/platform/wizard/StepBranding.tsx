"use client";

import { useRef, useState } from "react";
import {
  Box, Card, CardContent, CircularProgress,
  Grid, IconButton, LinearProgress, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import CloudUpload from "@mui/icons-material/CloudUpload";
import Delete from "@mui/icons-material/Delete";
import { WizardData } from "@/app/platform/institutions/new/page";
import { uploadFile } from "@/lib/upload";
import { useMessage } from "@/contexts/MessageContext";
import BrandingColorEditor from "@/components/platform/BrandingColorEditor";
import BrandingPreview from "@/components/platform/BrandingPreview";
import type { ColorMode } from "@/theme/branding-tokens";

interface Props { data: WizardData; update: (p: Partial<WizardData>) => void; }

export default function StepBranding({ data, update }: Props) {
  const { showMessage } = useMessage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [colorMode, setColorMode] = useState<ColorMode>("light");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(file.type)) {
      showMessage("Please upload a PNG, JPG, SVG, or WebP file.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showMessage("File size must be under 2MB.", "error");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadFile(file, {
        subfolder: "images",
        onProgress: (pct) => setProgress(pct),
      });
      update({ logoUrl: result.url });
      showMessage("Logo uploaded successfully.", "success");
    } catch (err) {
      showMessage((err as Error).message ?? "Logo upload failed.", "error");
    }
    setUploading(false);
    setProgress(0);
    e.target.value = "";
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 100, mb: 0.5 }}>
        Brand <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>Identity</Box>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Customize how this institution appears in Nexus. Set colors for both light and dark mode — the dashboard applies whichever the user has active.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Logo */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Institution Logo</Typography>

              {/* Upload area */}
              <Box
                onClick={() => !uploading && fileRef.current?.click()}
                sx={{
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                  cursor: uploading ? "default" : "pointer",
                  "&:hover": { borderColor: "primary.main", backgroundColor: "action.hover" },
                  transition: "all 0.2s",
                  mb: 2,
                }}
              >
                {uploading ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, width: "100%" }}>
                    <CircularProgress size={28} />
                    <Typography variant="caption" color="text.secondary">Uploading... {progress}%</Typography>
                    <LinearProgress variant="determinate" value={progress} sx={{ width: "80%", borderRadius: 1 }} />
                  </Box>
                ) : data.logoUrl ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <Box component="img" src={data.logoUrl} sx={{ maxHeight: 60, maxWidth: 200, objectFit: "contain" }} />
                    <Typography variant="caption" color="primary.main">Click to replace</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <CloudUpload sx={{ fontSize: 36, color: "text.disabled" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Click to upload logo</Typography>
                    <Typography variant="caption" color="text.secondary">PNG, JPG, SVG, WebP — max 2MB</Typography>
                  </Box>
                )}
              </Box>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />

              {/* Manual URL fallback */}
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  label="Or paste logo URL"
                  value={data.logoUrl}
                  onChange={(e) => update({ logoUrl: e.target.value })}
                  size="small"
                  fullWidth
                  placeholder="https://..."
                />
                {data.logoUrl && (
                  <Tooltip title="Remove logo">
                    <IconButton size="small" onClick={() => update({ logoUrl: "" })}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Display settings */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5 }}>Display Settings</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  label="Display Name"
                  value={data.displayName}
                  onChange={(e) => update({ displayName: e.target.value })}
                  fullWidth
                  helperText={`Shown instead of "${data.name || "institution name"}" in the UI.`}
                />
                <TextField
                  label="Theme"
                  value={data.theme}
                  onChange={(e) => update({ theme: e.target.value })}
                  fullWidth
                  helperText="Leave as 'default' unless a custom theme is configured."
                />
              </Box>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <ToggleButtonGroup
                size="small"
                value={colorMode}
                exclusive
                onChange={(_, value) => value && setColorMode(value)}
                sx={{ mb: 2.5 }}
              >
                <ToggleButton value="light">Light mode</ToggleButton>
                <ToggleButton value="dark">Dark mode</ToggleButton>
              </ToggleButtonGroup>
              <BrandingColorEditor mode={colorMode} value={data.colorOverrides} onChange={(colorOverrides) => update({ colorOverrides })} />
            </CardContent>
          </Card>
        </Grid>

        {/* Live preview */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ position: "sticky", top: 100 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                Live Preview ({colorMode === "light" ? "light" : "dark"} mode)
              </Typography>
              <BrandingPreview mode={colorMode} value={data.colorOverrides} displayName={data.displayName || data.name} logoUrl={data.logoUrl} />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                Only colors you change are saved. Everything else follows the Nexus theme, including future Nexus updates.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
