"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { parseSettingObject } from "@/lib/settings";
import { platformService } from "@/services/platform.service";

export const PASS_POLICIES = ["PER_SUBJECT", "AGGREGATE", "AGGREGATE_WITH_MINIMUM"] as const;
export type PassPolicy = (typeof PASS_POLICIES)[number];

const DEFAULT_AGGREGATE = 40;

export const POLICY_LABELS: Record<PassPolicy, string> = {
  PER_SUBJECT: "Pass every subject",
  AGGREGATE: "Pass on the overall percentage",
  AGGREGATE_WITH_MINIMUM: "Pass on the overall percentage, with a minimum in every subject",
};

const POLICY_HELP: Record<PassPolicy, string> = {
  PER_SUBJECT: "A student passes only if they reach the passing marks in every subject they sat.",
  AGGREGATE: "A student passes if their overall percentage reaches the pass percentage, whatever any single subject scored.",
  AGGREGATE_WITH_MINIMUM:
    "A student needs the overall pass percentage and a minimum percentage in every subject, so one weak subject can be carried but not failed outright.",
};

/** A percentage field's problem, or null when it is empty or a number from 0 to 100. */
function percentError(value: string, required: boolean): string | null {
  if (value.trim() === "") return required ? "Enter a percentage." : null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100 ? null : "Must be a number from 0 to 100.";
}

interface ExamSettingsCardProps {
  institutionId: string;
  /** The raw `exams` setting from the institution's runtime config. */
  setting: unknown;
  onSaved?: () => void;
}

/**
 * The institution's pass rule for exams. It decides who passes on every
 * result and report card, so it is edited on its own and checked before it is
 * saved.
 */
export default function ExamSettingsCard({ institutionId, setting, onSaved }: ExamSettingsCardProps) {
  const { showMessage } = useMessage();
  const stored = parseSettingObject(setting);
  const policy: PassPolicy = PASS_POLICIES.includes(stored?.passPolicy as PassPolicy)
    ? (stored?.passPolicy as PassPolicy)
    : "PER_SUBJECT";
  const aggregate = typeof stored?.aggregatePassPercentage === "number" ? stored.aggregatePassPercentage : DEFAULT_AGGREGATE;
  const minimum = typeof stored?.minimumSubjectPercentage === "number" ? stored.minimumSubjectPercentage : null;

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState<PassPolicy>(policy);
  const [draftAggregate, setDraftAggregate] = useState(String(aggregate));
  const [draftMinimum, setDraftMinimum] = useState(minimum === null ? "" : String(minimum));

  const openEdit = () => {
    setDraftPolicy(policy);
    setDraftAggregate(String(aggregate));
    setDraftMinimum(minimum === null ? "" : String(minimum));
    setOpen(true);
  };

  const usesAggregate = draftPolicy !== "PER_SUBJECT";
  const usesMinimum = draftPolicy === "AGGREGATE_WITH_MINIMUM";
  const aggregateError = usesAggregate ? percentError(draftAggregate, true) : null;
  const minimumError = usesMinimum ? percentError(draftMinimum, false) : null;
  const canSave = !aggregateError && !minimumError && !saving;

  const handleSave = async () => {
    setSaving(true);
    const value: Record<string, unknown> = { passPolicy: draftPolicy };
    if (usesAggregate) value.aggregatePassPercentage = Number(draftAggregate);
    if (usesMinimum && draftMinimum.trim() !== "") value.minimumSubjectPercentage = Number(draftMinimum);
    const { success } = await apiHandler(
      () =>
        platformService.updateSettings(institutionId, {
          settings: [
            {
              key: "exams",
              value,
              description: "How a student's overall result in an exam is judged as pass or fail.",
            },
          ],
        }),
      { showMessage, successMessage: "Exam pass rule saved" },
    );
    setSaving(false);
    if (success) {
      setOpen(false);
      onSaved?.();
    }
  };

  return (
    <>
      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Exam pass rule</Typography>
            <Button size="small" variant="outlined" startIcon={<Edit />} onClick={openEdit} aria-label="Edit exam pass rule">Edit</Button>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{POLICY_LABELS[policy]}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {POLICY_HELP[policy]}
          </Typography>
          {policy !== "PER_SUBJECT" && (
            <Typography variant="body2" sx={{ mt: 1.5 }}>
              {`Overall pass percentage: ${aggregate}%`}
              {policy === "AGGREGATE_WITH_MINIMUM" &&
                (minimum === null ? " · No minimum per subject" : ` · Minimum per subject: ${minimum}%`)}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => (saving ? undefined : setOpen(false))} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit exam pass rule</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            <TextField
              select
              label="Pass rule"
              size="small"
              fullWidth
              value={draftPolicy}
              onChange={(e) => setDraftPolicy(e.target.value as PassPolicy)}
              helperText={POLICY_HELP[draftPolicy]}
            >
              {PASS_POLICIES.map((value) => (
                <MenuItem key={value} value={value}>{POLICY_LABELS[value]}</MenuItem>
              ))}
            </TextField>
            {usesAggregate && (
              <TextField
                label="Overall pass percentage"
                type="number"
                size="small"
                fullWidth
                value={draftAggregate}
                onChange={(e) => setDraftAggregate(e.target.value)}
                error={Boolean(aggregateError)}
                helperText={aggregateError ?? `A student at or above this overall percentage passes. Defaults to ${DEFAULT_AGGREGATE}.`}
                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
              />
            )}
            {usesMinimum && (
              <TextField
                label="Minimum percentage in each subject"
                type="number"
                size="small"
                fullWidth
                value={draftMinimum}
                onChange={(e) => setDraftMinimum(e.target.value)}
                error={Boolean(minimumError)}
                helperText={minimumError ?? "Leave empty for no minimum, which behaves like the plain overall percentage rule."}
                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              This changes how every result and report card is judged, including ones already published.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!canSave}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
