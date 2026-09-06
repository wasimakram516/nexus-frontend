"use client";

import { useState } from "react";
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, MenuItem, TextField, Typography,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { platformService } from "@/services/platform.service";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { parseSettingObject } from "@/lib/settings";

function unwrapSettingValue(value: unknown, depth = 0): string {
  if (depth > 10 || value === null || value === undefined) return "—";
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) return unwrapSettingValue(parsed, depth + 1);
      return String(parsed);
    } catch { return value; }
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if ("value" in obj) return unwrapSettingValue(obj.value, depth + 1);
    return JSON.stringify(value);
  }
  return String(value);
}

const DEFAULT_RETENTION_DAYS = 30;
const MIN_RETENTION_DAYS = 7;
const MAX_RETENTION_DAYS = 365;
const DEFAULT_PER_DAY_BASIS = 30;
/** M3 Attendance Dual-Mode track (design doc §5.3, §7.2) — backend defaults to DAILY when unset. */
const DEFAULT_ATTENDANCE_MODE = "DAILY";
const ATTENDANCE_MODES = ["DAILY", "PERIOD"] as const;
type AttendanceMode = (typeof ATTENDANCE_MODES)[number];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 180, flexShrink: 0, pt: 0.2 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}

interface Props {
  institutionId: string;
  runtimeConfig: Record<string, unknown> | null;
  onSaved?: () => void;
}

export default function InstitutionSettingsTab({ institutionId, runtimeConfig, onSaved }: Props) {
  const { showMessage } = useMessage();
  const raw = (runtimeConfig?.settings as Record<string, unknown> | null) ?? null;

  const recycleBinSetting = parseSettingObject(raw?.recycle_bin);
  const payrollSetting = parseSettingObject(raw?.payroll);
  const attendanceSetting = parseSettingObject(raw?.attendance);
  const retentionDaysValue = Number(recycleBinSetting?.retentionDays ?? DEFAULT_RETENTION_DAYS);
  const perDayBasisValue = Number(payrollSetting?.perDayBasis ?? DEFAULT_PER_DAY_BASIS);
  const attendanceModeValue: AttendanceMode =
    attendanceSetting?.mode === "PERIOD" ? "PERIOD" : DEFAULT_ATTENDANCE_MODE;

  const [editOpen, setEditOpen] = useState(false);
  const [retentionDays, setRetentionDays] = useState(String(retentionDaysValue));
  const [perDayBasis, setPerDayBasis] = useState(String(perDayBasisValue));
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>(attendanceModeValue);
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setRetentionDays(String(retentionDaysValue));
    setPerDayBasis(String(perDayBasisValue));
    setAttendanceMode(attendanceModeValue);
    setEditOpen(true);
  };

  const retentionDaysNumber = Number(retentionDays);
  const retentionDaysError =
    retentionDays !== "" &&
    (!Number.isInteger(retentionDaysNumber) ||
      retentionDaysNumber < MIN_RETENTION_DAYS ||
      retentionDaysNumber > MAX_RETENTION_DAYS)
      ? `Must be a whole number between ${MIN_RETENTION_DAYS} and ${MAX_RETENTION_DAYS}.`
      : null;

  const perDayBasisNumber = Number(perDayBasis);
  const perDayBasisError =
    perDayBasis !== "" && (!Number.isFinite(perDayBasisNumber) || perDayBasisNumber <= 0)
      ? "Must be a positive number."
      : null;

  const canSave = !retentionDaysError && !perDayBasisError && !saving;

  const handleSave = async () => {
    setSaving(true);
    const { success } = await apiHandler(
      () =>
        platformService.updateSettings(institutionId, {
          settings: [
            {
              key: "recycle_bin",
              value: { retentionDays: retentionDaysNumber },
              description: "Days a soft-deleted record stays restorable before it becomes eligible for permanent deletion.",
            },
            {
              key: "payroll",
              value: { perDayBasis: perDayBasisNumber },
              description: "Divisor applied to base salary to compute a staff member's daily rate for attendance-based deductions.",
            },
            {
              key: "attendance",
              value: { mode: attendanceMode },
              description: "Whether student attendance is marked once per day (DAILY) or per scheduled period (PERIOD).",
            },
          ],
        }),
      { showMessage, successMessage: "Settings saved successfully" },
    );
    setSaving(false);
    if (success) {
      setEditOpen(false);
      onSaved?.();
    }
  };

  const otherEntries = raw
    ? Object.entries(raw).filter(([key]) => key !== "recycle_bin" && key !== "payroll" && key !== "attendance")
    : [];

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Card sx={{ border: "1px solid", borderColor: "divider", maxWidth: 600 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recycle Bin, Payroll &amp; Attendance</Typography>
              <Button size="small" variant="outlined" startIcon={<Edit />} onClick={openEdit}>
                Edit
              </Button>
            </Box>
            <InfoRow label="Recycle bin retention" value={`${retentionDaysValue} days`} />
            <InfoRow label="Payroll per-day basis" value={`base salary ÷ ${perDayBasisValue}`} />
            <InfoRow label="Attendance mode" value={attendanceModeValue} />
          </CardContent>
        </Card>
      </Grid>

      {otherEntries.length > 0 && (
        <Grid size={12}>
          <Card sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Other Settings</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Additional key-value configuration stored per institution, without a dedicated editor yet.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {otherEntries.map(([key, value]) => (
                  <Box key={key} sx={{ display: "flex", gap: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", color: "primary.main", width: 200, flexShrink: 0, pt: 0.2 }}>
                      {key}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: "break-all" }}>
                      {unwrapSettingValue(value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Dialog open={editOpen} onClose={() => (saving ? undefined : setEditOpen(false))} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Recycle Bin, Payroll &amp; Attendance Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            <TextField
              label="Recycle bin retention period (days)"
              type="number"
              size="small"
              fullWidth
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              error={!!retentionDaysError}
              helperText={retentionDaysError ?? `${MIN_RETENTION_DAYS}–${MAX_RETENTION_DAYS} days, defaults to ${DEFAULT_RETENTION_DAYS} if unset.`}
              slotProps={{ htmlInput: { min: MIN_RETENTION_DAYS, max: MAX_RETENTION_DAYS, step: 1 } }}
            />
            <TextField
              label="Payroll per-day basis (divisor)"
              type="number"
              size="small"
              fullWidth
              value={perDayBasis}
              onChange={(e) => setPerDayBasis(e.target.value)}
              error={!!perDayBasisError}
              helperText={perDayBasisError ?? `E.g. 30 → daily rate = base salary ÷ 30. Defaults to ${DEFAULT_PER_DAY_BASIS} if unset.`}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
            />
            <TextField
              select
              label="Attendance mode"
              size="small"
              fullWidth
              value={attendanceMode}
              onChange={(e) => setAttendanceMode(e.target.value as AttendanceMode)}
              helperText="DAILY marks one status per student per day. PERIOD marks attendance separately for each scheduled class period."
            >
              {ATTENDANCE_MODES.map((value) => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!canSave}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
