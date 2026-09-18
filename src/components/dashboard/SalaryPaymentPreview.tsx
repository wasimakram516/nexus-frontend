import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { PayrollBreakdown } from "@/services/finance.types";

const BREAKDOWN_LABELS: ReadonlyArray<[keyof PayrollBreakdown, string]> = [
  ["baseSalary", "Base salary"], ["perDayBasis", "Daily salary divisor"],
  ["dailyRate", "Daily rate"], ["bonuses", "Bonuses"],
  ["manualDeductions", "Manual deductions"], ["absenceDeduction", "Absence deductions"],
  ["lateDeduction", "Late deductions"], ["halfDayDeduction", "Half-day deductions"],
  ["leaveDeduction", "Leave deductions"], ["totalDeductions", "Total deductions"],
  ["finalSalary", "Net salary"],
];

/** Shows the server-calculated breakdown before the accountant confirms payment. */
export default function SalaryPaymentPreview({ breakdown }: { breakdown: PayrollBreakdown }): React.JSX.Element {
  return <Box component="section" aria-label="Salary payment preview">
    <Typography variant="subtitle1">Review salary payment</Typography>
    <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
      {BREAKDOWN_LABELS.map(([key, label]) => <Box key={key} sx={{ display: "contents" }}>
        <Typography component="dt">{label}</Typography>
        <Typography component="dd" sx={{ m: 0, fontWeight: key === "finalSalary" ? 700 : 400 }}>{breakdown[key]}</Typography>
      </Box>)}
    </Box>
    <Typography variant="body2" color="text.secondary">Payment is calculated again when confirmed using the latest attendance and adjustments.</Typography>
  </Box>;
}
