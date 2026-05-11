"use client";

import React from "react";
import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";
import { formatDateTime } from "@/lib/dateFormat";
import { AccountCircle, CalendarToday, Domain, Email, Phone } from "@mui/icons-material";

interface Props {
  institution: Record<string, unknown>;
  runtimeConfig: Record<string, unknown> | null;
}

function InfoRow({ icon, label, value }: { icon: React.JSX.Element; label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
      <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || "—"}</Typography>
      </Box>
    </Box>
  );
}

export default function InstitutionOverviewTab({ institution, runtimeConfig }: Props) {
  const subscription = runtimeConfig?.subscription as Record<string, unknown> | null;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Institution Details</Typography>
            <InfoRow icon={<AccountCircle fontSize="small" />} label="Name" value={String(institution.name ?? "")} />
            <InfoRow icon={<Domain fontSize="small" />} label="Slug" value={String(institution.slug ?? "")} />
            <InfoRow icon={<Domain fontSize="small" />} label="Primary Domain" value={String(institution.primaryDomain ?? "")} />
            <InfoRow icon={<Email fontSize="small" />} label="Contact Email" value={String(institution.contactEmail ?? "")} />
            <InfoRow icon={<Phone fontSize="small" />} label="Contact Phone" value={String(institution.contactPhone ?? "")} />
            <InfoRow icon={<CalendarToday fontSize="small" />} label="Created" value={institution.createdAt ? formatDateTime(String(institution.createdAt)) : "—"} />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Deployment</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={String(institution.status ?? "")} color={institution.status === "ACTIVE" ? "success" : institution.status === "SUSPENDED" ? "warning" : "default"} size="small" />
              <Chip label={String(institution.deploymentMode ?? "").replace(/_/g, " ")} variant="outlined" size="small" />
            </Box>
          </CardContent>
        </Card>

        {subscription && (
          <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Subscription</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                <Chip label={String(subscription.status ?? "")} color={subscription.status === "ACTIVE" ? "success" : subscription.status === "TRIAL" ? "info" : "warning"} size="small" />
                {!!subscription.planName && <Chip label={String(subscription.planName)} variant="outlined" size="small" />}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Auto-renew: {subscription.autoRenew === true ? "Yes" : "No"}
              </Typography>
            </CardContent>
          </Card>
        )}

        {!!institution.notes && (
          <Card sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Notes</Typography>
              <Typography variant="body2" color="text.secondary">{String(institution.notes)}</Typography>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );
}
