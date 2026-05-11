"use client";

import { Box, Card, CardContent, Grid, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import { WizardData } from "@/app/platform/institutions/new/page";
import { toSlug } from "@/lib/slugify";

interface Props { data: WizardData; update: (p: Partial<WizardData>) => void; }

const DEPLOYMENT_MODES = [
  {
    value: "SHARED_HOSTED",
    label: "Shared Hosted",
    tooltip: "Institution runs on Wisemen Soft's shared Nexus server alongside other institutions. Same infrastructure, data isolated by institution ID. Best for Starter plan clients.",
  },
  {
    value: "DEDICATED_HOSTED",
    label: "Dedicated Hosted",
    tooltip: "Institution gets their own dedicated Nexus server instance, still hosted and managed by Wisemen Soft. More resources, better performance. For Growth/Pro clients.",
  },
  {
    value: "SELF_HOSTED",
    label: "Self Hosted",
    tooltip: "Institution hosts Nexus on their own infrastructure. Wisemen Soft provides the software; the client manages the servers. Required by enterprise clients with data residency requirements.",
  },
];
const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export default function StepBasicInfo({ data, update }: Props) {
  const handleName = (name: string) => {
    update({ name, slug: toSlug(name) });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 100, mb: 0.5 }}>
        Basic <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>Information</Box>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Core details about the institution. The slug is used in URLs and cannot be changed later.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5 }}>Identity</Typography>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Institution Name *"
                    value={data.name}
                    onChange={(e) => handleName(e.target.value)}
                    fullWidth
                    helperText="The official name of the institution."
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Slug *"
                    value={data.slug}
                    onChange={(e) => update({ slug: e.target.value })}
                    fullWidth
                    helperText="Auto-generated from name. Backend normalizes it — type freely."
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select label="Status"
                    value={data.status}
                    onChange={(e) => update({ status: e.target.value })}
                    fullWidth
                  >
                    {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select label="Deployment Mode"
                    value={data.deploymentMode}
                    onChange={(e) => update({ deploymentMode: e.target.value })}
                    fullWidth
                    helperText="How Nexus is hosted for this institution."
                  >
                    {DEPLOYMENT_MODES.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                          <span>{m.label}</span>
                          <Tooltip title={m.tooltip} placement="right" arrow>
                            <InfoOutlined sx={{ fontSize: 16, color: "text.disabled", ml: 1 }} />
                          </Tooltip>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5 }}>Contact & Domain</Typography>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Contact Email"
                    type="email"
                    value={data.contactEmail}
                    onChange={(e) => update({ contactEmail: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Contact Phone"
                    value={data.contactPhone}
                    onChange={(e) => update({ contactPhone: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Primary Domain"
                    value={data.primaryDomain}
                    onChange={(e) => update({ primaryDomain: e.target.value })}
                    fullWidth
                    placeholder="e.g. school.edu.pk"
                    helperText="The institution's main web domain."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Internal Notes</Typography>
              <TextField
                label="Notes"
                value={data.notes}
                onChange={(e) => update({ notes: e.target.value })}
                fullWidth multiline rows={3}
                placeholder="Any internal notes about this institution..."
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
