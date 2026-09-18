import { describe, expect, it } from "vitest";
import { payrollSelection } from "./finance.types";

describe("payrollSelection", () => {
  const selection = { userId: "staff", salaryId: "salary", campusId: "campus", month: "3", year: 2026 };
  it("converts the select value to the backend preview query type", () => {
    expect(payrollSelection(selection)).toEqual({ ...selection, month: 3 });
  });
  it.each([{ month: "13" }, { month: "" }, { year: 1999 }, { year: 2026.5 }, { salaryId: "" }])("rejects invalid selection %j", (invalid) => {
    expect(() => payrollSelection({ ...selection, ...invalid })).toThrow("valid payroll month/year");
  });
});
