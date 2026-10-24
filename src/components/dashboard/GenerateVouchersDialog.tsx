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
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import OneTimeChargesEditor, { chargesPayload, filledCharges, invalidCharge, type Charge } from "@/components/dashboard/OneTimeChargesEditor";
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
  const chargesBad = Boolean(invalidCharge(charges));
  const formProblem = !campusId
    ? "Choose a campus."
    : !Number.isInteger(yearNumber) || yearNumber < 2000
      ? "Enter a valid year."
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
    ...(filledCharges(charges).length ? { oneTimeCharges: chargesPayload(charges) } : {}),
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
      <DialogTitle sx={{ fontWeight: 700 }}>Generate fee vouchers for a class or campus</DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        {finished && result ? (
          <Report result={result} />
        ) : (
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">
                Creates this month&apos;s voucher for every student in the campus or class you choose. For just one student, close this and use Add voucher for one student.
              </Typography>
            </Grid>
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
              <OneTimeChargesEditor
                charges={charges}
                onChange={edit(setCharges)}
                disabled={running}
                hint="Added to every voucher in this run only, such as an admission fee or exam fee."
              />
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
            <Button variant="outlined" onClick={() => run(true)} disabled={running || Boolean(formProblem) || chargesBad}>
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
