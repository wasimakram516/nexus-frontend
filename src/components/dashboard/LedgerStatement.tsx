"use client";

import { Alert, Box, Chip, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from "@mui/material";
import Print from "@mui/icons-material/Print";
import { formatDate } from "@/lib/dateFormat";
import { voucherPeriod } from "@/lib/feeVoucherDocuments";

export interface LedgerResult {
  student: { id: string; name: string; regNo: string; className: string | null; sectionName: string | null };
  entries: Array<{
    voucherId: string;
    voucherNumber: string;
    month: number;
    year: number;
    dueDate: string;
    status: string;
    charged: string;
    paid: string;
    remaining: string;
    runningBalance: string;
    payments: Array<{ id: string; amount: string; method: string; date: string }>;
  }>;
  totals: { charged: string; paid: string; outstanding: string; overdue: string };
}

const STATUS_COLORS: Record<string, "success" | "warning" | "error" | "default"> = {
  PAID: "success",
  PARTIAL: "warning",
  PENDING: "default",
  OVERDUE: "error",
};

interface LedgerStatementProps {
  ledger: LedgerResult;
  /** Adds a print button to every voucher row. */
  onPrintVoucher?: (voucherId: string) => void;
}

/**
 * One student's statement: the totals, then every voucher with what was paid
 * and what is still owed. Used by the staff ledger, the front-desk family view
 * and the student and guardian page, so they always read the same.
 */
export default function LedgerStatement({ ledger, onPrintVoucher }: LedgerStatementProps) {
  return (
    <>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Chip label={`Charged ${ledger.totals.charged}`} />
        <Chip color="success" label={`Paid ${ledger.totals.paid}`} />
        <Chip color={Number(ledger.totals.outstanding) > 0 ? "warning" : "default"} label={`Outstanding ${ledger.totals.outstanding}`} />
        {Number(ledger.totals.overdue) > 0 && <Chip color="error" label={`Overdue ${ledger.totals.overdue}`} />}
      </Box>
      {ledger.entries.length === 0 ? (
        <Alert severity="info">No vouchers yet.</Alert>
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Voucher</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Charged</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Remaining</TableCell>
                <TableCell align="right">Running balance</TableCell>
                <TableCell>Payments</TableCell>
                {onPrintVoucher && <TableCell align="right" />}
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger.entries.map((entry) => (
                <TableRow key={entry.voucherId}>
                  <TableCell>{entry.voucherNumber}</TableCell>
                  <TableCell>{voucherPeriod(entry.month, entry.year)}</TableCell>
                  <TableCell>{formatDate(entry.dueDate)}</TableCell>
                  <TableCell><Chip size="small" label={entry.status} color={STATUS_COLORS[entry.status] ?? "default"} /></TableCell>
                  <TableCell align="right">{entry.charged}</TableCell>
                  <TableCell align="right">{entry.paid}</TableCell>
                  <TableCell align="right">{entry.remaining}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{entry.runningBalance}</TableCell>
                  <TableCell>
                    {entry.payments.length === 0
                      ? "—"
                      : entry.payments.map((payment) => `${payment.amount} on ${formatDate(payment.date)} (${payment.method})`).join("; ")}
                  </TableCell>
                  {onPrintVoucher && (
                    <TableCell align="right">
                      <Tooltip title="Print this voucher">
                        <IconButton size="small" aria-label={`Print voucher ${entry.voucherNumber}`} onClick={() => onPrintVoucher(entry.voucherId)}>
                          <Print fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </>
  );
}
