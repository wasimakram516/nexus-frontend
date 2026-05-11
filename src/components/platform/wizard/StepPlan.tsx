"use client";

import { useEffect, useState } from "react";
import { Box, Card, CardContent, Chip, CircularProgress, Grid, MenuItem, TextField, Typography } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { WizardData } from "@/app/platform/institutions/new/page";
import env from "@/config/env";

interface Props { data: WizardData; update: (p: Partial<WizardData>) => void; }
interface Plan { id: string; key: string; name: string; description: string; basePrice: string | null; currency: string; billingCycle: string; setupFee: string | null; defaultModules: string[]; limits: { maxCampuses?: number | null }; }

const BILLING_CYCLES = ["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"];

export default function StepPlan({ data, update }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${env.apiBaseUrl}/api/${env.apiVersion}/platform/plans`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setPlans(d?.data ?? []); setLoading(false); });
  }, []);

  const selectedPlan = plans.find((p) => p.id === data.planId);

  const selectPlan = (plan: Plan) => {
    update({
      planId: plan.id,
      planName: plan.name,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      agreedPrice: plan.basePrice ?? "",
      setupFee: plan.setupFee ?? "",
      modules: Object.fromEntries(plan.defaultModules.map((m) => [m, true])),
    });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 100, mb: 0.5 }}>
        Plan & <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>Subscription</Box>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Select a plan. Default modules will be pre-configured in the next step — you can adjust them.
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {plans.map((plan) => {
            const selected = data.planId === plan.id;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan.id}>
                <Card
                  onClick={() => selectPlan(plan)}
                  sx={{
                    border: "2px solid", cursor: "pointer",
                    borderColor: selected ? "primary.main" : "divider",
                    backgroundColor: selected ? "background.paper" : "background.default",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "primary.main" },
                    position: "relative",
                  }}
                >
                  {selected && (
                    <Box sx={{ position: "absolute", top: 12, right: 12 }}>
                      <CheckCircle sx={{ color: "primary.main" }} />
                    </Box>
                  )}
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 2 }}>{plan.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>{plan.description}</Typography>
                    {plan.basePrice ? (
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {plan.currency} {Number(plan.basePrice).toLocaleString()}
                        <Typography component="span" variant="body2" color="text.secondary"> /{plan.billingCycle}</Typography>
                      </Typography>
                    ) : (
                      <Typography variant="h5" sx={{ fontWeight: 800, color: "text.secondary" }}>Custom</Typography>
                    )}
                    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      <Chip label={`${plan.defaultModules.length} modules`} size="small" variant="outlined" />
                      <Chip label={plan.limits?.maxCampuses ? `${plan.limits.maxCampuses} campus${plan.limits.maxCampuses > 1 ? "es" : ""}` : "Unlimited campuses"} size="small" variant="outlined" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}

          {selectedPlan && (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ border: "1px solid", borderColor: "divider" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5 }}>Override Pricing (optional)</Typography>
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Agreed Price"
                        value={data.agreedPrice}
                        onChange={(e) => update({ agreedPrice: e.target.value })}
                        type="number" fullWidth
                        helperText="Leave as plan default or override."
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Currency"
                        value={data.currency}
                        onChange={(e) => update({ currency: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        select label="Billing Cycle"
                        value={data.billingCycle}
                        onChange={(e) => update({ billingCycle: e.target.value })}
                        fullWidth
                      >
                        {BILLING_CYCLES.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Setup Fee"
                        value={data.setupFee}
                        onChange={(e) => update({ setupFee: e.target.value })}
                        type="number" fullWidth
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
