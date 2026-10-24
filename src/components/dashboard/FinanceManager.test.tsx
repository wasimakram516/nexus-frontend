import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import FinanceManager from "./FinanceManager";
import { ModuleBase, useSectionCrumbLabel } from "@/lib/urlSection";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), showMessage: vi.fn(), pathname: "/dashboard/finance", push: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname, useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/axios", () => ({ default: { get: mocks.get, post: mocks.post } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/contexts/RuntimeConfigContext", () => ({ useOptionalRuntimeConfig: () => null }));
vi.mock("@/lib/users", () => ({ fetchAllUsers: async () => [
  { id: "staff", name: "A Teacher", role: "STAFF", institutionId: "institution" },
] }));

const breakdown = {
  baseSalary: 3000, perDayBasis: 30, dailyRate: 100, bonuses: 50, manualDeductions: 0,
  absenceDeduction: 200, lateDeduction: 0, halfDayDeduction: 0, leaveDeduction: 0,
  totalDeductions: 200, finalSalary: 2850,
};

/** Chooses an actual MUI select option through its accessible listbox. */
function choose(label: RegExp, option: string): void {
  fireEvent.mouseDown(screen.getByLabelText(label));
  fireEvent.click(screen.getByRole("option", { name: option }));
}

/** Opens the actual manager form after its API-backed setup data has loaded. */
async function openForm(section: string, button: RegExp): Promise<void> {
  render(<FinanceManager />);
  await waitFor(() => expect(mocks.get).toHaveBeenCalledWith("/finance/salaries", { params: undefined }));
  fireEvent.click(screen.getByRole("button", { name: new RegExp(section) }));
  fireEvent.click((await screen.findAllByRole("button", { name: button }))[0]);
  await screen.findByRole("dialog");
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.pathname = "/dashboard/finance";
  mocks.post.mockResolvedValue({ data: { data: { id: "saved" } } });
  mocks.get.mockImplementation(async (url: string) => {
    const data: Record<string, unknown> = {
      "/campuses": { items: [{ id: "campus", name: "Main Campus", institutionId: "institution" }] },
      "/finance/salaries": [{ id: "salary", userId: "staff", campusId: "campus", baseSalary: "3000" }],
      "/finance/salary-payments": [{ id: "payment", userId: "staff", campusId: "campus", month: 3, year: 2026, finalSalaryPaid: "2850.00", createdAt: "2026-03-31T12:00:00Z" }],
      "/finance/fee-vouchers": [{ id: "voucher", studentId: "student", month: 3, year: 2026, finalAmountDue: "1234.50", totalPaid: "234.50", remainingBalance: "1000.00", dueDate: "2026-03-31T12:00:00Z", createdAt: "2026-03-01T12:00:00Z" }],
      "/finance/salary-payments/preview": breakdown,
      "/custom-fields/form-definitions": [{ id: "note", fieldKey: "note", label: "Finance note", inputType: "TEXT", isRequired: false, defaultValue: "Reviewed" }],
    };
    return { data: { data: data[url] ?? [] } };
  });
});

function Crumb() {
  return <span data-testid="crumb">{useSectionCrumbLabel() ?? "none"}</span>;
}

