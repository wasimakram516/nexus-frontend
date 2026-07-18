"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Edit, RocketLaunch } from "@mui/icons-material";
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 160, flexShrink: 0, pt: 0.2 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || "—"}</Typography>
    </Box>
  );
}

export default function InstitutionSubscriptionTab({ institutionId, runtimeConfig, onSaved }: Props) {
  const { showMessage } = useMessage();
  const subscription = runtimeConfig?.subscription as Record<string, unknown> | null;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [editOpen, setEditOpen] = useState(false);
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

  const openEdit = () => {
    setForm({
      planId: String(subscription?.planId ?? ""),
      status: String(subscription?.status ?? ""),
      startsAt: toDateInput(subscription?.startsAt),
      endsAt: toDateInput(subscription?.endsAt),
      autoRenew: subscription?.autoRenew === true ? "true" : "false",
      agreedPrice: subscription?.agreedPrice != null ? String(subscription.agreedPrice) : "",
      currency: String(subscription?.currency ?? ""),
      billingCycle: String(subscription?.billingCycle ?? ""),
      pricingNotes: String(subscription?.pricingNotes ?? ""),
    });
    setEditOpen(true);
  };

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

  const save = async (overrides?: Partial<Record<string, unknown>>, message?: string, planIdOverride?: string) => {
    const planId = planIdOverride ?? form.planId;
    if (!planId) {
      showMessage("Select a plan first.", "warning");
      return;
    }
    setSaving(true);
    const { success } = await apiHandler(
      () => platformService.updateSubscription(institutionId, { ...buildPayload(overrides), planId }),
      { showMessage, successMessage: message ?? "Subscription updated." }
    );
    setSaving(false);
    if (success) {
      setEditOpen(false);
      onSaved?.();
    }
  };

  const isTrial = subscription?.status === "TRIAL";
  const trialEndsAt = typeof subscription?.endsAt === "string" ? subscription.endsAt : null;
  const trialExpired = trialEndsAt ? new Date(trialEndsAt).getTime() < Date.now() : false;

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Card sx={{ border: "1px solid", borderColor: "divider", maxWidth: 640 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5, gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Subscription</Typography>
              <Button size="small" variant="outlined" startIcon={<Edit />} onClick={openEdit} sx={{ flexShrink: 0 }}>
                Edit
              </Button>
            </Box>

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

                <InfoRow label="Starts" value={subscription.startsAt ? formatDate(String(subscription.startsAt)) : ""} />
                <InfoRow label="Ends" value={subscription.endsAt ? formatDate(String(subscription.endsAt)) : ""} />
                <InfoRow label="Auto-renew" value={subscription.autoRenew === true ? "Yes" : "No"} />
                <InfoRow label="Billing cycle" value={String(subscription.billingCycle ?? "")} />
                <InfoRow label="Agreed price" value={subscription.agreedPrice != null ? `${subscription.currency ?? ""} ${subscription.agreedPrice}` : ""} />
                {!!subscription.pricingNotes && (
                  <InfoRow label="Pricing notes" value={String(subscription.pricingNotes)} />
                )}

                {isTrial && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <RocketLaunch />}
                    disabled={saving}
                    onClick={() =>
                      save(
                        {
                          status: "ACTIVE",
                          startsAt: new Date().toISOString(),
                          endsAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
                        },
                        "Trial converted to an active subscription.",
                        String(subscription.planId ?? "")
                      )
                    }
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Convert Trial → Active (1 year)
                  </Button>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No subscription yet — use Edit to assign a plan.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Edit subscription dialog */}
      <Dialog open={editOpen} onClose={() => (saving ? undefined : setEditOpen(false))} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Subscription</DialogTitle>
        <DialogContent>
          <Grid container spacing={2.5} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Plan *" size="small" value={form.planId} onChange={(e) => f("planId", e.target.value)} fullWidth>
                {plans.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Status" size="small" value={form.status} onChange={(e) => f("status", e.target.value)} fullWidth>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                type="date" label="Starts At" size="small" value={form.startsAt}
                onChange={(e) => f("startsAt", e.target.value)}
                fullWidth slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                type="date" label="Ends At" size="small" value={form.endsAt}
                onChange={(e) => f("endsAt", e.target.value)}
                fullWidth slotProps={{ inputLabel: { shrink: true } }}
                helperText={form.status === "TRIAL" ? "Trial locks module access after this date." : undefined}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Auto-renew" size="small" value={form.autoRenew} onChange={(e) => f("autoRenew", e.target.value)} fullWidth>
                <MenuItem value="false">No</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Billing Cycle" size="small" value={form.billingCycle} onChange={(e) => f("billingCycle", e.target.value)} fullWidth>
                <MenuItem value="">Keep current</MenuItem>
                {BILLING_CYCLES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Agreed Price" type="number" size="small" value={form.agreedPrice} onChange={(e) => f("agreedPrice", e.target.value)} fullWidth />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Currency" size="small" value={form.currency} onChange={(e) => f("currency", e.target.value)} fullWidth placeholder="PKR" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Pricing Notes" size="small" value={form.pricingNotes} onChange={(e) => f("pricingNotes", e.target.value)} fullWidth multiline minRows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={() => save()} disabled={saving || !form.planId}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
