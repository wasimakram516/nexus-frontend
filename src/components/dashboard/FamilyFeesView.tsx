"use client";

import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Chip, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Print from "@mui/icons-material/Print";
import LedgerStatement, { type LedgerResult } from "@/components/dashboard/LedgerStatement";
import { formatDate } from "@/lib/dateFormat";
import { voucherPeriod } from "@/lib/feeVoucherDocuments";

export interface FamilyFees {
  guardian?: { id: string; name: string };
  students: LedgerResult[];
  totals: { charged: string; paid: string; outstanding: string; overdue: string };
  openVouchers: Array<{
    studentId: string;
    studentName: string;
    voucherId: string;
    voucherNumber: string;
    month: number;
    year: number;
    dueDate: string;
    status: string;
    remaining: string;
  }>;
}

interface FamilyFeesViewProps {
  family: FamilyFees;
  onPrintVoucher?: (voucherId: string) => void;
}

/**
 * What a family owes: the combined totals, every voucher still unpaid across
 * all the children in one list, and each child's full statement. A family with
 * one child just sees that child's statement.
 */
export default function FamilyFeesView({ family, onPrintVoucher }: FamilyFeesViewProps) {
  const { students, totals, openVouchers } = family;
  if (students.length === 0) {
    return <Alert severity="info">There are no students linked to this account yet, so there are no fees to show.</Alert>;
  }
  const several = students.length > 1;

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Chip label={`Total charged ${totals.charged}`} />
        <Chip color="success" label={`Paid ${totals.paid}`} />
        <Chip color={Number(totals.outstanding) > 0 ? "warning" : "default"} label={`To pay ${totals.outstanding}`} />
        {Number(totals.overdue) > 0 && <Chip color="error" label={`Overdue ${totals.overdue}`} />}
      </Box>

      {Number(totals.outstanding) === 0 ? (
        <Alert severity="success" sx={{ mb: 2 }}>Nothing is due. All vouchers are paid.</Alert>
      ) : several ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Vouchers still to pay, all children</Typography>
          <Paper variant="outlined" sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Child</TableCell>
                  <TableCell>Voucher</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Due</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Remaining</TableCell>
                  {onPrintVoucher && <TableCell align="right" />}
                </TableRow>
              </TableHead>
              <TableBody>
                {openVouchers.map((voucher) => (
                  <TableRow key={voucher.voucherId}>
                    <TableCell sx={{ fontWeight: 600 }}>{voucher.studentName}</TableCell>
                    <TableCell>{voucher.voucherNumber}</TableCell>
                    <TableCell>{voucherPeriod(voucher.month, voucher.year)}</TableCell>
                    <TableCell>{formatDate(voucher.dueDate)}</TableCell>
                    <TableCell><Chip size="small" label={voucher.status} color={voucher.status === "OVERDUE" ? "error" : "default"} /></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{voucher.remaining}</TableCell>
                    {onPrintVoucher && (
                      <TableCell align="right">
                        <Tooltip title="Print this voucher">
                          <IconButton size="small" aria-label={`Print voucher ${voucher.voucherNumber} for ${voucher.studentName}`} onClick={() => onPrintVoucher(voucher.voucherId)}>
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
        </Box>
      ) : null}

      {several ? (
        students.map((ledger) => (
          <Accordion key={ledger.student.id} disableGutters variant="outlined" sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Typography sx={{ fontWeight: 700 }}>{ledger.student.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {[ledger.student.regNo, ledger.student.className, ledger.student.sectionName].filter(Boolean).join(" · ")}
                </Typography>
                <Chip size="small" color={Number(ledger.totals.outstanding) > 0 ? "warning" : "success"} label={Number(ledger.totals.outstanding) > 0 ? `To pay ${ledger.totals.outstanding}` : "Paid up"} />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <LedgerStatement ledger={ledger} onPrintVoucher={onPrintVoucher} />
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <LedgerStatement ledger={students[0]} onPrintVoucher={onPrintVoucher} />
      )}
    </Box>
  );
}