describe("FinanceManager navigation", () => {
  it("opens a section into the breadcrumb and goes back to the hub", async () => {
    render(<><Crumb /><FinanceManager /></>);
    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith("/finance/salaries", { params: undefined }));

    fireEvent.click(await screen.findByRole("button", { name: /Fee Vouchers/ }));
    expect(screen.getByTestId("crumb")).toHaveTextContent("Fee Vouchers");

    fireEvent.click(screen.getByRole("button", { name: "All Finance" }));
    expect(screen.getByTestId("crumb")).toHaveTextContent("none");
  });

  it("opens the section named in the address and shows it in the breadcrumb", async () => {
    mocks.pathname = "/dashboard/finance/adjustments";
    render(<><Crumb /><ModuleBase path="/dashboard/finance"><FinanceManager /></ModuleBase></>);

    expect(await screen.findByRole("button", { name: "All Finance" })).toBeInTheDocument();
    expect(screen.getByTestId("crumb")).toHaveTextContent("Adjustments");
  });

  it("goes to a real address for a section, and back to the module for the hub", async () => {
    render(<ModuleBase path="/dashboard/finance"><FinanceManager /></ModuleBase>);

    fireEvent.click(await screen.findByRole("button", { name: /Fee Vouchers/ }));
    expect(mocks.push).toHaveBeenLastCalledWith("/dashboard/finance/fee-vouchers");
  });

  it("goes back to the module's own address from inside a section", async () => {
    mocks.pathname = "/dashboard/finance/fee-vouchers";
    render(<ModuleBase path="/dashboard/finance"><FinanceManager /></ModuleBase>);

    fireEvent.click(await screen.findByRole("button", { name: "All Finance" }));
    expect(mocks.push).toHaveBeenLastCalledWith("/dashboard/finance");
  });

  it("shows the hub for a section name it does not know", async () => {
    mocks.pathname = "/dashboard/finance/nonsense";
    render(<ModuleBase path="/dashboard/finance"><FinanceManager /></ModuleBase>);

    expect(await screen.findByRole("button", { name: /Fee Vouchers/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "All Finance" })).not.toBeInTheDocument();
  });
});

describe("FinanceManager contracts", () => {
  it("includes the required adjustment month and year in the submitted form", async () => {
    await openForm("Adjustments", /add salary adjustment/i);
    choose(/Staff Member/, "A Teacher (STAFF)");
    choose(/Salary Record/, "A Teacher — 3000");
    choose(/Campus \*/, "Main Campus");
    choose(/Type \*/, "Bonus");
    fireEvent.change(screen.getByLabelText(/Amount \*/), { target: { value: "50" } });
    fireEvent.change(await screen.findByLabelText("Finance note"), { target: { value: "Annual bonus" } });
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
    choose(/Month \*/, "March");
    fireEvent.change(screen.getByLabelText(/Year \*/), { target: { value: "2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/finance/salary-adjustments", {
      userId: "staff", salaryId: "salary", campusId: "campus", adjustmentType: "BONUS", amount: 50, month: "3", year: 2026, customFields: { note: "Annual bonus" },
    }));
  });

  it("renders the actual API amounts in salary and voucher tables", async () => {
    render(<FinanceManager />);
    fireEvent.click(screen.getByRole("button", { name: /Salary Payments/ }));
    expect(await screen.findByText("2850.00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "All Finance" }));
    fireEvent.click(screen.getByRole("button", { name: /Fee Vouchers/ }));
    expect(await screen.findByText("1234.50")).toBeInTheDocument();
    expect(screen.getByText("234.50")).toBeInTheDocument();
    expect(screen.getByText("1000.00")).toBeInTheDocument();
  });

  it("previews the selected period and pays only after confirmation", async () => {
    await openForm("Salary Payments", /add salary payment/i);
    choose(/Staff Member/, "A Teacher (STAFF)");
    choose(/Salary Record/, "A Teacher — 3000");
    choose(/Campus \*/, "Main Campus");
    choose(/Month \*/, "March");
    fireEvent.change(screen.getByLabelText(/Year \*/), { target: { value: "2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    const preview = await screen.findByRole("region", { name: "Salary payment preview" });
    expect(within(preview).getByText("2850")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/finance/salary-payments/preview", { params: {
      userId: "staff", salaryId: "salary", campusId: "campus", month: 3, year: 2026,
    } });
    expect(mocks.post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm payment" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/finance/salary-payments", {
      userId: "staff", salaryId: "salary", campusId: "campus", month: "3", year: 2026, customFields: { note: "Reviewed" },
    }));
  });
});
