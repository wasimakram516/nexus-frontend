import { PrintMeta } from "@/lib/examDocuments";

export interface PrintableVoucher {
  printMeta: PrintMeta;
  voucher: {
    id: string;
    voucherNumber: string;
    month: number;
    year: number;
    dueDate: string;
    status: string;
    lines: Array<{ label: string; amount: string }>;
    totalFees: string;
    discountAmount: string;
    fineAmount: string;
    lateFeeFine: string;
    finalAmountDue: string;
    totalPaid: string;
    remainingBalance: string;
  };
  student: {
    id: string;
    name: string;
    regNo: string;
    className: string | null;
    sectionName: string | null;
  };
  bank: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string | null;
    branchCode: string | null;
  } | null;
}

export const VOUCHER_COPIES = ["Bank copy", "School copy", "Parent copy"] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "September 2026" for a voucher's billing period. */
export function voucherPeriod(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1] ?? month} ${year}`;
}

/** True when the amount, a decimal string from the API, is above zero. */
export function isPositive(amount: string): boolean {
  return Number(amount) > 0;
}
