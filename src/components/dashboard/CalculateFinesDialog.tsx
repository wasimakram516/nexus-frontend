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
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { financeService } from "@/services/finance.service";
import { MONTHS, type NamedRow } from "@/components/dashboard/GenerateVouchersDialog";

interface StudentLine {
  studentId: string;
  name: string;
  regNo: string;
}

interface FineResult {
  preview: boolean;
  fined: Array<
    StudentLine & {
      amount: string;
      action: "created" | "updated";
      counts: { absent: number; late: number; halfDay: number; leave: number };
    }
  >;
  unchanged: Array<StudentLine & { reason: string }>;
  totals: { fined: number; unchanged: number; totalAmount: string };
}

interface CalculateFinesDialogProps {
  open: boolean;
  campuses: NamedRow[];
  classes: NamedRow[];
  onClose: () => void;
  /** Called after a real run so the fines list can reload. */
  onCalculated: () => void;
}

/**
 * Calculates a month of attendance fines for a campus or class from its fine
 * rule. The user must preview first; changing any field makes the preview stale.
 */
export default function CalculateFinesDialog({ open, campuses, classes, onClose, onCalculated }: CalculateFinesDialogProps) {
  const { showMessage } = useMessage();
  const now = new Date();
  const [campusId, setCampusId] = useState("");
  const [classId, setClassId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [result, setResult] = useState<FineResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- start each opening on the only campus when there is one
      setCampusId(campuses.length === 1 ? campuses[0].id : "");
      setClassId("");
      setResult(null);
      setError(null);
    }
  }, [open, campuses]);

  const campusClasses = classes.filter((row) => row.campusId === campusId || !row.campusId);
  const yearNumber = Number(year);
  const formProblem = !campusId ? "Choose a campus." : !Number.isInteger(yearNumber) || yearNumber < 2000 ? "Enter a valid year." : null;

  /** Any change makes a previous preview stale. */
  const edit = <T,>(setter: (value: T) => void) => (value: T) => {
    setResult(null);
    setError(null);
    setter(value);
  };

  const run = async (preview: boolean) => {
    setRunning(true);
    setError(null);
    const { data, success } = await apiHandler<FineResult>(
      () =>
        financeService.generateFines({
          campusId,
          month: Number(month),
          year: yearNumber,
          preview,
          ...(classId ? { classId } : {}),
        }) as never,
      { showMessage, silent: preview, successMessage: "Attendance fines calculated." },
    );
    setRunning(false);
    if (!success || !data) {
      setError("The fines could not be calculated. Nothing was changed unless a report is shown.");
      return;
    }
    setResult(data);
    if (!preview) onCalculated();
  };

  const previewed = result?.preview === true;
  const finished = result !== null && !result.preview;

  return (
    <Dialog open={open} onClose={() => { if (!running) onClose(); }} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Calculate attendance fines</DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        {finished && result ? (
          <Report result={result} />
        ) : (
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Campus *" value={campusId} onChange={(e) => { edit(setCampusId)(e.target.value); setClassId(""); }} fullWidth disabled={running}>
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
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">
                Uses the fine rule for the campus or class and the daily attendance of the month. Fines entered by hand, fines already paid and months whose voucher is already issued are left alone, so calculate fines before generating vouchers.
              </Typography>
            </Grid>
            {formProblem && campusId && (
              <Grid size={{ xs: 12 }}><Typography role="alert" variant="body2" color="error">{formProblem}</Typography></Grid>
            )}
            {error && <Grid size={{ xs: 12 }}><Alert severity="error">{error}</Alert></Grid>}
            {previewed && result && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  Preview only, nothing has been saved yet. Check the numbers, then calculate.
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
            <Button variant="contained" onClick={() => run(false)} disabled={running || !previewed || (result?.totals.fined ?? 0) === 0}>
              {running && previewed ? <CircularProgress size={16} color="inherit" /> : previewed ? `Save ${result?.totals.fined ?? 0} fines` : "Save"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

function Report({ result }: { result: FineResult }) {
  const verb = result.preview ? "would be saved" : "saved";
  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Chip color="success" label={`${result.totals.fined} ${verb}`} />
        <Chip label={`${result.totals.unchanged} not changed`} />
        <Chip variant="outlined" label={`Total ${result.totals.totalAmount}`} />
      </Box>
      {result.fined.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Fines</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Reg. no.</TableCell>
                <TableCell>Absent</TableCell>
                <TableCell>Late</TableCell>
                <TableCell>Half day</TableCell>
                <TableCell>Leave</TableCell>
                <TableCell>Fine</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.fined.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.regNo}</TableCell>
                  <TableCell>{row.counts.absent}</TableCell>
                  <TableCell>{row.counts.late}</TableCell>
                  <TableCell>{row.counts.halfDay}</TableCell>
                  <TableCell>{row.counts.leave}</TableCell>
                  <TableCell>{row.amount}{row.action === "updated" ? " (updated)" : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
      {result.unchanged.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Not changed</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Reg. no.</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.unchanged.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.regNo}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
