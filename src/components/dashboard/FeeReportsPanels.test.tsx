import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DefaultersPanel, LedgerPanel } from "./FeeReportsPanels";

const mocks = vi.hoisted(() => ({ get: vi.fn(), showMessage: vi.fn() }));

vi.mock("@/lib/axios", () => ({ default: { get: mocks.get } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

const campuses = [{ id: "campus-1", name: "Main Campus" }];
const classes = [
  { id: "class-1", name: "Grade 1", campusId: "campus-1" },
  { id: "class-9", name: "Elsewhere", campusId: "campus-9" },
];

const defaulters = {
  defaulters: [
    {
      studentId: "s1",
      name: "Bilal",
      regNo: "R-2",
      className: "Grade 1",
      sectionName: "A",
      monthsOutstanding: 2,
      totalOutstanding: "12000.00",
      oldestDueDate: "2026-08-10T00:00:00.000Z",
      vouchers: [
        { voucherId: "a", month: 8, year: 2026, remaining: "6000.00" },
        { voucherId: "b", month: 9, year: 2026, remaining: "6000.00" },
      ],
    },
  ],
  totals: { students: 1, outstanding: "12000.00" },
};

const ledger = {
  student: { id: "s1", name: "Ayesha", regNo: "R-1", className: "Grade 1", sectionName: null },
  entries: [
    {
      voucherId: "v1",
      voucherNumber: "FV-202609-R-1",
      month: 9,
      year: 2026,
      dueDate: "2026-09-10T00:00:00.000Z",
      status: "OVERDUE",
      charged: "5000.00",
      paid: "2000.00",
      remaining: "3000.00",
      runningBalance: "3000.00",
      payments: [{ id: "p1", amount: "2000.00", method: "CASH", date: "2026-09-20T00:00:00.000Z" }],
    },
  ],
  totals: { charged: "5000.00", paid: "2000.00", outstanding: "3000.00", overdue: "3000.00" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockImplementation(async (url: string) =>
    url.includes("fee-defaulters") ? { data: { data: defaulters } } : { data: { data: ledger } },
  );
});

describe("DefaultersPanel", () => {
  it("loads the only campus's defaulters with their months and total", async () => {
    render(<DefaultersPanel campuses={campuses} classes={classes} />);

    expect(await screen.findByText("Bilal")).toBeInTheDocument();
    expect(screen.getByText("August 2026, September 2026")).toBeInTheDocument();
    expect(screen.getByText("Outstanding 12000.00")).toBeInTheDocument();
    expect(screen.getByText("Grade 1 (A)")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith(
      "/finance/fee-defaulters",
      expect.objectContaining({ params: expect.objectContaining({ campusId: "campus-1", minMonths: 1 }) }),
    );
  });

  it("asks for a campus first when there are several", () => {
    render(<DefaultersPanel campuses={[...campuses, { id: "campus-2", name: "Second" }]} classes={classes} />);

    expect(screen.getByText("Choose a campus to see who owes fees.")).toBeInTheDocument();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("reloads with the chosen class and minimum months, and rejects a bad value", async () => {
    render(<DefaultersPanel campuses={campuses} classes={classes} />);
    await screen.findByText("Bilal");

    fireEvent.mouseDown(screen.getByLabelText("Class"));
    expect(screen.queryByRole("option", { name: "Elsewhere" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Grade 1" }));
    await waitFor(() =>
      expect(mocks.get).toHaveBeenLastCalledWith(
        "/finance/fee-defaulters",
        expect.objectContaining({ params: expect.objectContaining({ classId: "class-1" }) }),
      ),
    );

    const calls = mocks.get.mock.calls.length;
    fireEvent.change(screen.getByLabelText("Months overdue at least"), { target: { value: "0" } });
    expect(screen.getByText("Enter 1 to 36.")).toBeInTheDocument();
    expect(mocks.get.mock.calls.length).toBe(calls);
  });

  it("says so when nobody owes anything", async () => {
    mocks.get.mockResolvedValue({ data: { data: { defaulters: [], totals: { students: 0, outstanding: "0.00" } } } });
    render(<DefaultersPanel campuses={campuses} classes={classes} />);

    expect(await screen.findByText("Nobody owes fees past a due date for this choice.")).toBeInTheDocument();
  });

  it("shows an error when the list cannot be loaded", async () => {
    mocks.get.mockRejectedValue({ response: { data: { message: "No." } }, message: "x" });
    render(<DefaultersPanel campuses={campuses} classes={classes} />);

    expect(await screen.findByText("The defaulters could not be loaded.")).toBeInTheDocument();
  });
});

describe("LedgerPanel", () => {
  const students = [
    { value: "s1", label: "Ayesha (R-1)" },
    { value: "s2", label: "Bilal (R-2)" },
  ];

  it("waits for a student, then shows the statement with totals and payments", async () => {
    render(<LedgerPanel students={students} />);
    expect(screen.getByText("Choose a student to see their statement.")).toBeInTheDocument();
    expect(mocks.get).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByLabelText("Student"));
    fireEvent.click(await screen.findByRole("option", { name: "Ayesha (R-1)" }));

    expect(await screen.findByText("FV-202609-R-1")).toBeInTheDocument();
    expect(screen.getByText("Charged 5000.00")).toBeInTheDocument();
    expect(screen.getByText("Overdue 3000.00")).toBeInTheDocument();
    expect(screen.getByText("OVERDUE")).toBeInTheDocument();
    expect(screen.getByText(/2000.00 on .* \(CASH\)/)).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/finance/fee-ledger/s1");
  });

  it("says so when the student has no vouchers", async () => {
    mocks.get.mockResolvedValue({
      data: { data: { ...ledger, entries: [], totals: { charged: "0.00", paid: "0.00", outstanding: "0.00", overdue: "0.00" } } },
    });
    render(<LedgerPanel students={students} />);
    fireEvent.mouseDown(screen.getByLabelText("Student"));
    fireEvent.click(await screen.findByRole("option", { name: "Bilal (R-2)" }));

    expect(await screen.findByText("No vouchers yet.")).toBeInTheDocument();
  });

  it("shows an error when the ledger cannot be loaded", async () => {
    mocks.get.mockRejectedValue({ response: { data: { message: "No." } }, message: "x" });
    render(<LedgerPanel students={students} />);
    fireEvent.mouseDown(screen.getByLabelText("Student"));
    fireEvent.click(await screen.findByRole("option", { name: "Ayesha (R-1)" }));

    expect(await screen.findByText("The ledger could not be loaded.")).toBeInTheDocument();
  });
});
