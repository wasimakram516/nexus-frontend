"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";

export interface PlanOption {
  id: string;
  key: string;
  name: string;
  isActive?: boolean;
}

interface LimitRow {
  key: string;
  label: string;
  current: number;
  allowed: number | null;
  ok: boolean;
}

export interface PlanChangePreview {
  currentPlan: { id: string; key: string; name: string } | null;
  targetPlan: { id: string; key: string; name: string };
  direction: "UPGRADE" | "DOWNGRADE" | "SAME" | "CHANGE";
  modules: { enable: string[]; disable: string[]; unchanged: string[] };
  limits: LimitRow[];
  price: { currency: string; current: number | null; next: number | null };
  blockers: string[];
  canApply: boolean;
}

interface Props {
  institutionId: string;
  currentPlanId: string;
  plans: PlanOption[];
  onClose: () => void;
  onChanged: () => void;
}

const DIRECTION_COLOR = { UPGRADE: "success", DOWNGRADE: "warning", CHANGE: "default", SAME: "default" } as const;

const moduleLabel = (key: string) => key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, " ");

/**
 * Moves a school to another plan. Choosing the plan shows what would happen
 * first (modules switched on and off, the school against the new limits, the
 * price) and the change can only be confirmed when the school fits the plan.
 */
export default function PlanChangeDialog({ institutionId, currentPlanId, plans, onClose, onChanged }: Props) {
  const { showMessage } = useMessage();
  const [targetId, setTargetId] = useState("");
  const [preview, setPreview] = useState<PlanChangePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [price, setPrice] = useState("");

  const choose = async (planId: string) => {
    setTargetId(planId);
    setPreview(null);
    setLoading(true);
    const { data } = await apiHandler<PlanChangePreview>(
      () => platformService.previewPlanChange(institutionId, { planId }),
      { showMessage }
    );
    setLoading(false);
    setPreview(data);
    if (data) setPrice(String(data.price.next ?? data.price.current ?? ""));
  };

  const apply = async () => {
    if (!preview) return;
    setSaving(true);
    const { success } = await apiHandler(
      () =>
        platformService.changePlan(institutionId, {
          planId: targetId,
          ...(price !== "" && { agreedPrice: Number(price) }),
        }),
      { showMessage, successMessage: `Plan changed to ${preview.targetPlan.name}.` }
    );
    setSaving(false);
    if (success) onChanged();
  };

  const offered = plans.filter((plan) => plan.id !== currentPlanId && plan.isActive !== false);

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Change plan</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <TextField select size="small" label="Move to" value={targetId} onChange={(e) => void choose(e.target.value)} fullWidth>
            {offered.map((plan) => (
              <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
            ))}
          </TextField>

          {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={24} /></Box>}

          {preview && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {preview.currentPlan?.name ?? "No plan"} to {preview.targetPlan.name}
                </Typography>
                {preview.direction !== "SAME" && (
                  <Chip size="small" label={preview.direction === "CHANGE" ? "Change" : preview.direction === "UPGRADE" ? "Upgrade" : "Downgrade"} color={DIRECTION_COLOR[preview.direction]} />
                )}
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Modules</Typography>
                {preview.modules.enable.length === 0 && preview.modules.disable.length === 0 ? (
                  <Typography variant="body2">No module changes.</Typography>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 0.5 }}>
                    {preview.modules.enable.length > 0 && (
                      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                        <Typography variant="body2">Switched on:</Typography>
                        {preview.modules.enable.map((key) => <Chip key={key} size="small" color="success" label={moduleLabel(key)} />)}
                      </Box>
                    )}
                    {preview.modules.disable.length > 0 && (
                      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                        <Typography variant="body2">Switched off:</Typography>
                        {preview.modules.disable.map((key) => <Chip key={key} size="small" color="warning" variant="outlined" label={moduleLabel(key)} />)}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {preview.modules.disable.length > 0 && (
                <Alert severity="warning">
                  Modules switched off stop being available to the school straight away. Their data is kept, and they come back if the school moves to a plan that includes them.
                </Alert>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary">Limits under the new plan</Typography>
                {preview.limits.map((row) => (
                  <Box key={row.key} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
                    {row.ok ? <CheckCircle fontSize="small" color="success" /> : <ErrorOutlined fontSize="small" color="error" />}
                    <Typography variant="body2" sx={{ textTransform: "capitalize" }}>{row.label}</Typography>
                    <Typography variant="body2" color={row.ok ? "text.secondary" : "error"} sx={{ ml: "auto" }}>
                      {row.current} now, {row.allowed === null ? "no limit" : `${row.allowed} allowed`}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {preview.price.next !== null ? `${preview.targetPlan.name} costs ${preview.price.currency} ${preview.price.next}` : `${preview.targetPlan.name} is priced case by case`}
                  {preview.price.current !== null && `. Currently agreed: ${preview.price.currency} ${preview.price.current}`}.
                </Typography>
                <TextField size="small" type="number" label="Agreed price from now on" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth />
              </Box>

              {preview.blockers.length > 0 && (
                <Alert severity="error">
                  {preview.blockers.map((reason) => <div key={reason}>{reason}</div>)}
                </Alert>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={apply} disabled={!preview?.canApply || saving}>
          {saving ? "Changing…" : "Change plan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
