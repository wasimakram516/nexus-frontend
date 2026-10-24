"use client";

import { Box, Typography } from "@mui/material";
import { PrintPage } from "@/components/shared/PrintSheet";
import { amountInWords } from "@/lib/amountInWords";
import { formatDate } from "@/lib/dateFormat";
import { isPositive, PrintableVoucher, VOUCHER_COPIES, voucherPeriod } from "@/lib/feeVoucherDocuments";

const BORDER = "1px solid #777";
const GREY = "#d9d9d9";
const fontSize = "0.72rem";

/** A two-column label and value row inside a bordered block. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", borderBottom: BORDER, fontSize }}>
      <Box sx={{ width: "42%", fontWeight: 700, p: 0.5 }}>{label}</Box>
      <Box sx={{ flex: 1, p: 0.5 }}>{value}</Box>
    </Box>
  );
}

/** A particulars line: what it is and the amount. */
function AmountRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Box sx={{ display: "flex", borderBottom: BORDER, fontSize, fontWeight: bold ? 700 : 400 }}>
      <Box sx={{ flex: 1, p: 0.5, borderRight: BORDER }}>{label}</Box>
      <Box sx={{ width: "32%", p: 0.5, textAlign: "right" }}>{value}</Box>
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Box sx={{ fontWeight: 700, fontSize, p: 0.5, bgcolor: "#f1f1f1", borderBottom: BORDER }}>{children}</Box>;
}

/** One copy of a voucher: who it is for, what is owed, and how to pay it. */
function VoucherCopy({ item, copy }: { item: PrintableVoucher; copy: string }) {
  const { voucher, student, bank, print, printMeta } = item;
  const institution = printMeta.institution;
  const words = amountInWords(voucher.finalAmountDue);
  const paid = isPositive(voucher.totalPaid);

  return (
    <Box sx={{ border: BORDER, display: "flex", flexDirection: "column", breakInside: "avoid", minWidth: 0 }}>
      {/* Logo and the name of this copy */}
      <Box sx={{ display: "flex", alignItems: "stretch", borderBottom: BORDER }}>
        <Box sx={{ width: 74, p: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {institution.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- print documents use the plain image so it prints reliably
            <img src={institution.logoUrl} alt={`${institution.name} logo`} style={{ maxHeight: 40, maxWidth: 66 }} />
          ) : null}
        </Box>
        <Box sx={{ flex: 1, bgcolor: GREY, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }}>
          {copy}
        </Box>
      </Box>

      {/* Invoice details */}
      <Box sx={{ p: 0.5, borderBottom: BORDER, fontSize: "0.78rem" }}>
        {[
          ["Invoice #", voucher.voucherNumber],
          ["Invoice Date", formatDate(voucher.issueDate)],
          ["Due Date", formatDate(voucher.dueDate)],
        ].map(([label, value]) => (
          <Box key={label} sx={{ display: "flex", gap: 1 }}>
            <Box sx={{ width: "42%", fontWeight: 700, textAlign: "right" }}>{label}</Box>
            <Box sx={{ flex: 1, fontWeight: label === "Invoice #" ? 700 : 400 }}>{value}</Box>
          </Box>
        ))}
      </Box>

      {/* Student */}
      <InfoRow label="Student ID" value={student.regNo} />
      <InfoRow label="Student Name" value={student.name} />
      <InfoRow label="Class" value={student.className ?? "—"} />
      <InfoRow label="Section" value={student.sectionName ?? "—"} />
      <InfoRow label="Period" value={voucherPeriod(voucher.month, voucher.year)} />

      {/* Particulars */}
      <Box sx={{ display: "flex", borderBottom: BORDER, bgcolor: "#f1f1f1", fontSize, fontWeight: 700 }}>
        <Box sx={{ flex: 1, p: 0.5, borderRight: BORDER }}>Particulars</Box>
        <Box sx={{ width: "32%", p: 0.5, textAlign: "right" }}>{`Amount (${print.currencyLabel})`}</Box>
      </Box>
      {voucher.lines.map((line) => (
        <AmountRow key={line.label} label={line.label} value={line.amount} />
      ))}
      {isPositive(voucher.discountAmount) && <AmountRow label="Discounts" value={`-${voucher.discountAmount}`} />}
      {isPositive(voucher.fineAmount) && <AmountRow label="Attendance fine" value={voucher.fineAmount} />}
      {isPositive(voucher.lateFeeFine) && <AmountRow label="Fine for late payment" value={voucher.lateFeeFine} />}
      <AmountRow label="Payable within due date" value={voucher.finalAmountDue} bold />
      {paid && <AmountRow label="Already paid" value={voucher.totalPaid} />}
      {paid && <AmountRow label="Remaining balance" value={voucher.remainingBalance} bold />}

      {words && (
        <>
          <SectionTitle>In Words</SectionTitle>
          <Box sx={{ p: 0.5, fontSize, borderBottom: BORDER }}>{`${print.currencyLabel} ${words}.`}</Box>
        </>
      )}

      {/* Payment information */}
      {bank && (
        <>
          <SectionTitle>Payment Information</SectionTitle>
          <Box sx={{ p: 0.5, fontSize, borderBottom: BORDER }}>
            <div><strong>Bank:</strong> {bank.bankName}</div>
            <div><strong>Account Title:</strong> {bank.accountTitle}</div>
            <div><strong>Account No:</strong> {bank.accountNumber}</div>
            {bank.iban && <div><strong>IBAN:</strong> {bank.iban}</div>}
            {bank.branchCode && <div><strong>Branch:</strong> {bank.branchCode}</div>}
          </Box>
        </>
      )}

      {/* The school's own instructions */}
      {print.voucherInstructions.length > 0 && (
        <Box sx={{ p: 0.5, fontSize: "0.66rem", fontWeight: 700, borderBottom: BORDER, flex: 1 }}>
          {print.voucherInstructions.map((line, index) => (
            <Box key={index} sx={{ mb: 0.5 }}>{`* ${line}`}</Box>
          ))}
        </Box>
      )}
      {print.voucherInstructions.length === 0 && <Box sx={{ flex: 1 }} />}

      {/* Footer */}
      <Box sx={{ bgcolor: "#000", color: "#fff", textAlign: "center", fontSize, p: 0.4 }}>{institution.name}</Box>
      <Box sx={{ bgcolor: GREY, fontSize: "0.66rem", p: 0.5, textAlign: "center" }}>
        {print.voucherContact || (printMeta.campus ? printMeta.campus.name : "")}
      </Box>
    </Box>
  );
}

/** One landscape page per voucher, with the student, school and bank copies side by side. */
export function FeeVoucherView({ item }: { item: PrintableVoucher }) {
  return (
    <PrintPage compact>
      <Typography className="no-print" variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
        {`${item.student.name} · ${item.voucher.voucherNumber}`}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, alignItems: "stretch" }}>
        {VOUCHER_COPIES.map((copy) => (
          <VoucherCopy key={copy} item={item} copy={copy} />
        ))}
      </Box>
    </PrintPage>
  );
}
