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
});

function renderDialog(target: VoucherPrintTarget | null) {
  render(<FeeVoucherPrintDialog target={target} campuses={campuses} classes={classes} onClose={vi.fn()} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockImplementation(async (url: string) => {
    if (url.endsWith("/printable") && url.includes("/fee-vouchers/v-")) return { data: { data: voucher("Ayesha") } };
    return { data: { data: [voucher("Ayesha"), voucher("Bilal")] } };
  });
});

describe("FeeVoucherPrintDialog", () => {
  it("renders nothing without a target", () => {
    renderDialog(null);

    expect(screen.queryByRole("button", { name: /Print/ })).not.toBeInTheDocument();
  });

  it("loads one voucher and shows the bank, school and parent copies", async () => {
    renderDialog({ kind: "single", voucherId: "v-Ayesha" });

    expect((await screen.findAllByText("Bank copy")).length).toBe(1);
    expect(screen.getByText("School copy")).toBeInTheDocument();
    expect(screen.getByText("Parent copy")).toBeInTheDocument();
    expect(screen.getAllByText("5350.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pay to School Fees, HBL, account 123456, IBAN PK00HBL/).length).toBe(3);
    expect(mocks.get).toHaveBeenCalledWith("/finance/fee-vouchers/v-Ayesha/printable");
  });

  it("shows discounts and fines only when there are some, and the balance only after a payment", async () => {
    mocks.get.mockResolvedValue({
      data: { data: voucher("Ayesha", { discountAmount: "0.00", fineAmount: "0.00", totalPaid: "1000.00", remainingBalance: "4350.00" }) },
    });
    renderDialog({ kind: "single", voucherId: "v-Ayesha" });

    await screen.findByText("School copy");
    expect(screen.queryByText("Discounts")).not.toBeInTheDocument();
    expect(screen.queryByText("Attendance fine")).not.toBeInTheDocument();
    expect(screen.getAllByText("Remaining balance").length).toBe(3);
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

    expect(await screen.findAllByText("Parent copy")).toHaveLength(2);
    expect(mocks.get).toHaveBeenCalledWith(
      "/finance/fee-vouchers/printable",
      expect.objectContaining({ params: expect.objectContaining({ campusId: "campus-1", year: new Date().getFullYear() }) }),
    );
  });

  it("offers only this campus's classes and reloads with the chosen class", async () => {
    renderDialog({ kind: "batch" });
    await screen.findAllByText("Parent copy");

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
