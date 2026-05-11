"use client";

import { useRef, useState } from "react";
import {
  Box, Button, Card, CardContent, CircularProgress,
  Grid, IconButton, LinearProgress, TextField, Tooltip, Typography,
} from "@mui/material";
import { CloudUpload, Delete, Refresh } from "@mui/icons-material";
import { WizardData } from "@/app/platform/institutions/new/page";
import { uploadFile } from "@/lib/upload";
import { useMessage } from "@/contexts/MessageContext";

interface Props { data: WizardData; update: (p: Partial<WizardData>) => void; }

const DEFAULTS = {
  primaryColor: "#059669",
  secondaryColor: "#6366F1",
  accentColor: "#34D399",
  theme: "default",
};

const COLOR_FIELDS = [
  { key: "primaryColor" as const,   label: "Primary Color",   hint: "Main brand color — buttons, headers, highlights." },
  { key: "secondaryColor" as const, label: "Secondary Color", hint: "Supporting color for secondary UI elements." },
  { key: "accentColor" as const,    label: "Accent Color",    hint: "Used for badges, tags, and callouts." },
];

export default function StepBranding({ data, update }: Props) {
  const { showMessage } = useMessage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

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

  const resetColors = () => update(DEFAULTS);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 100, mb: 0.5 }}>
        Brand <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>Identity</Box>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Customize how this institution appears in Nexus. Colors apply to their dashboard and UI.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Logo */}
          <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
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
          <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
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
          <Card sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Color Palette</Typography>
                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={resetColors}
                  sx={{ color: "text.secondary" }}
                >
                  Reset to Defaults
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {COLOR_FIELDS.map(({ key, label, hint }) => (
                  <Box key={key}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                      <input
                        type="color"
                        value={data[key]}
                        onChange={(e) => update({ [key]: e.target.value })}
                        style={{ width: 44, height: 44, border: "none", borderRadius: 8, cursor: "pointer", padding: 2, flexShrink: 0 }}
                      />
                      <TextField
                        label={label}
                        value={data[key]}
                        onChange={(e) => update({ [key]: e.target.value })}
                        size="small" fullWidth
                      />
                    </Box>
                    <Typography variant="caption" color="text.disabled" sx={{ pl: 7 }}>{hint}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Live preview */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: "1px solid", borderColor: "divider", position: "sticky", top: 100 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Live Preview</Typography>
              <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
                {/* Simulated navbar */}
                <Box sx={{ backgroundColor: data.primaryColor, px: 3, py: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  {data.logoUrl ? (
                    <Box
                      component="img"
                      src={data.logoUrl}
                      sx={{ height: 28, borderRadius: 1, objectFit: "contain" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <Box sx={{ width: 28, height: 28, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>
                        {(data.displayName || data.name || "N").charAt(0).toUpperCase()}
                      </Typography>
                    </Box>
                  )}
                  <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
                    {data.displayName || data.name || "Institution Name"}
                  </Typography>
                </Box>

                {/* Simulated content */}
                <Box sx={{ p: 3, backgroundColor: "#fff" }}>
                  <Box sx={{ display: "flex", gap: 1.5, mb: 2.5 }}>
                    {[
                      { color: data.primaryColor, label: "Primary" },
                      { color: data.secondaryColor, label: "Secondary" },
                      { color: data.accentColor, label: "Accent" },
                    ].map(({ color, label }) => (
                      <Box key={label} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, backgroundColor: color }} />
                        <Typography variant="caption" sx={{ fontSize: 9, color: "#666" }}>{label}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ height: 8, borderRadius: 1, backgroundColor: data.primaryColor, mb: 1, width: "60%", opacity: 0.9 }} />
                  <Box sx={{ height: 6, borderRadius: 1, backgroundColor: "#e5e7eb", mb: 1, width: "80%" }} />
                  <Box sx={{ height: 6, borderRadius: 1, backgroundColor: "#e5e7eb", mb: 2.5, width: "50%" }} />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Box sx={{ px: 2, py: 0.75, borderRadius: 1, backgroundColor: data.primaryColor }}>
                      <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Primary Action</Typography>
                    </Box>
                    <Box sx={{ px: 2, py: 0.75, borderRadius: 1, backgroundColor: data.accentColor }}>
                      <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Accent</Typography>
                    </Box>
                    <Box sx={{ px: 2, py: 0.75, borderRadius: 1, border: `1px solid ${data.secondaryColor}` }}>
                      <Typography variant="caption" sx={{ color: data.secondaryColor, fontWeight: 600 }}>Secondary</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 2, p: 2, borderRadius: 1.5, backgroundColor: "background.default", border: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary">
                  Colors are stored in the institution&apos;s branding profile. When the institution&apos;s dashboard is built, these values will theme their entire UI automatically.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
