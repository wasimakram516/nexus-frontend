"use client";

import { Alert, Button } from "@mui/material";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { formatDate } from "@/lib/dateFormat";

/** Shown across the institution dashboard while the subscription is in TRIAL. */
export default function TrialBanner() {
  const { config, trialDaysLeft } = useRuntimeConfig();
  const subscription = config?.subscription;

  if (!subscription || subscription.status !== "TRIAL") return null;

  const upgradeButton = (
    <Button
      color="inherit"
      size="small"
      href="mailto:nexus@wisemensoft.com?subject=Upgrade%20my%20Nexus%20trial"
      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
    >
      Upgrade Now
    </Button>
  );

  if (trialDaysLeft !== null && trialDaysLeft <= 0) {
    return (
      <Alert severity="error" variant="filled" square action={upgradeButton}>
        Your free trial ended on {formatDate(subscription.endsAt!)}. Module access is locked —
        upgrade to reactivate your workspace.
      </Alert>
    );
  }

  return (
    <Alert severity="warning" square action={upgradeButton}>
      {trialDaysLeft !== null
        ? `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left${subscription.endsAt ? ` (ends ${formatDate(subscription.endsAt)})` : ""}.`
        : "You are on a free trial."}{" "}
      {config?.trialFullAccess
        ? "All modules are unlocked during your trial — upgrade to keep them after it ends."
        : "Enjoying Nexus? Upgrade to keep everything running after the trial."}
    </Alert>
  );
}
