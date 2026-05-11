"use client";

import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";

interface Props {
  institutionId: string;
  runtimeConfig: Record<string, unknown> | null;
  onSaved?: () => void;
}

const STATUS_COLOR: Record<string, "success" | "info" | "warning" | "error" | "default"> = {
  ACTIVE: "success", TRIAL: "info", PAST_DUE: "warning", SUSPENDED: "warning", CANCELLED: "error",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 130, flexShrink: 0, pt: 0.2 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || "—"}</Typography>
    </Box>
  );
}

export default function InstitutionSubscriptionTab({ runtimeConfig }: Props) {
  const subscription = runtimeConfig?.subscription as Record<string, unknown> | null;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Subscription</Typography>

            {subscription ? (
              <>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  <Chip
                    label={String(subscription.status ?? "")}
                    color={STATUS_COLOR[String(subscription.status)] ?? "default"}
                    size="small"
                  />
                  {!!subscription.planName && (
                    <Chip label={String(subscription.planName)} variant="outlined" size="small" />
                  )}
                </Box>
                <InfoRow label="Plan" value={String(subscription.planName ?? "None")} />
                <InfoRow label="Status" value={String(subscription.status ?? "—")} />
                <InfoRow label="Auto-renew" value={subscription.autoRenew === true ? "Yes" : "No"} />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">No active subscription.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
