import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FamilyPaymentDialog, { lineProblem } from "./FamilyPaymentDialog";
import type { FamilyFees } from "./FamilyFeesView";

const mocks = vi.hoisted(() => ({ post: vi.fn(), showMessage: vi.fn() }));
vi.mock("@/lib/axios", () => ({ default: { post: mocks.post } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

const open = (id: string, name: string, remaining: string, month = 9) => ({
  studentId: id,
  studentName: name,
  voucherId: `v-${id}-${month}`,
  voucherNumber: `FV-2026${month}-R-${id}`,
  month,
  year: 2026,
  dueDate: "2026-09-10T00:00:00.000Z",
  status: "OVERDUE",
  remaining,
});

const family: FamilyFees = {
  students: [],
  totals: { charged: "0", paid: "0", outstanding: "4000.00", overdue: "4000.00" },
  openVouchers: [open("a", "Ayesha", "3000.00"), open("b", "Bilal", "1000.00")],
};

const result = (overrides: Record<string, unknown> = {}) => ({
  data: {
    data: {
      results: [
        { voucherId: "v-a-9", voucherNumber: "FV-20269-R-a", studentName: "Ayesha", amount: "3000.00", status: "RECORDED", message: null },
        { voucherId: "v-b-9", voucherNumber: "FV-20269-R-b", studentName: "Bilal", amount: "1000.00", status: "RECORDED", message: null },
      ],
      totals: { recorded: 2, failed: 0, totalRecorded: "4000.00" },
      ...overrides,
    },
  },
});

function renderDialog(onRecorded = vi.fn(), onClose = vi.fn(), data: FamilyFees = family) {
  render(<FamilyPaymentDialog open guardianId="g1" family={data} onClose={onClose} onRecorded={onRecorded} />);
  return { onRecorded, onClose };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.post.mockResolvedValue(result());
});

describe("lineProblem", () => {
  it.each([
    [{ checked: false, amount: "" }, "100", null],
    [{ checked: true, amount: "50" }, "100", null],
    [{ checked: true, amount: "100" }, "100", null],
    [{ checked: true, amount: "" }, "100", "Enter an amount above zero."],
    [{ checked: true, amount: "0" }, "100", "Enter an amount above zero."],
    [{ checked: true, amount: "-5" }, "100", "Enter an amount above zero."],
    [{ checked: true, amount: "1.234" }, "100", "At most two decimals."],
    [{ checked: true, amount: "150" }, "100", "More than the 100 owed."],
  ])("checks %j against %s owed", (line, remaining, problem) => {
    expect(lineProblem(line, remaining)).toBe(problem);
  });
});

describe("FamilyPaymentDialog", () => {
  it("starts with every unpaid voucher ticked at the amount owed, and records the total", async () => {
    renderDialog();

    expect(screen.getByLabelText("Amount for Ayesha September 2026")).toHaveValue(3000);
    expect(screen.getByRole("button", { name: "Record 4000.00" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Record 4000.00" }));

    expect(await screen.findByText("2 recorded")).toBeInTheDocument();
    expect(mocks.post).toHaveBeenCalledWith(
      "/finance/fee-payments/family",
      expect.objectContaining({
        guardianId: "g1",
        paymentMethod: "CASH",
        payments: [
          { voucherId: "v-a-9", paidAmount: 3000 },
          { voucherId: "v-b-9", paidAmount: 1000 },
        ],
      }),
    );
  });

  it("leaves out an unticked voucher and records a part payment as typed", async () => {
    renderDialog();

    fireEvent.click(screen.getByLabelText("Pay Bilal September 2026"));
    fireEvent.change(screen.getByLabelText("Amount for Ayesha September 2026"), { target: { value: "1200" } });
    expect(screen.getByText("Total 1200.00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Record 1200.00" }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith(
        "/finance/fee-payments/family",
        expect.objectContaining({ payments: [{ voucherId: "v-a-9", paidAmount: 1200 }] }),
      ),
    );
  });

  it("blocks recording while an amount is wrong or nothing is ticked", () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText("Amount for Ayesha September 2026"), { target: { value: "9999" } });
    expect(screen.getByText("More than the 3000.00 owed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Record/ })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Amount for Ayesha September 2026"), { target: { value: "3000" } });
    fireEvent.click(screen.getByLabelText("Pay Ayesha September 2026"));
    fireEvent.click(screen.getByLabelText("Pay Bilal September 2026"));
    expect(screen.getByRole("button", { name: /^Record/ })).toBeDisabled();
  });

  it("sends the chosen method and date", async () => {
    renderDialog();

    fireEvent.mouseDown(screen.getByLabelText("Method"));
    fireEvent.click(screen.getByRole("option", { name: "Bank transfer" }));
    fireEvent.change(screen.getByLabelText("Payment date"), { target: { value: "2026-10-20" } });
    fireEvent.click(screen.getByRole("button", { name: /^Record/ }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith(
        "/finance/fee-payments/family",
        expect.objectContaining({ paymentMethod: "BANK_TRANSFER", paymentDate: "2026-10-20" }),
      ),
    );
  });

  it("shows which vouchers were refused and why, and still reloads what was recorded", async () => {
    mocks.post.mockResolvedValue(
      result({
        results: [
          { voucherId: "v-a-9", voucherNumber: "FV-20269-R-a", studentName: "Ayesha", amount: "3000.00", status: "RECORDED", message: null },
          { voucherId: "v-b-9", voucherNumber: "FV-20269-R-b", studentName: "Bilal", amount: "1000.00", status: "FAILED", message: "Payment exceeds the outstanding voucher balance." },
        ],
        totals: { recorded: 1, failed: 1, totalRecorded: "3000.00" },
      }),
    );
    const { onRecorded } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /^Record/ }));

    expect(await screen.findByText("1 not recorded")).toBeInTheDocument();
    expect(screen.getByText("Payment exceeds the outstanding voucher balance.")).toBeInTheDocument();
    expect(onRecorded).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /^Record/ })).not.toBeInTheDocument();
  });

  it("reports a retried voucher as already recorded", async () => {
    mocks.post.mockResolvedValue(
      result({
        results: [{ voucherId: "v-a-9", voucherNumber: "FV-20269-R-a", studentName: "Ayesha", amount: "3000.00", status: "ALREADY_RECORDED", message: null }],
        totals: { recorded: 1, failed: 0, totalRecorded: "3000.00" },
      }),
    );
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /^Record/ }));

    expect(await screen.findByText("Already recorded")).toBeInTheDocument();
  });

  it("keeps one request key for the whole opening, so sending twice cannot pay twice", async () => {
    mocks.post.mockRejectedValueOnce({ response: { status: 500, data: { message: "No." } }, message: "x" });
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /^Record/ }));
    expect(await screen.findByText(/could not be recorded/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Record/ }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(2));

    const keys = mocks.post.mock.calls.map((call) => (call[1] as { requestKey: string }).requestKey);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
  });

  it("says so when the family owes nothing", () => {
    renderDialog(vi.fn(), vi.fn(), { ...family, openVouchers: [] });

    expect(screen.getByText("This family has nothing left to pay.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Record/ })).not.toBeInTheDocument();
  });
});
