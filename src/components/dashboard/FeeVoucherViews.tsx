"use client";

import { Box, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { DocumentHeader, PrintPage } from "@/components/shared/PrintSheet";
import { formatDate } from "@/lib/dateFormat";
import { isPositive, PrintableVoucher, VOUCHER_COPIES, voucherPeriod } from "@/lib/feeVoucherDocuments";

const cell = { color: "#111", borderColor: "#bbb", py: 0.4, fontSize: "0.8rem" };

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <TableRow>
      <TableCell sx={{ ...cell, fontWeight: bold ? 700 : 400 }}>{label}</TableCell>
      <TableCell sx={{ ...cell, fontWeight: bold ? 700 : 400 }} align="right">{value}</TableCell>
    </TableRow>
  );
}

/** One copy of a voucher: who, what is owed, how to pay it. */
function VoucherCopy({ item, copy }: { item: PrintableVoucher; copy: string }) {
  const { voucher, student, bank } = item;
  return (
    <Box sx={{ border: "1px dashed #777", p: 1.5, breakInside: "avoid" }}>
      <DocumentHeader meta={item.printMeta} title={copy} />
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1 }}>
        <Typography variant="body2" sx={{ color: "#111" }}>
          <strong>{student.name}</strong>
          {` · ${student.regNo}`}
          {student.className ? ` · ${student.className}${student.sectionName ? ` (${student.sectionName})` : ""}` : ""}
        </Typography>
        <Typography variant="body2" sx={{ color: "#111" }}>
          {`${voucher.voucherNumber} · ${voucherPeriod(voucher.month, voucher.year)} · Due ${formatDate(voucher.dueDate)}`}
        </Typography>
      </Box>
      <Table size="small" sx={{ border: "1px solid #bbb" }}>
        <TableBody>
          {voucher.lines.map((line) => (
            <Row key={line.label} label={line.label} value={line.amount} />
          ))}
          {isPositive(voucher.discountAmount) && <Row label="Discounts" value={`− ${voucher.discountAmount}`} />}
          {isPositive(voucher.fineAmount) && <Row label="Attendance fine" value={voucher.fineAmount} />}
          {isPositive(voucher.lateFeeFine) && <Row label="Late fee fine" value={voucher.lateFeeFine} />}
          <Row label="Amount due" value={voucher.finalAmountDue} bold />
          {isPositive(voucher.totalPaid) && <Row label="Already paid" value={voucher.totalPaid} />}
          {isPositive(voucher.totalPaid) && <Row label="Remaining balance" value={voucher.remainingBalance} bold />}
        </TableBody>
      </Table>
      {bank && (
        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#333" }}>
          {`Pay to ${bank.accountTitle}, ${bank.bankName}, account ${bank.accountNumber}`}
          {bank.iban ? `, IBAN ${bank.iban}` : ""}
          {bank.branchCode ? `, branch ${bank.branchCode}` : ""}
        </Typography>
      )}
    </Box>
  );
}

/** One printed page per voucher, with the bank, school and parent copies. */
export function FeeVoucherView({ item }: { item: PrintableVoucher }) {
  return (
    <PrintPage>
      <Box sx={{ display: "grid", gap: 1.5 }}>
        {VOUCHER_COPIES.map((copy) => (
          <VoucherCopy key={copy} item={item} copy={copy} />
        ))}
      </Box>
    </PrintPage>
  );
}
