"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";

function unwrapSettingValue(value: unknown, depth = 0): string {
  if (depth > 10 || value === null || value === undefined) return "—";
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) return unwrapSettingValue(parsed, depth + 1);
      return String(parsed);
    } catch { return value; }
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if ("value" in obj) return unwrapSettingValue(obj.value, depth + 1);
    return JSON.stringify(value);
  }
  return String(value);
}

interface Props {
  institutionId: string;
  runtimeConfig: Record<string, unknown> | null;
  onSaved?: () => void;
}

export default function InstitutionSettingsTab({ runtimeConfig }: Props) {
  const raw = runtimeConfig?.settings as Record<string, unknown> | null;
  const entries = raw ? Object.entries(raw) : [];

  return (
    <Card sx={{ border: "1px solid", borderColor: "divider", maxWidth: 800 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Institution Settings</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Key-value configuration stored per institution.
        </Typography>

        {entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No settings configured.</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {entries.map(([key, value]) => (
              <Box key={key} sx={{ display: "flex", gap: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "primary.main", width: 200, flexShrink: 0, pt: 0.2 }}>
                  {key}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: "break-all" }}>
                  {unwrapSettingValue(value)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
