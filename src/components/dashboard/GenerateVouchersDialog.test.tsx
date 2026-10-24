import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import GenerateVouchersDialog from "./GenerateVouchersDialog";

const mocks = vi.hoisted(() => ({ post: vi.fn(), showMessage: vi.fn() }));

vi.mock("@/lib/axios", () => ({ default: { post: mocks.post } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

const campuses = [{ id: "campus-1", name: "Main Campus" }];
const classes = [
  { id: "class-1", name: "Grade 1", campusId: "campus-1" },
  { id: "class-9", name: "Elsewhere", campusId: "campus-9" },
];
const banks = [
  { id: "bank-1", campusId: "campus-1", bankName: "HBL", accountTitle: "School Fees" },
  { id: "bank-9", campusId: "campus-9", bankName: "UBL", accountTitle: "Other" },
];

const result = (preview: boolean, overrides: Record<string, unknown> = {}) => ({
  data: {
    data: {
      preview,
      generated: [{ studentId: "s1", name: "Ayesha", regNo: "R-1", amount: "5350.00", voucherId: null }],
      skipped: [{ studentId: "s2", name: "Bilal", regNo: "R-2", reason: "A voucher already exists for this month." }],
      failed: [{ studentId: "s3", name: "Omar", regNo: "R-3", reason: "No fee structure is set for this student's class." }],
      totals: { generated: 1, skipped: 1, failed: 1, totalAmount: "5350.00" },
      ...overrides,
    },
  },
});

function renderDialog(onGenerated = vi.fn(), onClose = vi.fn()) {
  render(
    <GenerateVouchersDialog
      open
      campuses={campuses}
      classes={classes}
      bankAccounts={banks}
      onClose={onClose}
      onGenerated={onGenerated}
    />,
  );
  return { onGenerated, onClose };
}

const preview = () => fireEvent.click(screen.getByRole("button", { name: "Preview" }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.post.mockImplementation(async (_url: string, body: { preview: boolean }) => result(body.preview));
});

describe("GenerateVouchersDialog", () => {
  it("starts on the only campus and cannot generate before a preview", () => {
    renderDialog();

    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Preview" })).toBeEnabled();
  });

  it("previews with the chosen month and year, and shows what would be created", async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: "2026" } });
    preview();

    expect(await screen.findByText("1 would be created")).toBeInTheDocument();
    expect(screen.getByText("Total 5350.00")).toBeInTheDocument();
    expect(screen.getByText(/Preview only, nothing has been created yet/)).toBeInTheDocument();
    expect(mocks.post).toHaveBeenCalledWith(
      "/finance/fee-vouchers/bulk-generate",
      expect.objectContaining({ campusId: "campus-1", year: 2026, preview: true }),
    );
  });

  it("lists who is skipped and who needs attention, with the reason", async () => {
    renderDialog();
    preview();

    expect(await screen.findByText("Bilal")).toBeInTheDocument();
    expect(screen.getByText("A voucher already exists for this month.")).toBeInTheDocument();
    expect(screen.getByText("Omar")).toBeInTheDocument();
    expect(screen.getByText("No fee structure is set for this student's class.")).toBeInTheDocument();
    expect(screen.getByText("1 need attention")).toBeInTheDocument();
  });

  it("generates only after a preview, then shows the report and reloads the list", async () => {
    const { onGenerated } = renderDialog();
    preview();
    fireEvent.click(await screen.findByRole("button", { name: "Generate 1 vouchers" }));

    expect(await screen.findByText("1 created")).toBeInTheDocument();
    expect(mocks.post).toHaveBeenLastCalledWith(
      "/finance/fee-vouchers/bulk-generate",
      expect.objectContaining({ preview: false }),
    );
    expect(onGenerated).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preview" })).not.toBeInTheDocument();
  });

  it("cannot generate when the preview shows nothing to create", async () => {
    mocks.post.mockResolvedValue(
      result(true, {
        generated: [],
        totals: { generated: 0, skipped: 1, failed: 0, totalAmount: "0.00" },
      }),
    );
    renderDialog();
    preview();

    await screen.findByText("0 would be created");
    expect(screen.getByRole("button", { name: "Generate 0 vouchers" })).toBeDisabled();
  });

  it("invalidates the preview when anything changes", async () => {
    renderDialog();
    preview();
    await screen.findByText("1 would be created");

    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: "2027" } });

    expect(screen.queryByText("1 would be created")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
  });

  it("offers only this campus's classes and banks, and sends the choices", async () => {
    renderDialog();

    fireEvent.mouseDown(screen.getByLabelText("Class"));
    expect(screen.queryByRole("option", { name: "Elsewhere" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Grade 1" }));
    fireEvent.mouseDown(screen.getByLabelText("Bank account"));
    expect(screen.queryByRole("option", { name: /UBL/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "HBL · School Fees" }));
    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-09-15" } });
    preview();

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith(
        "/finance/fee-vouchers/bulk-generate",
        expect.objectContaining({ classId: "class-1", bankId: "bank-1", dueDate: "2026-09-15" }),
      ),
    );
  });

  it("sends one-time charges, and blocks a charge with no label or a bad amount", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Add charge" }));
    // A completely blank row is ignored, so it is not an error.
    expect(screen.getByRole("button", { name: "Preview" })).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Charge label 1"), { target: { value: " Admission fee " } });
    expect(screen.getByRole("alert")).toHaveTextContent(/needs a label and an amount above zero/);
    expect(screen.getByRole("button", { name: "Preview" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Charge amount 1"), { target: { value: "2000" } });
    expect(screen.getByRole("button", { name: "Preview" })).toBeEnabled();
    preview();

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith(
        "/finance/fee-vouchers/bulk-generate",
        expect.objectContaining({ oneTimeCharges: [{ label: "Admission fee", amount: 2000 }] }),
      ),
    );
  });

  it("rejects a charge amount with more than two decimals and lets a charge be removed", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Add charge" }));
    fireEvent.change(screen.getByLabelText("Charge label 1"), { target: { value: "Fee" } });
    fireEvent.change(screen.getByLabelText("Charge amount 1"), { target: { value: "10.555" } });
    expect(screen.getByRole("button", { name: "Preview" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Remove charge 1" }));
    expect(screen.queryByLabelText("Charge label 1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeEnabled();
  });

  it("shows an error and creates nothing when the server refuses", async () => {
    mocks.post.mockRejectedValue({ response: { data: { message: "Set the current academic year before generating vouchers." } }, message: "x" });
    renderDialog();
    preview();

    expect(await screen.findByText(/could not be generated/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
  });
});
