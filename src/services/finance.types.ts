/** PostgreSQL decimal fields are serialized as strings by the API. */
export type MoneyValue = string | number;

export interface SalaryPaymentRecord extends Record<string, unknown> {
  id: string;
  finalSalaryPaid: MoneyValue;
}

export interface FeeVoucherRecord extends Record<string, unknown> {
  id: string;
  finalAmountDue: MoneyValue;
  totalPaid?: MoneyValue;
  remainingBalance?: MoneyValue;
  overpaymentAmount?: MoneyValue;
}

export interface PayrollSelection {
  userId: string;
  salaryId: string;
  campusId: string;
  month: number;
  year: number;
}

export interface PayrollBreakdown {
  baseSalary: number;
  perDayBasis: number;
  dailyRate: number;
  bonuses: number;
  manualDeductions: number;
  absenceDeduction: number;
  lateDeduction: number;
  halfDayDeduction: number;
  leaveDeduction: number;
  totalDeductions: number;
  finalSalary: number;
}

/** Validates the existing payroll selection contract before requesting a preview. */
export function payrollSelection(payload: Record<string, unknown>): PayrollSelection {
  const { userId, salaryId, campusId } = payload;
  const month = typeof payload.month === "string" ? Number(payload.month) : payload.month;
  const year = typeof payload.year === "string" ? Number(payload.year) : payload.year;
  if (typeof userId !== "string" || !userId || typeof salaryId !== "string" || !salaryId ||
    typeof campusId !== "string" || !campusId || typeof month !== "number" ||
    !Number.isInteger(month) || month < 1 || month > 12 || typeof year !== "number" ||
    !Number.isInteger(year) || year < 2000) {
    throw new Error("Select a staff member, salary, campus and valid payroll month/year.");
  }
  return { userId, salaryId, campusId, month, year };
}
