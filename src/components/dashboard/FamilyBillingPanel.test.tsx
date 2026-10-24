import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FamilyBillingPanel from "./FamilyBillingPanel";

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

const guardians = [
  { id: "g1", userId: "u1", campusId: "campus-1", relation: "FATHER" },
  { id: "g2", userId: "u2", campusId: "campus-9", relation: "MOTHER" },
];
const names = { u1: "Mr Khan", u2: "Mrs Elsewhere" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockImplementation(async (url: string) => {
    if (url.includes("family-billing")) {
      return {
        data: {
          data: {
            guardian: { id: "g1", name: "Mr Khan" },
            students: [ledger("a", "Ayesha", "3000.00"), ledger("b", "Bilal", "1000.00")],
            totals: { charged: "10000.00", paid: "6000.00", outstanding: "4000.00", overdue: "4000.00" },
            openVouchers: [openVoucher("a", "Ayesha", "3000.00"), openVoucher("b", "Bilal", "1000.00")],
          },
        },
      };
    }
    return { data: { data: guardians } };
  });
});

describe("FamilyBillingPanel", () => {
  it("waits for a guardian to be chosen", async () => {
    render(<FamilyBillingPanel nameByUserId={names} campusIds={null} />);

    expect(screen.getByText("Choose a guardian to see their family.")).toBeInTheDocument();
    await waitFor(() => expect(mocks.get).toHaveBeenCalled());
    expect(mocks.get).not.toHaveBeenCalledWith(expect.stringContaining("family-billing"));
  });

  it("shows the whole family's dues once a guardian is chosen", async () => {
    render(<FamilyBillingPanel nameByUserId={names} campusIds={null} />);

    fireEvent.mouseDown(screen.getByLabelText("Guardian"));
    fireEvent.click(await screen.findByRole("option", { name: "Mr Khan (father)" }));

    expect(await screen.findByText("To pay 4000.00")).toBeInTheDocument();
    expect(screen.getByText("Vouchers still to pay, all children")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/finance/family-billing/g1");
  });

  it("offers only guardians at the allowed campuses", async () => {
    render(<FamilyBillingPanel nameByUserId={names} campusIds={["campus-1"]} />);

    fireEvent.mouseDown(screen.getByLabelText("Guardian"));

    expect(await screen.findByRole("option", { name: "Mr Khan (father)" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Elsewhere/ })).not.toBeInTheDocument();
  });

  it("shows an error when the family cannot be loaded", async () => {
    mocks.get.mockImplementation(async (url: string) => {
      if (url.includes("family-billing")) throw { response: { status: 500, data: { message: "No." } }, message: "x" };
      return { data: { data: guardians } };
    });
    render(<FamilyBillingPanel nameByUserId={names} campusIds={null} />);

    fireEvent.mouseDown(screen.getByLabelText("Guardian"));
    fireEvent.click(await screen.findByRole("option", { name: "Mr Khan (father)" }));

    expect(await screen.findByText("The family's fees could not be loaded.")).toBeInTheDocument();
  });
});
