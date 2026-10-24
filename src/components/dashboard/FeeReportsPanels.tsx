"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { type NamedRow } from "@/components/dashboard/GenerateVouchersDialog";
import LedgerStatement, { type LedgerResult } from "@/components/dashboard/LedgerStatement";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { voucherPeriod } from "@/lib/feeVoucherDocuments";
import { financeService } from "@/services/finance.service";

interface DefaultersResult {
  defaulters: Array<{
    studentId: string;
    name: string;
    regNo: string;
    className: string | null;
    sectionName: string | null;
    monthsOutstanding: number;
    totalOutstanding: string;
    oldestDueDate: string;
    vouchers: Array<{ voucherId: string; month: number; year: number; remaining: string }>;
  }>;
  totals: { students: number; outstanding: string };
}

/** Students who owe past a due date, for a campus and optionally a class. */
export function DefaultersPanel({ campuses, classes }: { campuses: NamedRow[]; classes: NamedRow[] }) {
  const { showMessage } = useMessage();
  const [campusId, setCampusId] = useState(campuses.length === 1 ? campuses[0].id : "");
  const [classId, setClassId] = useState("");
  const [minMonths, setMinMonths] = useState("1");
  const [result, setResult] = useState<DefaultersResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const months = Number(minMonths);
  const validMonths = Number.isInteger(months) && months >= 1 && months <= 36;

  const load = useCallback(async () => {
    if (!campusId || !validMonths) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data } = await apiHandler<DefaultersResult>(
      () =>
        financeService.getDefaulters({
          campusId,
          minMonths: months,
          ...(classId ? { classId } : {}),
        }) as never,
      { showMessage, silent: true },
    );
    setResult(data && Array.isArray(data.defaulters) ? data : null);
    setError(data && Array.isArray(data.defaulters) ? null : "The defaulters could not be loaded.");
    setLoading(false);
  }, [campusId, classId, months, validMonths, showMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reload whenever a filter changes
    void load();
  }, [load]);

  const campusClasses = classes.filter((row) => row.campusId === campusId || !row.campusId);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>Fee defaulters</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Students with an unpaid balance on a voucher whose due date has passed, largest debt first.
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <TextField select size="small" label="Campus" value={campusId} onChange={(e) => { setCampusId(e.target.value); setClassId(""); }} sx={{ minWidth: 200 }}>
          {campuses.map((campus) => (
            <MenuItem key={campus.id} value={campus.id}>{campus.name}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!campusId} sx={{ minWidth: 200 }}>
          <MenuItem value="">All classes</MenuItem>
          {campusClasses.map((row) => (
            <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="number"
          label="Months overdue at least"
          value={minMonths}
          onChange={(e) => setMinMonths(e.target.value)}
          error={!validMonths}
          helperText={validMonths ? undefined : "Enter 1 to 36."}
          sx={{ width: 200 }}
          slotProps={{ htmlInput: { min: 1, max: 36 } }}
        />
      </Box>

      {!campusId && <Alert severity="info">Choose a campus to see who owes fees.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>}
      {!loading && result && (
        <>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Chip color="error" label={`${result.totals.students} students`} />
            <Chip variant="outlined" label={`Outstanding ${result.totals.outstanding}`} />
          </Box>
          {result.defaulters.length === 0 ? (
            <Alert severity="success">Nobody owes fees past a due date for this choice.</Alert>
          ) : (
            <Paper variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Reg. no.</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell align="right">Months</TableCell>
                    <TableCell>Owed for</TableCell>
                    <TableCell>Oldest due</TableCell>
                    <TableCell align="right">Outstanding</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.defaulters.map((row) => (
                    <TableRow key={row.studentId}>
                      <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                      <TableCell>{row.regNo}</TableCell>
                      <TableCell>{row.className ? `${row.className}${row.sectionName ? ` (${row.sectionName})` : ""}` : "—"}</TableCell>
                      <TableCell align="right">{row.monthsOutstanding}</TableCell>
                      <TableCell>{row.vouchers.map((voucher) => voucherPeriod(voucher.month, voucher.year)).join(", ")}</TableCell>
                      <TableCell>{formatDate(row.oldestDueDate)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{row.totalOutstanding}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}

export interface StudentChoice {
  value: string;
  label: string;
}

/** One student's fee statement: every voucher, its payments and a running balance. */
export function LedgerPanel({ students, onPrintVoucher }: { students: StudentChoice[]; onPrintVoucher?: (voucherId: string) => void }) {
  const { showMessage } = useMessage();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the statement when no student is chosen
      setLedger(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      const { data } = await apiHandler<LedgerResult>(() => financeService.getLedger(studentId) as never, { showMessage, silent: true });
      if (cancelled) return;
      setLedger(data && Array.isArray(data.entries) ? data : null);
      setError(data && Array.isArray(data.entries) ? null : "The ledger could not be loaded.");
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [studentId, showMessage]);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>Student fee ledger</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Every voucher of a student with what was paid and what is still owed.
      </Typography>
      <Autocomplete
        size="small"
        options={students}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        onChange={(_event, option) => setStudentId(option?.value ?? null)}
        renderInput={(params) => <TextField {...params} label="Student" />}
        sx={{ maxWidth: 420, mb: 2 }}
      />

      {!studentId && <Alert severity="info">Choose a student to see their statement.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>}
      {!loading && ledger && (
        <>
          <LedgerStatement ledger={ledger} onPrintVoucher={onPrintVoucher} />
        </>
      )}
    </Box>
  );
}
