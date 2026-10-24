"use client";

import { useEffect, useState } from "react";
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
  Grid,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { financeService } from "@/services/finance.service";

export interface NamedRow {
  id: string;
  name?: string;
  campusId?: string;
  bankName?: string;
  accountTitle?: string;
}

interface Charge {
  label: string;
  amount: string;
}

interface StudentLine {
  studentId: string;
  name: string;
  regNo: string;
}

interface GenerationResult {
  preview: boolean;
  generated: Array<StudentLine & { amount: string }>;
  skipped: Array<StudentLine & { reason: string }>;
  failed: Array<StudentLine & { reason: string }>;
  totals: { generated: number; skipped: number; failed: number; totalAmount: string };
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface GenerateVouchersDialogProps {
  open: boolean;
  campuses: NamedRow[];
  classes: NamedRow[];
  bankAccounts: NamedRow[];
  onClose: () => void;
  /** Called after a real run so the voucher list can reload. */
  onGenerated: () => void;
}

/**
 * Generates a month of fee vouchers for a campus or class in one action.
 * The user must preview first, which shows how many vouchers and what total
 * would be created, who would be skipped and who has a problem; changing any
 * field makes the preview stale again.
 */
export default function GenerateVouchersDialog({
  open,
  campuses,
  classes,
  bankAccounts,
  onClose,
  onGenerated,
}: GenerateVouchersDialogProps) {
  const { showMessage } = useMessage();
  const now = new Date();
  const [campusId, setCampusId] = useState("");
  const [classId, setClassId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [dueDate, setDueDate] = useState("");
  const [bankId, setBankId] = useState("");
  const [charges, setCharges] = useState<Charge[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- start each opening on the only campus when there is one
      setCampusId(campuses.length === 1 ? campuses[0].id : "");
      setClassId("");
      setBankId("");
      setDueDate("");
      setCharges([]);
      setResult(null);
      setError(null);
    }
  }, [open, campuses]);

  const campusClasses = classes.filter((row) => row.campusId === campusId || !row.campusId);
  const campusBanks = bankAccounts.filter((row) => row.campusId === campusId);
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  const filled = charges.filter((charge) => charge.label.trim() || charge.amount.trim());
  const chargeProblem = filled.find(
    (charge) =>
      !charge.label.trim() ||
      !Number.isFinite(Number(charge.amount)) ||
      Number(charge.amount) <= 0 ||
      Math.round(Number(charge.amount) * 100) / 100 !== Number(charge.amount),
  );
  const formProblem = !campusId
    ? "Choose a campus."
    : !Number.isInteger(yearNumber) || yearNumber < 2000
      ? "Enter a valid year."
      : chargeProblem
        ? "Each one-time charge needs a label and an amount above zero with at most two decimals."
        : null;

  /** Any change makes a previous preview stale. */
  const edit = <T,>(setter: (value: T) => void) => (value: T) => {
    setResult(null);
    setError(null);
    setter(value);
  };

  const payload = (preview: boolean): Record<string, unknown> => ({
    campusId,
    month: monthNumber,
    year: yearNumber,
    preview,
    ...(classId ? { classId } : {}),
    ...(dueDate ? { dueDate } : {}),
    ...(bankId ? { bankId } : {}),
    ...(filled.length
      ? { oneTimeCharges: filled.map((charge) => ({ label: charge.label.trim(), amount: Number(charge.amount) })) }
      : {}),
  });

  const run = async (preview: boolean) => {
    setRunning(true);
    setError(null);
    const { data, success } = await apiHandler<GenerationResult>(
      () => financeService.generateVouchers(payload(preview)) as never,
      { showMessage, silent: preview, successMessage: "Fee vouchers generated." },
    );
    setRunning(false);
    if (!success || !data) {
      setError("The vouchers could not be generated. Nothing was changed unless a report is shown.");
      return;
    }
    setResult(data);
    if (!preview) onGenerated();
  };

  const previewed = result?.preview === true;
  const finished = result !== null && !result.preview;

