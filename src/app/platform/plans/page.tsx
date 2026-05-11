"use client";

import { useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  Container, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, TextField, Tooltip, Typography,
} from "@mui/material";
import { Add, Edit } from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";

const BILLING_CYCLES = ["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"];
const DEPLOYMENT_MODES = ["SHARED_HOSTED", "DEDICATED_HOSTED", "SELF_HOSTED"];
const ALL_MODULES = ["ACADEMICS", "ATTENDANCE", "FINANCE", "PEOPLE", "REPORTING", "EXAMINATIONS", "DOCUMENTS", "REALTIME"];

interface Plan {
  id: string; key: string; name: string; description?: string;
  basePrice: number | null; currency: string; billingCycle: string;
  setupFee?: number; deploymentModes: string[]; defaultModules: string[];
  limits: Record<string, unknown>; isActive: boolean;
}

export default function PlansPage() {
  const { showMessage } = useMessage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    key: "", name: "", description: "", basePrice: "", currency: "PKR",
    billingCycle: "MONTHLY", setupFee: "", deploymentModes: [] as string[],
    defaultModules: [] as string[], limits: '{"maxCampuses":1}', isActive: true,
  });

  const load = async () => {
    const { data } = await apiHandler<Plan[]>(
      () => platformService.getInstitutions(),
      { showMessage, silent: true }
    );
    // Use public plans endpoint
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${process.env.NEXT_PUBLIC_API_VERSION}/platform/plans`);
    const json = await res.json();
    setPlans(json?.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ key: "", name: "", description: "", basePrice: "", currency: "PKR", billingCycle: "MONTHLY", setupFee: "", deploymentModes: [], defaultModules: [], limits: '{"maxCampuses":1}', isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({ key: p.key, name: p.name, description: p.description ?? "", basePrice: p.basePrice?.toString() ?? "", currency: p.currency, billingCycle: p.billingCycle, setupFee: p.setupFee?.toString() ?? "", deploymentModes: p.deploymentModes, defaultModules: p.defaultModules, limits: JSON.stringify(p.limits), isActive: p.isActive });
    setDialogOpen(true);
  };

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const handleSave = async () => {
    setSaving(true);
    let limits = {};
    try { limits = JSON.parse(form.limits); } catch { showMessage("Invalid JSON in limits.", "error"); setSaving(false); return; }
    const payload = {
      key: form.key, name: form.name, description: form.description,
      basePrice: form.basePrice ? Number(form.basePrice) : null,
      currency: form.currency, billingCycle: form.billingCycle,
      setupFee: form.setupFee ? Number(form.setupFee) : undefined,
      deploymentModes: form.deploymentModes, defaultModules: form.defaultModules,
      limits, isActive: form.isActive,
    };
    if (editing) {
      await apiHandler(() => platformService.updatePlan(editing.id, payload), { showMessage, successMessage: "Plan updated." });
    } else {
      await apiHandler(() => platformService.createPlan(payload), { showMessage, successMessage: "Plan created." });
    }
    setDialogOpen(false);
    setSaving(false);
    load();
  };

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "background.paper" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Plans</Typography>
          <Typography variant="body2" color="text.secondary">Manage subscription plans available on the platform.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Plan</Button>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={3}>
            {plans.map((plan) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan.id}>
                <Card sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{plan.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{plan.key}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                        <Chip label={plan.isActive ? "Active" : "Inactive"} color={plan.isActive ? "success" : "default"} size="small" />
                        <Tooltip title="Edit plan">
                          <IconButton size="small" onClick={() => openEdit(plan)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {plan.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{plan.description}</Typography>
                    )}

                    <Box sx={{ mb: 2 }}>
                      {plan.basePrice !== null ? (
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {plan.currency} {plan.basePrice.toLocaleString()}
                          <Typography component="span" variant="body2" color="text.secondary"> /{plan.billingCycle}</Typography>
                        </Typography>
                      ) : (
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "text.secondary" }}>Custom</Typography>
                      )}
                      {plan.setupFee && (
                        <Typography variant="caption" color="text.secondary">+ {plan.currency} {plan.setupFee.toLocaleString()} setup fee</Typography>
                      )}
                    </Box>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
                      {plan.deploymentModes.map((m) => (
                        <Chip key={m} label={m.replace(/_/g, " ")} size="small" variant="outlined" />
                      ))}
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                      {plan.defaultModules.length} modules · Max {(plan.limits as { maxCampuses?: number | null })?.maxCampuses ?? "∞"} campuses
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Plan" : "New Plan"}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 6 }}><TextField label="Plan Key" value={form.key} onChange={(e) => setForm((p) => ({ ...p, key: e.target.value.toLowerCase() }))} fullWidth required disabled={!!editing} helperText="Lowercase, e.g. starter" /></Grid>
            <Grid size={{ xs: 6 }}><TextField label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth required /></Grid>
            <Grid size={{ xs: 12 }}><TextField label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} fullWidth /></Grid>
            <Grid size={{ xs: 4 }}><TextField label="Base Price" type="number" value={form.basePrice} onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))} fullWidth placeholder="Leave empty for custom" /></Grid>
            <Grid size={{ xs: 4 }}><TextField label="Currency" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} fullWidth /></Grid>
            <Grid size={{ xs: 4 }}><TextField select label="Billing Cycle" value={form.billingCycle} onChange={(e) => setForm((p) => ({ ...p, billingCycle: e.target.value }))} fullWidth>{BILLING_CYCLES.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}</TextField></Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Deployment Modes</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {DEPLOYMENT_MODES.map((m) => (
                  <Chip key={m} label={m.replace(/_/g, " ")} onClick={() => setForm((p) => ({ ...p, deploymentModes: toggleArray(p.deploymentModes, m) }))} color={form.deploymentModes.includes(m) ? "primary" : "default"} variant={form.deploymentModes.includes(m) ? "filled" : "outlined"} sx={{ cursor: "pointer" }} />
                ))}
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Default Modules</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {ALL_MODULES.map((m) => (
                  <Chip key={m} label={m} onClick={() => setForm((p) => ({ ...p, defaultModules: toggleArray(p.defaultModules, m) }))} color={form.defaultModules.includes(m) ? "primary" : "default"} variant={form.defaultModules.includes(m) ? "filled" : "outlined"} sx={{ cursor: "pointer" }} size="small" />
                ))}
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}><TextField label="Limits (JSON)" value={form.limits} onChange={(e) => setForm((p) => ({ ...p, limits: e.target.value }))} fullWidth helperText='e.g. {"maxCampuses": 5}' /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name || !form.key}>
            {saving ? <CircularProgress size={16} color="inherit" /> : editing ? "Save Changes" : "Create Plan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
