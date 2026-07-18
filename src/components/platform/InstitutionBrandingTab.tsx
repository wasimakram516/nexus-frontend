"use client";

import { useState } from "react";
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { platformService } from "@/services/platform.service";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { DEFAULT_BRANDING_COLORS } from "@/contexts/RuntimeConfigContext";

interface Props {
  institutionId: string;
  runtimeConfig: Record<string, unknown> | null;
  onSaved?: () => void;
}

interface BrandingForm {
  displayName: string;
  logoUrl: string;
  theme: string;
  primaryColorLight: string;
  secondaryColorLight: string;
  accentColorLight: string;
  backgroundColorLight: string;
  primaryColorDark: string;
  secondaryColorDark: string;
  accentColorDark: string;
  backgroundColorDark: string;
}

const COLOR_FIELDS = [
  { key: "primary" as const, label: "Primary" },
  { key: "secondary" as const, label: "Secondary" },
  { key: "accent" as const, label: "Accent" },
  { key: "background" as const, label: "Background" },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 130, flexShrink: 0, pt: 0.2 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || "—"}</Typography>
    </Box>
  );
}

function ColorSwatchRow({ label, colors }: { label: string; colors: string[] }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{label}</Typography>
      <Box sx={{ display: "flex", gap: 1.5 }}>
        {colors.map((color, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 20, height: 20, borderRadius: 1, backgroundColor: color, border: "1px solid", borderColor: "divider" }} />
            <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{color}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function readForm(branding: Record<string, string | null> | null): BrandingForm {
  return {
    displayName: branding?.displayName ?? "",
    logoUrl: branding?.logoUrl ?? "",
    theme: branding?.theme ?? "default",
    primaryColorLight: branding?.primaryColorLight ?? DEFAULT_BRANDING_COLORS.light.primaryColor,
    secondaryColorLight: branding?.secondaryColorLight ?? DEFAULT_BRANDING_COLORS.light.secondaryColor,
    accentColorLight: branding?.accentColorLight ?? DEFAULT_BRANDING_COLORS.light.accentColor,
    backgroundColorLight: branding?.backgroundColorLight ?? DEFAULT_BRANDING_COLORS.light.backgroundColor,
    primaryColorDark: branding?.primaryColorDark ?? DEFAULT_BRANDING_COLORS.dark.primaryColor,
    secondaryColorDark: branding?.secondaryColorDark ?? DEFAULT_BRANDING_COLORS.dark.secondaryColor,
    accentColorDark: branding?.accentColorDark ?? DEFAULT_BRANDING_COLORS.dark.accentColor,
    backgroundColorDark: branding?.backgroundColorDark ?? DEFAULT_BRANDING_COLORS.dark.backgroundColor,
  };
}

export default function InstitutionBrandingTab({ institutionId, runtimeConfig, onSaved }: Props) {
  const { showMessage } = useMessage();
  const branding = runtimeConfig?.branding as Record<string, string | null> | null;
  const current = readForm(branding);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<BrandingForm>(current);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");

  const openEdit = () => {
    setForm(readForm(branding));
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { success } = await apiHandler(
      () => platformService.updateBranding(institutionId, { ...form }),
      { showMessage, successMessage: "Branding updated successfully" },
    );
    setSaving(false);
    if (success) {
      setEditOpen(false);
      onSaved?.();
    }
  };

  const previewPrimary = previewMode === "light" ? current.primaryColorLight : current.primaryColorDark;
  const previewAccent = previewMode === "light" ? current.accentColorLight : current.accentColorDark;
  const previewBg = previewMode === "light" ? current.backgroundColorLight : current.backgroundColorDark;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Branding</Typography>
              <Button size="small" variant="outlined" startIcon={<Edit />} onClick={openEdit}>
                Edit
              </Button>
            </Box>
            <InfoRow label="Display Name" value={current.displayName} />
            <InfoRow label="Theme" value={current.theme} />
            <InfoRow label="Logo URL" value={current.logoUrl ? "Configured" : "Not set"} />

            <Box sx={{ mt: 2 }}>
              <ColorSwatchRow label="Light mode" colors={[current.primaryColorLight, current.secondaryColorLight, current.accentColorLight, current.backgroundColorLight]} />
              <ColorSwatchRow label="Dark mode" colors={[current.primaryColorDark, current.secondaryColorDark, current.accentColorDark, current.backgroundColorDark]} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Preview</Typography>
              <ToggleButtonGroup
                size="small"
                value={previewMode}
                exclusive
                onChange={(_, value) => value && setPreviewMode(value)}
              >
                <ToggleButton value="light">Light</ToggleButton>
                <ToggleButton value="dark">Dark</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
              <Box sx={{ backgroundColor: previewPrimary, px: 3, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                {current.logoUrl ? (
                  <Box component="img" src={current.logoUrl} sx={{ height: 28, borderRadius: 1 }} />
                ) : (
                  <Box sx={{ width: 28, height: 28, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>N</Typography>
                  </Box>
                )}
                <Typography sx={{ color: "#fff", fontWeight: 700 }}>{current.displayName || "Institution Name"}</Typography>
              </Box>
              <Box sx={{ p: 3, backgroundColor: previewBg }}>
                <Box sx={{ width: 80, height: 8, borderRadius: 1, backgroundColor: previewPrimary, mb: 1, opacity: 0.8 }} />
                <Box sx={{ width: 140, height: 6, borderRadius: 1, backgroundColor: "divider", mb: 2 }} />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Box sx={{ px: 2, py: 0.75, borderRadius: 1, backgroundColor: previewPrimary }}>
                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Primary</Typography>
                  </Box>
                  <Box sx={{ px: 2, py: 0.75, borderRadius: 1, backgroundColor: previewAccent }}>
                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Accent</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={editOpen} onClose={() => (saving ? undefined : setEditOpen(false))} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Branding</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            <TextField
              label="Display Name"
              size="small"
              fullWidth
              value={form.displayName}
              onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            />
            <TextField
              label="Logo URL"
              size="small"
              fullWidth
              value={form.logoUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="https://..."
            />
            <TextField
              label="Theme"
              size="small"
              fullWidth
              value={form.theme}
              onChange={(e) => setForm((prev) => ({ ...prev, theme: e.target.value }))}
              helperText="Leave as 'default' unless a custom theme is configured."
            />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Colors</Typography>
            <Typography variant="caption" color="text.disabled">
              Each color has a light-mode and dark-mode value — set both so the brand looks intentional in either.
            </Typography>
            {COLOR_FIELDS.map(({ key, label }) => {
              const lightKey = `${key}ColorLight` as keyof BrandingForm;
              const darkKey = `${key}ColorDark` as keyof BrandingForm;
              return (
                <Box key={key}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{label}</Typography>
                  <Box sx={{ display: "flex", gap: 1.5, mt: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                      <input
                        type="color"
                        value={form[lightKey]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [lightKey]: e.target.value }))}
                        style={{ width: 40, height: 40, border: "none", borderRadius: 8, cursor: "pointer", padding: 2, flexShrink: 0 }}
                      />
                      <TextField
                        label="Light"
                        size="small"
                        fullWidth
                        value={form[lightKey]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [lightKey]: e.target.value }))}
                      />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                      <input
                        type="color"
                        value={form[darkKey]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [darkKey]: e.target.value }))}
                        style={{ width: 40, height: 40, border: "none", borderRadius: 8, cursor: "pointer", padding: 2, flexShrink: 0 }}
                      />
                      <TextField
                        label="Dark"
                        size="small"
                        fullWidth
                        value={form[darkKey]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [darkKey]: e.target.value }))}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