  return (
    <Dialog open={open} onClose={() => { if (!running) onClose(); }} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Generate fee vouchers</DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        {finished && result ? (
          <Report result={result} />
        ) : (
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Campus *" value={campusId} onChange={(e) => { edit(setCampusId)(e.target.value); setClassId(""); setBankId(""); }} fullWidth disabled={running}>
                {campuses.map((campus) => (
                  <MenuItem key={campus.id} value={campus.id}>{campus.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Class" value={classId} onChange={(e) => edit(setClassId)(e.target.value)} fullWidth disabled={running || !campusId} helperText="Leave empty for every class.">
                <MenuItem value="">All classes</MenuItem>
                {campusClasses.map((row) => (
                  <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select label="Month *" value={month} onChange={(e) => edit(setMonth)(e.target.value)} fullWidth disabled={running}>
                {MONTHS.map((name, index) => (
                  <MenuItem key={name} value={String(index + 1)}>{name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField label="Year *" type="number" value={year} onChange={(e) => edit(setYear)(e.target.value)} fullWidth disabled={running} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Due date"
                type="date"
                value={dueDate}
                onChange={(e) => edit(setDueDate)(e.target.value)}
                fullWidth
                disabled={running}
                helperText="Leave empty to use the institution's due day."
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField select label="Bank account" value={bankId} onChange={(e) => edit(setBankId)(e.target.value)} fullWidth disabled={running || !campusId}>
                <MenuItem value="">None</MenuItem>
                {campusBanks.map((bank) => (
                  <MenuItem key={bank.id} value={bank.id}>{`${bank.bankName ?? "Bank"} · ${bank.accountTitle ?? ""}`}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>One-time charges</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Added to every voucher in this run only, such as an admission fee or exam fee.
              </Typography>
              {charges.map((charge, index) => (
                <Box key={index} sx={{ display: "flex", gap: 1.5, mb: 1.5, alignItems: "center" }}>
                  <TextField
                    label="Label"
                    size="small"
                    value={charge.label}
                    disabled={running}
                    onChange={(e) => edit(setCharges)(charges.map((c, i) => (i === index ? { ...c, label: e.target.value } : c)))}
                    sx={{ flex: 2 }}
                    slotProps={{ htmlInput: { "aria-label": `Charge label ${index + 1}`, maxLength: 60 } }}
                  />
                  <TextField
                    label="Amount"
                    size="small"
                    type="number"
                    value={charge.amount}
                    disabled={running}
                    onChange={(e) => edit(setCharges)(charges.map((c, i) => (i === index ? { ...c, amount: e.target.value } : c)))}
                    sx={{ flex: 1 }}
                    slotProps={{ htmlInput: { "aria-label": `Charge amount ${index + 1}`, min: 0, step: 0.01 } }}
                  />
                  <IconButton aria-label={`Remove charge ${index + 1}`} disabled={running} onClick={() => edit(setCharges)(charges.filter((_, i) => i !== index))}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button size="small" startIcon={<Add />} disabled={running || charges.length >= 10} onClick={() => edit(setCharges)([...charges, { label: "", amount: "" }])}>
                Add charge
              </Button>
            </Grid>

            {formProblem && campusId && (
              <Grid size={{ xs: 12 }}><Typography role="alert" variant="body2" color="error">{formProblem}</Typography></Grid>
            )}
            {error && <Grid size={{ xs: 12 }}><Alert severity="error">{error}</Alert></Grid>}
            {previewed && result && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  Preview only, nothing has been created yet. Check the numbers, then generate.
                </Alert>
                <Report result={result} />
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={running}>{finished ? "Close" : "Cancel"}</Button>
        {!finished && (
          <>
            <Button variant="outlined" onClick={() => run(true)} disabled={running || Boolean(formProblem)}>
              {running && !previewed ? <CircularProgress size={16} color="inherit" /> : "Preview"}
            </Button>
            <Button
              variant="contained"
              onClick={() => run(false)}
              disabled={running || !previewed || (result?.totals.generated ?? 0) === 0}
            >
              {running && previewed ? <CircularProgress size={16} color="inherit" /> : previewed ? `Generate ${result?.totals.generated ?? 0} vouchers` : "Generate"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

function Report({ result }: { result: GenerationResult }) {
  const verb = result.preview ? "would be created" : "created";
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Chip color="success" label={`${result.totals.generated} ${verb}`} />
        <Chip label={`${result.totals.skipped} skipped`} />
        {result.totals.failed > 0 && <Chip color="error" label={`${result.totals.failed} need attention`} />}
        <Chip variant="outlined" label={`Total ${result.totals.totalAmount}`} />
      </Box>
      <Issues title="Skipped" rows={result.skipped} />
      <Issues title="Need attention" rows={result.failed} color="error" />
    </Box>
  );
}

function Issues({ title, rows, color }: { title: string; rows: Array<StudentLine & { reason: string }>; color?: "error" }) {
  if (rows.length === 0) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color={color === "error" ? "error" : undefined} sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Student</TableCell>
            <TableCell>Reg. no.</TableCell>
            <TableCell>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.studentId}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.regNo}</TableCell>
              <TableCell>{row.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
