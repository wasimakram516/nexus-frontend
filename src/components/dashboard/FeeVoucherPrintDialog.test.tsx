import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FeeVoucherPrintDialog, { VoucherPrintTarget } from "./FeeVoucherPrintDialog";

const mocks = vi.hoisted(() => ({ get: vi.fn(), showMessage: vi.fn() }));

vi.mock("@/lib/axios", () => ({ default: { get: mocks.get } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

const printMeta = {
  documentType: "FEE_VOUCHER",
  generatedAt: "2026-10-24T10:00:00.000Z",
  institution: { id: "i", name: "Greenfield School", logoUrl: null, branding: { primaryColorLight: null } },
  campus: { id: "campus-1", name: "Main Campus" },
};
const campuses = [{ id: "campus-1", name: "Main Campus" }];
const classes = [
  { id: "class-1", name: "Grade 1", campusId: "campus-1" },
  { id: "class-9", name: "Elsewhere", campusId: "campus-9" },
];

const voucher = (name: string, overrides: Record<string, unknown> = {}) => ({
  printMeta,
  voucher: {
    id: `v-${name}`,
    voucherNumber: `FV-202609-R-${name}`,
    month: 9,
    year: 2026,
    issueDate: "2026-09-01T00:00:00.000Z",
    dueDate: "2026-09-10T00:00:00.000Z",
    status: "PENDING",
    lines: [
      { label: "tuition", amount: "5000.00" },
      { label: "transport", amount: "1000.00" },
    ],
    totalFees: "6000.00",
    discountAmount: "800.00",
    fineAmount: "150.00",
    lateFeeFine: "0.00",
    finalAmountDue: "5350.00",
    totalPaid: "0.00",
    remainingBalance: "5350.00",
    ...overrides,
  },
  student: { id: name, name, regNo: `R-${name}`, className: "Grade 1", sectionName: "A" },
  bank: { bankName: "HBL", accountTitle: "School Fees", accountNumber: "123456", iban: "PK00HBL", branchCode: null },
  print: {
    currencyLabel: "Rs.",
    voucherInstructions: ["Pay before the due date.", "Keep the bank receipt."],
    voucherContact: "info@school.test",
  },
});

function renderDialog(target: VoucherPrintTarget | null) {
  render(<FeeVoucherPrintDialog target={target} campuses={campuses} classes={classes} onClose={vi.fn()} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockImplementation(async (url: string) => {
    if (url.endsWith("/printable") && (url.includes("/fee-vouchers/v-") || url.includes("/my-fees/vouchers/"))) return { data: { data: voucher("Ayesha") } };
    return { data: { data: [voucher("Ayesha"), voucher("Bilal")] } };
  });
});

describe("FeeVoucherPrintDialog", () => {
  it("renders nothing without a target", () => {
    renderDialog(null);

    expect(screen.queryByRole("button", { name: /Print/ })).not.toBeInTheDocument();
  });

  it("loads one voucher as student, school and bank copies side by side", async () => {
    renderDialog({ kind: "single", voucherId: "v-Ayesha" });

    expect(await screen.findByText("Student Copy")).toBeInTheDocument();
    expect(screen.getByText("School Copy")).toBeInTheDocument();
    expect(screen.getByText("Bank Copy")).toBeInTheDocument();
    expect(screen.getAllByText("FV-202609-R-Ayesha")).toHaveLength(3);
    expect(screen.getAllByText("Payable within due date")).toHaveLength(3);
    expect(screen.getAllByText("Rs. Five Thousand, Three Hundred And Fifty.")).toHaveLength(3);
    expect(screen.getAllByText("HBL")).toHaveLength(3);
    expect(screen.getAllByText("PK00HBL")).toHaveLength(3);
    expect(screen.getAllByText("* Pay before the due date.")).toHaveLength(3);
    expect(screen.getAllByText("info@school.test")).toHaveLength(3);
    expect(screen.getAllByText("Greenfield School")).toHaveLength(3);
    expect(mocks.get).toHaveBeenCalledWith("/finance/fee-vouchers/v-Ayesha/printable");
  });

  it("loads an own voucher through the route that checks ownership", async () => {
    renderDialog({ kind: "single", voucherId: "v-Ayesha", own: true });

    expect(await screen.findByText("Student Copy")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/finance/my-fees/vouchers/v-Ayesha/printable");
  });

  it("uses the institution's currency label and the standard notes when it has set no instructions", async () => {
    const plain = voucher("Ayesha");
    mocks.get.mockResolvedValue({
      data: { data: { ...plain, print: { currencyLabel: "SAR", voucherInstructions: [], voucherContact: "" } } },
    });
    renderDialog({ kind: "single", voucherId: "v-Ayesha" });

    expect(await screen.findAllByText("SAR Five Thousand, Three Hundred And Fifty.")).toHaveLength(3);
    // With no instructions of its own, each copy carries the standard notes.
    expect(screen.getAllByText("* Please pay your fee on or before the due date.")).toHaveLength(3);
    expect(screen.getAllByText("* A fine will be charged on payments made after the due date.")).toHaveLength(3);
    expect(screen.queryByText("* Pay before the due date.")).not.toBeInTheDocument();
  });

  it("shows discounts and fines only when there are some, and the balance only after a payment", async () => {
    mocks.get.mockResolvedValue({
      data: { data: voucher("Ayesha", { discountAmount: "0.00", fineAmount: "0.00", totalPaid: "1000.00", remainingBalance: "4350.00" }) },
    });
    renderDialog({ kind: "single", voucherId: "v-Ayesha" });

    await screen.findByText("School Copy");
    expect(screen.queryByText("Discounts")).not.toBeInTheDocument();
    expect(screen.queryByText("Attendance fine")).not.toBeInTheDocument();
    expect(screen.getAllByText("Remaining balance")).toHaveLength(3);
  });

  it("asks for a campus first in batch mode when there are several", async () => {
    render(
      <FeeVoucherPrintDialog
        target={{ kind: "batch" }}
        campuses={[...campuses, { id: "campus-2", name: "Second" }]}
        classes={classes}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText("Choose a campus to preview the vouchers.")).toBeInTheDocument();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("loads a month for the only campus and prints one page per voucher", async () => {
    renderDialog({ kind: "batch" });

    expect(await screen.findAllByText("Bank Copy")).toHaveLength(2);
    expect(mocks.get).toHaveBeenCalledWith(
      "/finance/fee-vouchers/printable",
      expect.objectContaining({ params: expect.objectContaining({ campusId: "campus-1", year: new Date().getFullYear() }) }),
    );
  });

  it("offers only this campus's classes and reloads with the chosen class", async () => {
    renderDialog({ kind: "batch" });
    await screen.findAllByText("Bank Copy");

    fireEvent.mouseDown(screen.getByLabelText("Class"));
    expect(screen.queryByRole("option", { name: "Elsewhere" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Grade 1" }));

    await waitFor(() =>
      expect(mocks.get).toHaveBeenLastCalledWith(
        "/finance/fee-vouchers/printable",
        expect.objectContaining({ params: expect.objectContaining({ classId: "class-1" }) }),
      ),
    );
  });

  it("says so when a batch has no vouchers", async () => {
    mocks.get.mockResolvedValue({ data: { data: [] } });
    renderDialog({ kind: "batch" });

    expect(await screen.findByText("There are no vouchers for this choice.")).toBeInTheDocument();
  });

  it("shows an error when the vouchers cannot be loaded", async () => {
    mocks.get.mockRejectedValue({ response: { data: { message: "No." } }, message: "x" });
    renderDialog({ kind: "single", voucherId: "v-Ayesha" });

    expect(await screen.findByRole("alert")).toHaveTextContent("The vouchers could not be loaded.");
  });
});
