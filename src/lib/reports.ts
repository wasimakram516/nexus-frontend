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
export type ReportFilter = "date" | "campus" | "period" | "month" | "section" | "exam" | "groupBy" | "threshold";

export interface ReportDefinition {
  key: string;
  label: string;
  group: "Overview" | "Attendance" | "Finance" | "Exams" | "Payroll";
  description: string;
  /** The address below /reports. */
  path: string;
  filters: ReportFilter[];
  /** Filters that must be chosen before the report can run. */
  required?: ReportFilter[];
  /** Shown instead of the report until every required filter is chosen. */
  prompt?: string;
}

/** The query field each required filter is sent as. */
export const REQUIRED_FIELD: Partial<Record<ReportFilter, string>> = { section: "sectionId", exam: "examId" };

/**
 * Whether a required filter has not been chosen yet.
 *
 * @param {ReportDefinition} definition - The report.
 * @param {Record<string, string>} values - What the person has chosen so far.
 * @returns {boolean} True while the report cannot run.
 */
export function isMissingRequired(definition: ReportDefinition, values: Record<string, string>): boolean {
  return (definition.required ?? []).some((filter) => {
    const field = REQUIRED_FIELD[filter];
    return field ? !values[field] : false;
  });
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
    prompt: "Choose a class and a section to see its register.",
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
  {
    key: "exam-subject-results",
    label: "Exam results by subject",
    group: "Exams",
    description: "How each paper of an exam went: who sat it, how many passed, the average and the highest and lowest marks.",
    path: "exams/subject-results",
    filters: ["exam"],
    required: ["exam"],
    prompt: "Choose an exam to see how each paper went.",
  },
  {
    key: "exam-grade-distribution",
    label: "Grade distribution",
    group: "Exams",
    description: "How many students earned each grade in an exam.",
    path: "exams/grade-distribution",
    filters: ["exam"],
    required: ["exam"],
    prompt: "Choose an exam to see its grades.",
  },
  {
    key: "exam-failed-students",
    label: "Students who did not pass",
    group: "Exams",
    description: "Students who failed an exam overall, with the papers they failed.",
    path: "exams/failed-students",
    filters: ["exam"],
    required: ["exam"],
    prompt: "Choose an exam to see who did not pass.",
  },
  {
    key: "payroll-register",
    label: "Payroll register",
    group: "Payroll",
    description: "A month's payroll: what each person was paid and how it was worked out, and who is still to be paid.",
    path: "payroll/register",
    filters: ["campus", "month"],
  },
  {
    key: "payroll-cost",
    label: "Payroll cost by month",
    group: "Payroll",
    description: "What payroll cost each month: staff paid, salaries, bonuses, deductions and the net total, by campus.",
    path: "payroll/cost",
    filters: ["campus", "period"],
  },
];

export const REPORT_GROUPS: ReportDefinition["group"][] = ["Overview", "Attendance", "Finance", "Exams", "Payroll"];

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
