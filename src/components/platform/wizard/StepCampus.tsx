"use client";

import { Box, Card, CardContent, FormControlLabel, Grid, Switch, TextField, Typography } from "@mui/material";
import { WizardData } from "@/app/platform/institutions/new/page";

interface Props { data: WizardData; update: (p: Partial<WizardData>) => void; }

export default function StepCampus({ data, update }: Props) {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 100, mb: 0.5 }}>
        First <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>Campus</Box>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Optionally create the institution&apos;s first campus now. You can always add campuses later.
      </Typography>

      <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <FormControlLabel
            control={<Switch checked={data.skipCampus} onChange={(e) => update({ skipCampus: e.target.checked })} color="primary" />}
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Skip this step</Typography>
                <Typography variant="caption" color="text.secondary">Set up campuses later from the institution detail page.</Typography>
              </Box>
            }
          />
        </CardContent>
      </Card>

      {!data.skipCampus && (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5 }}>Campus Details</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Campus Name *"
                  value={data.campusName}
                  onChange={(e) => update({ campusName: e.target.value })}
                  fullWidth placeholder="e.g. Main Campus"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Location"
                  value={data.campusAddress}
                  onChange={(e) => update({ campusAddress: e.target.value })}
                  fullWidth placeholder="e.g. 123 Main Street, Lahore"
                  helperText="Full address or location description."
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Student Hours
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="Start Time" type="time" value={data.campusStudentStart ?? "08:00"} onChange={(e) => update({ campusStudentStart: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="End Time" type="time" value={data.campusStudentEnd ?? "14:00"} onChange={(e) => update({ campusStudentEnd: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Staff Hours
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="Start Time" type="time" value={data.campusStaffStart ?? "07:30"} onChange={(e) => update({ campusStaffStart: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="End Time" type="time" value={data.campusStaffEnd ?? "15:00"} onChange={(e) => update({ campusStaffEnd: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TextField label="Late Threshold (mins)" type="number" value={data.campusLateThreshold ?? "15"} onChange={(e) => update({ campusLateThreshold: e.target.value })} fullWidth helperText="Minutes after start time before marked late." />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="Early Leave Threshold (mins)" type="number" value={data.campusEarlyLeave ?? "15"} onChange={(e) => update({ campusEarlyLeave: e.target.value })} fullWidth helperText="Minutes before end time to flag early leave." />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
