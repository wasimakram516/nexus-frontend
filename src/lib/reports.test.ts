import { describe, expect, it } from "vitest";
import { comparisonCards, REPORTS, REPORT_GROUPS, type ReportTable } from "./reports";

const table = (overrides: Partial<ReportTable> = {}): ReportTable => ({
  key: "campus-comparison",
  title: "Campus comparison",
  subtitle: null,
  columns: [],
  rows: [{ students: 40, attendance: 90, present: 36, absent: 4, billed: "1000.00", collected: "600.00", collection: 60, outstanding: "300.00", defaulters: 2 }],
  totals: null,
  notes: [],
  institutionId: "i",
  campusId: null,
  ...overrides,
});

describe("reports registry", () => {
  it("has unique keys and paths, every report in a known group", () => {
    expect(new Set(REPORTS.map((report) => report.key)).size).toBe(REPORTS.length);
    expect(new Set(REPORTS.map((report) => report.path)).size).toBe(REPORTS.length);
    for (const report of REPORTS) expect(REPORT_GROUPS).toContain(report.group);
  });

  it("asks only for filters the report takes, and every required one is among them", () => {
    for (const report of REPORTS) {
      for (const needed of report.required ?? []) expect(report.filters).toContain(needed);
    }
  });
});

describe("comparisonCards", () => {
  it("takes the headline figures from the total row when there is one", () => {
    const cards = comparisonCards(table({ totals: { students: 150, attendance: 85.7, present: 120, absent: 20, billed: "15000.00", collected: "8500.00", collection: 56.7, outstanding: "3500.00", defaulters: 7 } }));

    expect(cards.map((card) => [card.label, card.value])).toEqual([
      ["Students", "150"],
      ["Attendance", "85.7%"],
      ["Collected this month", "8500.00"],
      ["Outstanding", "3500.00"],
      ["Defaulters", "7"],
    ]);
    expect(cards[1].hint).toBe("120 present, 20 absent");
    expect(cards[2].hint).toBe("56.7% of 15000.00 billed");
  });

  it("uses the only campus when there is no total row", () => {
    expect(comparisonCards(table())[0].value).toBe("40");
  });

  it("has no cards for an empty comparison", () => {
    expect(comparisonCards(table({ rows: [] }))).toEqual([]);
  });
});
