"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { FamilyFees } from "@/components/dashboard/FamilyFeesView";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { voucherPeriod } from "@/lib/feeVoucherDocuments";
import { financeService } from "@/services/finance.service";

interface PaymentResult {
  results: Array<{
    voucherId: string;
    voucherNumber: string | null;
    studentName: string | null;
    amount: string;
    status: "RECORDED" | "ALREADY_RECORDED" | "FAILED";
    message: string | null;
  }>;
  totals: { recorded: number; failed: number; totalRecorded: string };
}

interface Line {
  checked: boolean;
  amount: string;
}

/** A line's problem, or null when it is unticked or a valid amount no larger than what is owed. */
export function lineProblem(line: Line, remaining: string): string | null {
  if (!line.checked) return null;
  const amount = Number(line.amount);
  if (line.amount.trim() === "" || !Number.isFinite(amount) || amount <= 0) return "Enter an amount above zero.";
  if (Math.round(amount * 100) / 100 !== amount) return "At most two decimals.";
  if (amount > Number(remaining)) return `More than the ${remaining} owed.`;
  return null;
}

interface FamilyPaymentDialogProps {
  open: boolean;
  guardianId: string;
  family: FamilyFees;
  onClose: () => void;
  /** Called after anything was recorded, so the family's totals can reload. */
  onRecorded: () => void;
}

/**
 * Records what a parent pays across several of their children's vouchers in
 * one sitting. Every unpaid voucher is listed with the amount owed already
 * filled in; untick the ones not being paid, or lower an amount for a part
 * payment. Each voucher becomes an ordinary payment, so a refused one is shown
 * and the rest still go through. The sitting has one key for the whole dialog
 * open, so sending it twice never pays twice.
 */
export default function FamilyPaymentDialog({ open, guardianId, family, onClose, onRecorded }: FamilyPaymentDialogProps) {
  const { showMessage } = useMessage();
  const [lines, setLines] = useState<Record<string, Line>>({});
  const [method, setMethod] = useState("CASH");
  const [date, setDate] = useState("");
  const [requestKey, setRequestKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect -- start each opening from the amounts currently owed */
    setLines(Object.fromEntries(family.openVouchers.map((voucher) => [voucher.voucherId, { checked: true, amount: voucher.remaining }])));
    setMethod("CASH");
    setDate(new Date().toISOString().slice(0, 10));
    setRequestKey(crypto.randomUUID());
    setResult(null);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    // Only when it opens: the family reloads after a payment, and that must not wipe the result on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const chosen = useMemo(
    () => family.openVouchers.filter((voucher) => lines[voucher.voucherId]?.checked),
    [family.openVouchers, lines],
  );
  const problems = family.openVouchers.map((voucher) => lineProblem(lines[voucher.voucherId] ?? { checked: false, amount: "" }, voucher.remaining));
  const hasProblem = problems.some(Boolean);
  const total = chosen.reduce((sum, voucher) => sum + (Number(lines[voucher.voucherId]?.amount) || 0), 0);
  const canRecord = chosen.length > 0 && !hasProblem && date !== "" && !saving && !result;

  const update = (voucherId: string, change: Partial<Line>) =>
    setLines((current) => ({ ...current, [voucherId]: { ...current[voucherId], ...change } }));

  const record = async () => {
    setSaving(true);
    setError(null);
    const { data, success } = await apiHandler<PaymentResult>(
      () =>
        financeService.recordFamilyPayment({
          requestKey,
          guardianId,
          paymentMethod: method,
          paymentDate: date,
          payments: chosen.map((voucher) => ({ voucherId: voucher.voucherId, paidAmount: Number(lines[voucher.voucherId].amount) })),
        }) as never,
      { showMessage, silent: true },
    );
    setSaving(false);
    if (!success || !data) {
      setError("The payment could not be recorded. Check the family's list before trying again; nothing is paid twice if you retry.");
      return;
    }
    setResult(data);
    if (data.totals.recorded > 0) {
      showMessage(`Recorded ${data.totals.totalRecorded} across ${data.totals.recorded} voucher${data.totals.recorded === 1 ? "" : "s"}.`, data.totals.failed > 0 ? "warning" : "success");
      onRecorded();
    }
  };

  return (
    <Dialog open={open} onClose={() => { if (!saving) onClose(); }} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Record a family payment</DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        {result ? (
          <Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Chip color="success" label={`${result.totals.recorded} recorded`} />
              {result.totals.failed > 0 && <Chip color="error" label={`${result.totals.failed} not recorded`} />}
              <Chip variant="outlined" label={`Total ${result.totals.totalRecorded}`} />
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Child</TableCell>
                  <TableCell>Voucher</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Result</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.results.map((row) => (
                  <TableRow key={row.voucherId}>
                    <TableCell>{row.studentName ?? "—"}</TableCell>
                    <TableCell>{row.voucherNumber ?? "—"}</TableCell>
                    <TableCell align="right">{row.amount}</TableCell>
                    <TableCell sx={{ color: row.status === "FAILED" ? "error.main" : undefined }}>
                      {row.status === "RECORDED" ? "Recorded" : row.status === "ALREADY_RECORDED" ? "Already recorded" : row.message ?? "Not recorded"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ) : family.openVouchers.length === 0 ? (
          <Alert severity="success">This family has nothing left to pay.</Alert>
        ) : (
          <Box>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <TextField select size="small" label="Method" value={method} onChange={(e) => setMethod(e.target.value)} disabled={saving} sx={{ minWidth: 180 }}>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank transfer</MenuItem>
              </TextField>
              <TextField size="small" type="date" label="Payment date" value={date} onChange={(e) => setDate(e.target.value)} disabled={saving} slotProps={{ inputLabel: { shrink: true } }} />
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Child</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Owed</TableCell>
                  <TableCell sx={{ width: 160 }}>Paying now</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {family.openVouchers.map((voucher, index) => {
                  const line = lines[voucher.voucherId] ?? { checked: false, amount: "" };
                  return (
                    <TableRow key={voucher.voucherId}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={line.checked}
                          disabled={saving}
                          onChange={(e) => update(voucher.voucherId, { checked: e.target.checked })}
                          slotProps={{ input: { "aria-label": `Pay ${voucher.studentName} ${voucherPeriod(voucher.month, voucher.year)}` } }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{voucher.studentName}</TableCell>
                      <TableCell>{voucherPeriod(voucher.month, voucher.year)}</TableCell>
                      <TableCell align="right">{voucher.remaining}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.amount}
                          disabled={saving || !line.checked}
                          onChange={(e) => update(voucher.voucherId, { amount: e.target.value })}
                          error={Boolean(problems[index])}
                          helperText={problems[index] ?? undefined}
                          slotProps={{ htmlInput: { "aria-label": `Amount for ${voucher.studentName} ${voucherPeriod(voucher.month, voucher.year)}`, min: 0, step: 0.01 } }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Typography sx={{ mt: 2, fontWeight: 700, textAlign: "right" }}>{`Total ${total.toFixed(2)}`}</Typography>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={saving}>{result ? "Close" : "Cancel"}</Button>
        {!result && family.openVouchers.length > 0 && (
          <Button variant="contained" onClick={record} disabled={!canRecord}>
            {saving ? <CircularProgress size={16} color="inherit" /> : `Record ${total.toFixed(2)}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
