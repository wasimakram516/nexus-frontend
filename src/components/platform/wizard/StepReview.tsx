"use client";

import { Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Grid, Typography } from "@mui/material";
import { ArrowBack, Check } from "@mui/icons-material";
import { WizardData } from "@/app/platform/institutions/new/page";

interface Props {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  onBack?: () => void;
  submitting: boolean;
  submitLabel?: string;
  hideCampus?: boolean;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <Box sx={{ display: "flex", gap: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 160, flexShrink: 0, pt: 0.3 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}

const MODULE_LABELS: Record<string, string> = {
  ACADEMICS: "Academics", ATTENDANCE: "Attendance", FINANCE: "Finance & Payroll",
  PEOPLE: "People", REPORTING: "Reporting", EXAMINATIONS: "Examinations",
  DOCUMENTS: "Documents", REALTIME: "Real-time",
};

export default function StepReview({ data, onSubmit, onCancel, onBack, submitting, submitLabel = "Create Institution", hideCampus = false }: Props) {
  const enabledModules = Object.entries(data.modules).filter(([, v]) => v).map(([k]) => k);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 100, mb: 0.5 }}>
        Review & <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>{hideCampus ? "Save" : "Create"}</Box>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        {hideCampus
          ? "Review your changes before saving. Only modified sections will be updated."
          : "Review everything before creating the institution. All settings can be changed from the institution detail page after creation."}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Basic Information</Typography>
              <ReviewRow label="Name" value={data.name} />
              <ReviewRow label="Slug" value={data.slug} />
              <ReviewRow label="Status" value={data.status} />
              <ReviewRow label="Deployment Mode" value={data.deploymentMode.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} />
              <ReviewRow label="Contact Email" value={data.contactEmail} />
              <ReviewRow label="Contact Phone" value={data.contactPhone} />
              <ReviewRow label="Primary Domain" value={data.primaryDomain} />
            </CardContent>
          </Card>

          <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Subscription</Typography>
              <ReviewRow label="Plan" value={data.planName || "None selected"} />
              <ReviewRow label="Billing Cycle" value={data.billingCycle} />
              <ReviewRow label="Currency" value={data.currency} />
              <ReviewRow label="Agreed Price" value={data.agreedPrice ? `${data.currency} ${data.agreedPrice}` : ""} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Branding</Typography>
              <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                {[data.primaryColor, data.secondaryColor, data.accentColor].map((c, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: 1, backgroundColor: c, border: "1px solid", borderColor: "divider" }} />
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{c}</Typography>
                  </Box>
                ))}
              </Box>
              <ReviewRow label="Display Name" value={data.displayName} />
              <ReviewRow label="Theme" value={data.theme} />
            </CardContent>
          </Card>

          <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Modules ({enabledModules.length} enabled)
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {enabledModules.map((m) => (
                  <Chip key={m} label={MODULE_LABELS[m] ?? m} color="primary" size="small" />
                ))}
                {enabledModules.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No modules selected.</Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {!hideCampus && !data.skipCampus && data.campusName && (
            <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>First Campus</Typography>
                <ReviewRow label="Name" value={data.campusName} />
                <ReviewRow label="Location" value={data.campusAddress} />
                <ReviewRow label="Student Hours" value={`${data.campusStudentStart} – ${data.campusStudentEnd}`} />
                <ReviewRow label="Staff Hours" value={`${data.campusStaffStart} – ${data.campusStaffEnd}`} />
              </CardContent>
            </Card>
          )}

          {hideCampus && (data.settings ?? []).length > 0 && (
            <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Settings ({(data.settings ?? []).filter(s => s.key.trim()).length} entries)
                </Typography>
                {(data.settings ?? []).filter(s => s.key.trim()).map((s, i) => (
                  <ReviewRow key={i} label={s.key} value={s.value || "(empty)"} />
                ))}
              </CardContent>
            </Card>
          )}

          {hideCampus && (
            <Card sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Permissions</Typography>
                <Typography variant="caption" color="text.secondary">
                  Permission templates are managed live in the Permissions step. Any changes made there are already saved.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          {onBack && (
            <Button startIcon={<ArrowBack />} variant="outlined" onClick={onBack} disabled={submitting}>
              Back
            </Button>
          )}
          {onCancel && (
            <Button color="inherit" onClick={onCancel} disabled={submitting} sx={{ color: "text.secondary" }}>
              Cancel
            </Button>
          )}
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Check />}
          onClick={onSubmit}
          disabled={submitting || !data.name || !data.slug}
          sx={{ px: 5, py: 1.5 }}
        >
          {submitting ? `${submitLabel}...` : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
