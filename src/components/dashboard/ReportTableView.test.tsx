import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import ReportTableView from "./ReportTableView";
import type { ReportTable } from "@/lib/reports";

const table = (overrides: Partial<ReportTable> = {}): ReportTable => ({
  key: "fee-collection",
  title: "Fee collection",
  subtitle: "1 Oct 2026 to 31 Oct 2026, Main, by day",
  columns: [
    { key: "group", label: "Date" },
    { key: "total", label: "Total", align: "right" },
  ],
  rows: [{ group: "12 Oct 2026", total: "600.00" }, { group: "20 Oct 2026", total: "500.00" }],
  totals: { group: "Total", total: "1100.00" },
  notes: ["Amounts are in PKR"],
  institutionId: "inst-1",
  campusId: "c1",
  ...overrides,
});

describe("ReportTableView", () => {
  it("shows the title, what it covers, the notes, the rows and the totals", () => {
    render(<ReportTableView table={table()} />);

    expect(screen.getByRole("heading", { name: "Fee collection" })).toBeInTheDocument();
    expect(screen.getByText("1 Oct 2026 to 31 Oct 2026, Main, by day")).toBeInTheDocument();
    expect(screen.getByText("Amounts are in PKR")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Total" })).toBeInTheDocument();
    expect(screen.getByText("12 Oct 2026")).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(within(rows[rows.length - 1]).getByText("1100.00")).toBeInTheDocument();
  });

  it("says so when there is nothing to report, and leaves out an absent total row", () => {
    render(<ReportTableView table={table({ rows: [], totals: null, notes: [], subtitle: null })} />);

    expect(screen.getByText("There is nothing to report for this selection.")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("leaves a missing value blank instead of writing null", () => {
    render(<ReportTableView table={table({ rows: [{ group: "x", total: null }], totals: null })} />);

    expect(screen.queryByText("null")).not.toBeInTheDocument();
  });
});
