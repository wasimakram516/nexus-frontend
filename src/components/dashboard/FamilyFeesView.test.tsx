import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import FamilyFeesView, { type FamilyFees } from "./FamilyFeesView";

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

const two: FamilyFees = {
  students: [ledger("a", "Ayesha", "3000.00"), ledger("b", "Bilal", "1000.00")],
  totals: { charged: "10000.00", paid: "6000.00", outstanding: "4000.00", overdue: "4000.00" },
  openVouchers: [openVoucher("a", "Ayesha", "3000.00"), openVoucher("b", "Bilal", "1000.00")],
};

describe("FamilyFeesView", () => {
  it("says so when no students are linked", () => {
    render(<FamilyFeesView family={{ students: [], totals: two.totals, openVouchers: [] }} />);

    expect(screen.getByText(/no students linked to this account/)).toBeInTheDocument();
  });

  it("shows the combined totals and one list of unpaid vouchers across the children", () => {
    render(<FamilyFeesView family={two} />);

    expect(screen.getByText("To pay 4000.00")).toBeInTheDocument();
    expect(screen.getByText("Overdue 4000.00")).toBeInTheDocument();
    expect(screen.getByText("Vouchers still to pay, all children")).toBeInTheDocument();
    expect(screen.getAllByText("Ayesha").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3000.00").length).toBeGreaterThan(0);
  });

  it("gives each child an expandable statement", () => {
    render(<FamilyFeesView family={two} />);

    expect(screen.getByRole("button", { name: /Ayesha/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bilal/ })).toBeInTheDocument();
    expect(screen.getByText("To pay 1000.00")).toBeInTheDocument();
  });

  it("prints from either the combined list or a child's statement", () => {
    const onPrint = vi.fn();
    render(<FamilyFeesView family={two} onPrintVoucher={onPrint} />);

    fireEvent.click(screen.getByRole("button", { name: "Print voucher FV-202609-R-a for Ayesha" }));

    expect(onPrint).toHaveBeenCalledWith("v-a");
  });

  it("shows a single child's statement directly, without the combined list", () => {
    render(
      <FamilyFeesView
        family={{ students: [ledger("a", "Ayesha", "3000.00")], totals: { charged: "5000.00", paid: "2000.00", outstanding: "3000.00", overdue: "3000.00" }, openVouchers: [openVoucher("a", "Ayesha", "3000.00")] }}
      />,
    );

    expect(screen.queryByText("Vouchers still to pay, all children")).not.toBeInTheDocument();
    expect(screen.getByText("FV-202609-R-a")).toBeInTheDocument();
  });

  it("congratulates a family that owes nothing", () => {
    render(
      <FamilyFeesView
        family={{ students: [ledger("a", "Ayesha", "0.00", "PAID")], totals: { charged: "5000.00", paid: "5000.00", outstanding: "0.00", overdue: "0.00" }, openVouchers: [] }}
      />,
    );

    expect(screen.getByText("Nothing is due. All vouchers are paid.")).toBeInTheDocument();
  });
});
