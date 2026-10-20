"use client";

import { useMemo, useState } from "react";
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import BrandingColorEditor from "@/components/platform/BrandingColorEditor";
import BrandingPreview from "@/components/platform/BrandingPreview";
import { platformService } from "@/services/platform.service";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { buildBrandingColorPayload, loadColorOverrides } from "@/lib/branding";
import { countOverrides, type ColorMode, type ColorOverrides } from "@/theme/branding-tokens";

interface Props {
  institutionId: string;
  runtimeConfig: Record<string, unknown> | null;
  onSaved?: () => void;
}

interface BrandingForm {
  displayName: string;
  logoUrl: string;
  theme: string;
  colorOverrides: ColorOverrides;
}

type SavedBranding = Record<string, string | null | undefined> & { colorOverrides?: unknown };

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 130, flexShrink: 0, pt: 0.2 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || "—"}</Typography>
    </Box>
  );
}

/** Lists the colors an institution customized for one mode, or says it follows the Nexus theme. */
function CustomColorsRow({ label, colors }: { label: string; colors: Record<string, string> | undefined }) {
  const entries = Object.entries(colors ?? {});
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{label}</Typography>
      {entries.length === 0 ? (
        <Typography variant="body2">Nexus default</Typography>
      ) : (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {entries.map(([token, color]) => (
            <Box key={token} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: 999, backgroundColor: color, border: "1px solid", borderColor: "divider" }} />
              <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{color}</Typography>
              <Typography variant="caption" color="text.secondary">{token}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function readForm(branding: SavedBranding | null): BrandingForm {
  return {
    displayName: branding?.displayName ?? "",
    logoUrl: branding?.logoUrl ?? "",
    theme: branding?.theme ?? "default",
    colorOverrides: loadColorOverrides(branding),
  };
}

export default function InstitutionBrandingTab({ institutionId, runtimeConfig, onSaved }: Props) {
  const { showMessage } = useMessage();
  const branding = runtimeConfig?.branding as SavedBranding | null;
  const current = useMemo(() => readForm(branding), [branding]);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<BrandingForm>(current);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<ColorMode>("light");

  const openEdit = () => {
    setForm(readForm(branding));
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { success } = await apiHandler(
      () => platformService.updateBranding(institutionId, {
        displayName: form.displayName,
        logoUrl: form.logoUrl || null,
        theme: form.theme,
        ...buildBrandingColorPayload(form.colorOverrides),
      }),
      { showMessage, successMessage: "Branding updated successfully" },
    );
    setSaving(false);
    if (success) {
      setEditOpen(false);
      onSaved?.();
    }
  };

  const modeToggle = (
    <ToggleButtonGroup size="small" value={previewMode} exclusive onChange={(_, value) => value && setPreviewMode(value)}>
      <ToggleButton value="light">Light</ToggleButton>
      <ToggleButton value="dark">Dark</ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
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
            <InfoRow label="Custom colors" value={`${countOverrides(current.colorOverrides)} set`} />

            <Box sx={{ mt: 2 }}>
              <CustomColorsRow label="Light mode" colors={current.colorOverrides.light} />
              <CustomColorsRow label="Dark mode" colors={current.colorOverrides.dark} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Preview</Typography>
              {modeToggle}
            </Box>
            <BrandingPreview mode={previewMode} value={current.colorOverrides} displayName={current.displayName} logoUrl={current.logoUrl} />
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={editOpen} onClose={() => (saving ? undefined : setEditOpen(false))} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Branding</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
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
                {modeToggle}
                <BrandingColorEditor
                  mode={previewMode}
                  value={form.colorOverrides}
                  onChange={(colorOverrides) => setForm((prev) => ({ ...prev, colorOverrides }))}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ position: "sticky", top: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Live preview ({previewMode} mode)</Typography>
                <BrandingPreview mode={previewMode} value={form.colorOverrides} displayName={form.displayName} logoUrl={form.logoUrl} />
              </Box>
            </Grid>
          </Grid>
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
