import { PrintMeta } from "@/lib/examDocuments";

export interface PrintableVoucher {
  printMeta: PrintMeta;
  voucher: {
    id: string;
    voucherNumber: string;
    month: number;
    year: number;
    issueDate: string;
    dueDate: string;
    status: string;
    lines: Array<{ label: string; amount: string }>;
    /** Custom field values the institution chose to show on the printed voucher. */
    customValues: Array<{ label: string; value: string }>;
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
  /** The institution's wording for the printed voucher. */
  print: {
    currencyLabel: string;
    voucherInstructions: string[];
    voucherContact: string;
  };
}

export const VOUCHER_COPIES = ["Student Copy", "School Copy", "Bank Copy"] as const;

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
