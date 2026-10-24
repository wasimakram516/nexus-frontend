import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import MyFeesManager from "./MyFeesManager";

const mocks = vi.hoisted(() => ({ get: vi.fn(), showMessage: vi.fn() }));
vi.mock("@/lib/axios", () => ({ default: { get: mocks.get } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

const ledger = (id: string, name: string, remaining: string, status = "OVERDUE") => ({
  student: { id, name, regNo: `R-${id}`, className: "Grade 1", sectionName: "A" },
  entries: [
    {
      voucherId: `v-${id}`,
      voucherNumber: `FV-202609-R-${id}`,
      month: 9,
      year: 2026,
      dueDate: "2026-09-10T00:00:00.000Z",
      status,
      charged: "5000.00",
      paid: String(5000 - Number(remaining)),
      remaining,
      runningBalance: remaining,
      payments: [],
    },
  ],
  totals: { charged: "5000.00", paid: String(5000 - Number(remaining)), outstanding: remaining, overdue: status === "OVERDUE" ? remaining : "0.00" },
});

const openVoucher = (id: string, name: string, remaining: string) => ({
  studentId: id,
  studentName: name,
  voucherId: `v-${id}`,
  voucherNumber: `FV-202609-R-${id}`,
  month: 9,
  year: 2026,
  dueDate: "2026-09-10T00:00:00.000Z",
  status: "OVERDUE",
  remaining,
});

const printMeta = {
  documentType: "FEE_VOUCHER",
  generatedAt: "2026-10-24T10:00:00.000Z",
  institution: { id: "i", name: "Greenfield School", logoUrl: null, branding: { primaryColorLight: null } },
  campus: null,
};

const family = {
  students: [ledger("a", "Ayesha", "3000.00")],
  totals: { charged: "5000.00", paid: "2000.00", outstanding: "3000.00", overdue: "3000.00" },
  openVouchers: [openVoucher("a", "Ayesha", "3000.00")],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockImplementation(async (url: string) => {
    if (url === "/finance/my-fees") return { data: { data: family } };
    return {
      data: {
        data: {
          printMeta,
          voucher: { id: "v-a", voucherNumber: "FV-202609-R-a", month: 9, year: 2026, issueDate: "2026-09-01T00:00:00.000Z", dueDate: "2026-09-10T00:00:00.000Z", status: "OVERDUE", lines: [{ label: "tuition", amount: "5000.00" }], totalFees: "5000.00", discountAmount: "0.00", fineAmount: "0.00", lateFeeFine: "0.00", finalAmountDue: "5000.00", totalPaid: "2000.00", remainingBalance: "3000.00" },
          student: { id: "a", name: "Ayesha", regNo: "R-a", className: "Grade 1", sectionName: "A" },
          bank: null,
          print: { currencyLabel: "Rs.", voucherInstructions: [], voucherContact: "" },
        },
      },
    };
  });
});

describe("MyFeesManager", () => {
  it("loads the signed-in person's own fees", async () => {
    render(<MyFeesManager />);

    expect(await screen.findByText("FV-202609-R-a")).toBeInTheDocument();
    expect(screen.getByText("To pay 3000.00")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/finance/my-fees");
  });

  it("prints a voucher through the route that checks it belongs to them", async () => {
    render(<MyFeesManager />);
    fireEvent.click(await screen.findByRole("button", { name: "Print voucher FV-202609-R-a" }));

    expect(await screen.findByText("Student Copy")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/finance/my-fees/vouchers/v-a/printable");
    expect(mocks.get).not.toHaveBeenCalledWith("/finance/fee-vouchers/v-a/printable");
  });

  it("shows an error when the fees cannot be loaded", async () => {
    mocks.get.mockRejectedValue({ response: { status: 500, data: { message: "No." } }, message: "x" });
    render(<MyFeesManager />);

    expect(await screen.findByText("Your fees could not be loaded.")).toBeInTheDocument();
  });
});
