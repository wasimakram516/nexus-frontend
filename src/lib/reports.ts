export type ReportCell = string | number | null;
export type ReportRow = Record<string, ReportCell>;

export interface ReportColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  weight?: number;
}

/** What every report returns: a table the screen, the CSV and the PDF all share. */
export interface ReportTable {
  key: string;
  title: string;
  subtitle: string | null;
  columns: ReportColumn[];
  rows: ReportRow[];
  totals: ReportRow | null;
  notes: string[];
  institutionId: string;
  campusId: string | null;
}

/** The inputs a report asks for. */
export type ReportFilter = "date" | "campus" | "period" | "month" | "section" | "groupBy" | "threshold";

export interface ReportDefinition {
  key: string;
  label: string;
  group: "Overview" | "Attendance" | "Finance";
  description: string;
  /** The address below /reports. */
  path: string;
  filters: ReportFilter[];
  /** Filters that must be chosen before the report can run. */
  required?: ReportFilter[];
}

export const REPORTS: ReportDefinition[] = [
  {
    key: "campus-comparison",
    label: "Campus comparison",
    group: "Overview",
    description: "Every campus side by side: students, attendance, fees collected and outstanding, and who is in default.",
    path: "campus-comparison",
    filters: ["date"],
  },
  {
    key: "attendance-register",
    label: "Monthly attendance register",
    group: "Attendance",
    description: "A section's register for a month, a column for each day.",
    path: "attendance/monthly-register",
    filters: ["section", "month"],
    required: ["section"],
  },
  {
    key: "staff-attendance",
    label: "Staff attendance summary",
    group: "Attendance",
    description: "How each member of staff attended over a period.",
    path: "attendance/staff-summary",
    filters: ["campus", "period"],
  },
  {
    key: "chronic-absentees",
    label: "Chronic absentees",
    group: "Attendance",
    description: "Students who are absent on a large share of the days they were marked.",
    path: "attendance/chronic-absentees",
    filters: ["campus", "period", "threshold"],
  },
  {
    key: "fee-collection",
    label: "Fee collection",
    group: "Finance",
    description: "Fees received in a period, by day, month or campus.",
    path: "finance/collection",
    filters: ["campus", "period", "groupBy"],
  },
  {
    key: "outstanding-dues",
    label: "Outstanding dues",
    group: "Finance",
    description: "Students with fees past their due date, and how much each owes.",
    path: "finance/outstanding-dues",
    filters: ["campus"],
  },
  {
    key: "discounts-and-fines",
    label: "Discounts and fines",
    group: "Finance",
    description: "Discounts, attendance fines and late fees applied, by month and campus.",
    path: "finance/discounts-and-fines",
    filters: ["campus", "period"],
  },
];

export const REPORT_GROUPS: ReportDefinition["group"][] = ["Overview", "Attendance", "Finance"];

/** The figures shown as cards above the comparison table. */
export interface KpiCard {
  label: string;
  value: string;
  hint: string | null;
}

/**
 * Headline figures taken from the comparison's total row (or its only campus).
 *
 * @param {ReportTable} table - The campus comparison.
 * @returns {KpiCard[]} Cards in display order; none when there is nothing to show.
 */
export function comparisonCards(table: ReportTable): KpiCard[] {
  const row = table.totals ?? table.rows[0];
  if (!row) return [];
  return [
    { label: "Students", value: String(row.students ?? 0), hint: null },
    { label: "Attendance", value: `${row.attendance ?? 0}%`, hint: `${row.present ?? 0} present, ${row.absent ?? 0} absent` },
    { label: "Collected this month", value: String(row.collected ?? "0.00"), hint: `${row.collection ?? 0}% of ${row.billed ?? "0.00"} billed` },
    { label: "Outstanding", value: String(row.outstanding ?? "0.00"), hint: "All months" },
    { label: "Defaulters", value: String(row.defaulters ?? 0), hint: "Fees past due" },
  ];
}
