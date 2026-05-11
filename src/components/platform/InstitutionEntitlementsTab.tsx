"use client";

import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";

const ALL_MODULES = ["ACADEMICS", "ATTENDANCE", "FINANCE", "PEOPLE", "REPORTING", "EXAMINATIONS", "DOCUMENTS", "REALTIME"];

const MODULE_LABELS: Record<string, string> = {
  ACADEMICS: "Academics", ATTENDANCE: "Attendance", FINANCE: "Finance",
  PEOPLE: "People", REPORTING: "Reporting", EXAMINATIONS: "Examinations",
  DOCUMENTS: "Documents", REALTIME: "Real-time",
};

const MODULE_DESC: Record<string, string> = {
  ACADEMICS: "Levels, classes, sections, subjects and teacher assignments.",
  ATTENDANCE: "Daily check-in/out, leave management, and auto-absent marking.",
  FINANCE: "Fee structures, vouchers, payroll, deductions, and bank accounts.",
  PEOPLE: "Student, teacher, and guardian profile management.",
  REPORTING: "Analytics, reports, and data exports.",
  EXAMINATIONS: "Exam scheduling, results, and grading.",
  DOCUMENTS: "Document management and storage.",
  REALTIME: "Real-time notifications and live updates via WebSocket.",
};

interface Props {
  institutionId: string;
  runtimeConfig: Record<string, unknown> | null;
  onSaved?: () => void;
}

export default function InstitutionEntitlementsTab({ runtimeConfig }: Props) {
  const entitlements = runtimeConfig?.modules as Record<string, { enabled: boolean }> | null;
  const isEnabled = (m: string) => entitlements?.[m]?.enabled === true;
  const enabledCount = ALL_MODULES.filter(isEnabled).length;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Module Entitlements</Typography>
        <Typography variant="body2" color="text.secondary">{enabledCount} of {ALL_MODULES.length} modules enabled.</Typography>
      </Box>

      <Grid container spacing={2}>
        {ALL_MODULES.map((mod) => {
          const enabled = isEnabled(mod);
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={mod}>
              <Card sx={{ border: "1px solid", borderColor: enabled ? "primary.main" : "divider", opacity: enabled ? 1 : 0.6 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{MODULE_LABELS[mod]}</Typography>
                        <Chip
                          label={enabled ? "Enabled" : "Disabled"}
                          color={enabled ? "success" : "default"}
                          size="small"
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{MODULE_DESC[mod]}</Typography>
                    </Box>
                    {enabled
                      ? <CheckCircle sx={{ color: "success.main", fontSize: 18, flexShrink: 0 }} />
                      : <Cancel sx={{ color: "text.disabled", fontSize: 18, flexShrink: 0 }} />
                    }
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
