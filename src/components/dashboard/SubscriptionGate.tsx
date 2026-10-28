"use client";

import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import LockOutlined from "@mui/icons-material/LockOutlined";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/dateFormat";

const SUPPORT_EMAIL = "nexus@wisemensoft.com";

/** Why a school's workspace is closed, or null when it is open. */
export function lockReason(
  status: string | undefined,
  trialDaysLeft: number | null,
  endsAt: string | null | undefined
): { title: string; detail: string } | null {
  if (status === "SUSPENDED") {
    return { title: "This subscription is suspended", detail: "Access to the workspace is paused until the subscription is reactivated." };
  }
  if (status === "CANCELLED") {
    return { title: "This subscription has ended", detail: "The subscription was cancelled, so the workspace is closed. The data is kept." };
  }
  if (status === "TRIAL" && trialDaysLeft !== null && trialDaysLeft <= 0) {
    return {
      title: "The free trial has ended",
      detail: `The trial ended${endsAt ? ` on ${formatDate(endsAt)}` : ""}. Choose a plan to open the workspace again; nothing has been deleted.`,
    };
  }
  return null;
}

/**
 * Closes the workspace with an explanation when a school's subscription is
 * suspended, cancelled or its trial is over, instead of showing screens that
 * would each fail. The platform administrator is never locked out.
 */
export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { config, trialDaysLeft } = useRuntimeConfig();
  const { user } = useAuth();
  const subscription = config?.subscription;
  const reason = user?.role === "SUPERADMIN" ? null : lockReason(subscription?.status, trialDaysLeft, subscription?.endsAt);

  if (!reason) return <>{children}</>;

  return (
    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
      <Card sx={{ maxWidth: 520, width: "100%" }}>
        <CardContent sx={{ py: 6, textAlign: "center" }}>
          <LockOutlined sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{reason.title}</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>{reason.detail}</Typography>
          <Button variant="contained" href={`mailto:${SUPPORT_EMAIL}?subject=Reactivate%20my%20Nexus%20workspace`}>
            Contact Nexus
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
            {SUPPORT_EMAIL}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
