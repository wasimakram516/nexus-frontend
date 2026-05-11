"use client";

import { Box, Card, CardContent, Chip, Grid, Switch, Typography } from "@mui/material";
import { WizardData } from "@/app/platform/institutions/new/page";

interface Props { data: WizardData; update: (p: Partial<WizardData>) => void; }

const ALL_MODULES = [
  { key: "ACADEMICS",    label: "Academics",           desc: "Levels, classes, sections, subjects, and teacher assignments." },
  { key: "ATTENDANCE",   label: "Attendance",          desc: "Daily check-in/out, leave management, and auto-absent marking." },
  { key: "FINANCE",      label: "Finance & Payroll",   desc: "Fee vouchers, salaries, deductions, fines, and bank accounts." },
  { key: "PEOPLE",       label: "People",              desc: "Student, teacher, and guardian profiles with full history." },
  { key: "REPORTING",    label: "Reporting",           desc: "Analytics, summaries, and data export." },
  { key: "EXAMINATIONS", label: "Examinations",        desc: "Exam scheduling, results, and grade management." },
  { key: "DOCUMENTS",    label: "Documents",           desc: "Document storage and management." },
  { key: "REALTIME",     label: "Real-time Updates",   desc: "Live notifications and WebSocket-powered updates." },
];

export default function StepModules({ data, update }: Props) {
  const toggle = (key: string, val: boolean) =>
    update({ modules: { ...data.modules, [key]: val } });

  const enabledCount = Object.values(data.modules).filter(Boolean).length;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 100, mb: 0.5 }}>
        Module <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>Entitlements</Box>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Control which modules this institution can access. Pre-populated from the selected plan — adjust as needed.
      </Typography>
      <Chip label={`${enabledCount} of ${ALL_MODULES.length} modules enabled`} color="primary" size="small" sx={{ mb: 4 }} />

      <Grid container spacing={2}>
        {ALL_MODULES.map((mod) => {
          const enabled = data.modules[mod.key] ?? false;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={mod.key}>
              <Card
                sx={{
                  border: "1px solid",
                  borderColor: enabled ? "primary.main" : "divider",
                  transition: "border-color 0.2s",
                  cursor: "pointer",
                }}
                onClick={() => toggle(mod.key, !enabled)}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Box sx={{ flex: 1, pr: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{mod.label}</Typography>
                        {enabled && <Chip label="ON" color="success" size="small" sx={{ height: 16, fontSize: 10 }} />}
                      </Box>
                      <Typography variant="caption" color="text.secondary">{mod.desc}</Typography>
                    </Box>
                    <Switch
                      checked={enabled}
                      onChange={(e) => { e.stopPropagation(); toggle(mod.key, e.target.checked); }}
                      color="primary" size="small"
                      onClick={(e) => e.stopPropagation()}
                    />
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
