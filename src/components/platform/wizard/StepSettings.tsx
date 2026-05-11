"use client";

import { Box, Button, Card, CardContent, IconButton, TextField, Typography } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { WizardData } from "@/app/platform/institutions/new/page";
import { toSnakeCase } from "@/lib/slugify";

interface Props { data: WizardData; update: (p: Partial<WizardData>) => void; }

export default function StepSettings({ data, update }: Props) {
  const settings = data.settings ?? [];

  const add = () => update({ settings: [...settings, { key: "", value: "" }] });

  const remove = (i: number) =>
    update({ settings: settings.filter((_, idx) => idx !== i) });

  const change = (i: number, field: "key" | "value", val: string) =>
    update({ settings: settings.map((s, idx) => idx === i ? { ...s, [field]: val } : s) });

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 100, mb: 0.5 }}>
        Institution <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>Settings</Box>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Optional key-value settings stored per institution. Use these for custom configuration flags, feature toggles, or integration keys. Leave empty if not needed.
      </Typography>

      <Card sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Configuration Entries</Typography>
              <Typography variant="caption" color="text.secondary">Each entry is a named setting with a text value.</Typography>
            </Box>
            <Button size="small" startIcon={<Add />} variant="outlined" onClick={add}>
              Add Entry
            </Button>
          </Box>

          {settings.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No settings added yet.</Typography>
              <Button startIcon={<Add />} variant="contained" size="small" onClick={add}>Add First Entry</Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {settings.map((s, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <TextField
                    size="small"
                    label="Setting Name"
                    placeholder="e.g. Max Students Per Class"
                    value={s.key}
                    onChange={(e) => change(i, "key", e.target.value)}
                    onBlur={(e) => change(i, "key", toSnakeCase(e.target.value))}
                    sx={{ flex: 1 }}
                    helperText="Type naturally — normalized to snake_case on save."
                  />
                  <TextField
                    size="small"
                    label="Value"
                    placeholder="e.g. 40"
                    value={s.value}
                    onChange={(e) => change(i, "value", e.target.value)}
                    sx={{ flex: 2 }}
                  />
                  <IconButton size="small" onClick={() => remove(i)} sx={{ mt: 0.5, color: "text.disabled", "&:hover": { color: "error.main" } }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
