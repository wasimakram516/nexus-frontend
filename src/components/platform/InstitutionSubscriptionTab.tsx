"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { RocketLaunch, Save } from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { platformService } from "@/services/platform.service";

interface Props {
  institutionId: string;
  runtimeConfig: Record<string, unknown> | null;
  onSaved?: () => void;
}

interface Plan {
  id: string;
  key: string;
  name: string;
}

const STATUS_COLOR: Record<string, "success" | "info" | "warning" | "error" | "default"> = {
  ACTIVE: "success", TRIAL: "info", PAST_DUE: "warning", SUSPENDED: "warning", CANCELLED: "error",
};

const STATUSES = ["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"];
const BILLING_CYCLES = ["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"];

const toDateInput = (value: unknown) =>
  typeof value === "string" && value ? value.slice(0, 10) : "";

export default function InstitutionSubscriptionTab({ institutionId, runtimeConfig, onSaved }: Props) {
  const { showMessage } = useMessage();
  const subscription = runtimeConfig?.subscription as Record<string, unknown> | null;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    planId: "",
    status: "",
    startsAt: "",
    endsAt: "",
    autoRenew: "false",
    agreedPrice: "",
    currency: "",
    billingCycle: "",
    pricingNotes: "",
  });

  useEffect(() => {
    apiHandler<Plan[]>(() => platformService.getPlans(), { showMessage, silent: true }).then(
      ({ data }) => setPlans(Array.isArray(data) ? data : [])
    );
  }, [showMessage]);

  useEffect(() => {
    if (!subscription) return;
    setForm((prev) => ({
      ...prev,
      planId: String(subscription.planId ?? ""),
      status: String(subscription.status ?? ""),
      startsAt: toDateInput(subscription.startsAt),
      endsAt: toDateInput(subscription.endsAt),
      autoRenew: subscription.autoRenew === true ? "true" : "false",
    }));
  }, [subscription]);

  const f = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const buildPayload = (overrides?: Partial<Record<string, unknown>>) => ({
    planId: form.planId,
    ...(form.status && { status: form.status }),
    ...(form.startsAt && { startsAt: new Date(form.startsAt).toISOString() }),
    ...(form.endsAt && { endsAt: new Date(form.endsAt).toISOString() }),
    autoRenew: form.autoRenew === "true",
    ...(form.agreedPrice && { agreedPrice: Number(form.agreedPrice) }),
    ...(form.currency && { currency: form.currency }),
    ...(form.billingCycle && { billingCycle: form.billingCycle }),
    ...(form.pricingNotes && { pricingNotes: form.pricingNotes }),
    ...overrides,
  });

  const save = async (overrides?: Partial<Record<string, unknown>>, message?: string) => {
    if (!form.planId) {
      showMessage("Select a plan first.", "warning");
      return;
    }
    setSaving(true);
    const { success } = await apiHandler(
      () => platformService.updateSubscription(institutionId, buildPayload(overrides)),
      { showMessage, successMessage: message ?? "Subscription updated." }
    );
    setSaving(false);
    if (success) onSaved?.();
  };

  const isTrial = subscription?.status === "TRIAL";
  const trialEndsAt = typeof subscription?.endsAt === "string" ? subscription.endsAt : null;
  const trialExpired = trialEndsAt ? new Date(trialEndsAt).getTime() < Date.now() : false;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Current Subscription</Typography>

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
                  {isTrial && trialEndsAt && (
                    <Chip
                      label={trialExpired ? `Trial expired ${formatDate(trialEndsAt)}` : `Trial ends ${formatDate(trialEndsAt)}`}
                      color={trialExpired ? "error" : "warning"}
                      size="small"
                    />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {isTrial
                    ? trialExpired
                      ? "This trial has expired — module access is locked for institution users until the subscription is activated."
                      : "This institution is on a free trial. Convert it to a paid subscription when they are ready."
                    : "Manage the billing state and validity window of this subscription."}
                </Typography>

                {isTrial && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <RocketLaunch />}
                    disabled={saving || !form.planId}
                    onClick={() =>
                      save(
                        {
                          status: "ACTIVE",
                          startsAt: new Date().toISOString(),
                          endsAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
                        },
                        "Trial converted to an active subscription."
                      )
                    }
                    fullWidth
                  >
                    Convert Trial → Active (1 year)
                  </Button>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No subscription yet — saving the form will create one.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Edit Subscription</Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Plan *" value={form.planId} onChange={(e) => f("planId", e.target.value)} fullWidth>
                  {plans.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Status" value={form.status} onChange={(e) => f("status", e.target.value)} fullWidth>
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  type="date" label="Starts At" value={form.startsAt}
                  onChange={(e) => f("startsAt", e.target.value)}
                  fullWidth slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  type="date" label="Ends At" value={form.endsAt}
                  onChange={(e) => f("endsAt", e.target.value)}
                  fullWidth slotProps={{ inputLabel: { shrink: true } }}
                  helperText={form.status === "TRIAL" ? "Trial locks module access after this date." : undefined}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Auto-renew" value={form.autoRenew} onChange={(e) => f("autoRenew", e.target.value)} fullWidth>
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Billing Cycle" value={form.billingCycle} onChange={(e) => f("billingCycle", e.target.value)} fullWidth>
                  <MenuItem value="">Keep current</MenuItem>
                  {BILLING_CYCLES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="Agreed Price" type="number" value={form.agreedPrice} onChange={(e) => f("agreedPrice", e.target.value)} fullWidth />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="Currency" value={form.currency} onChange={(e) => f("currency", e.target.value)} fullWidth placeholder="PKR" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Pricing Notes" value={form.pricingNotes} onChange={(e) => f("pricingNotes", e.target.value)} fullWidth multiline minRows={2} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                  disabled={saving || !form.planId}
                  onClick={() => save()}
                >
                  Save Subscription
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
