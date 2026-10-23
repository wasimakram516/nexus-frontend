import { describe, expect, it } from "vitest";
import { isDirty, MarksRow, summarize, toEntries, toRows, validateRow } from "./marksEntry";

const row = (overrides: Partial<MarksRow> = {}): MarksRow => ({
  studentId: "s-1",
  name: "Ayesha",
  regNo: "R-1",
  marks: "",
  isAbsent: false,
  remarks: "",
  ...overrides,
});

describe("toRows", () => {
  it("turns saved results into editable text, and leaves unmarked students empty", () => {
    const rows = toRows([
      { studentId: "a", name: "A", regNo: "1", result: { id: "r", marksObtained: 72.5, isAbsent: false, remarks: "Good" } },
      { studentId: "b", name: "B", regNo: "2", result: { id: "r2", marksObtained: null, isAbsent: true, remarks: null } },
      { studentId: "c", name: "C", regNo: "3", result: null },
    ]);

    expect(rows[0]).toMatchObject({ marks: "72.5", isAbsent: false, remarks: "Good" });
    expect(rows[1]).toMatchObject({ marks: "", isAbsent: true, remarks: "" });
    expect(rows[2]).toMatchObject({ marks: "", isAbsent: false, remarks: "" });
  });

  it("shows a saved zero as 0, not empty", () => {
    const [zero] = toRows([
      { studentId: "a", name: "A", regNo: "1", result: { id: "r", marksObtained: 0, isAbsent: false, remarks: null } },
    ]);

    expect(zero.marks).toBe("0");
  });
});

describe("validateRow", () => {
  it("accepts empty marks, zero, the maximum and two decimals", () => {
    expect(validateRow(row(), 100)).toBeNull();
    expect(validateRow(row({ marks: "0" }), 100)).toBeNull();
    expect(validateRow(row({ marks: "100" }), 100)).toBeNull();
    expect(validateRow(row({ marks: "72.55" }), 100)).toBeNull();
  });

  it("rejects marks above the maximum, negative marks, non numbers and three decimals", () => {
    expect(validateRow(row({ marks: "101" }), 100)).toBe("Cannot be more than 100.");
    expect(validateRow(row({ marks: "-1" }), 100)).toMatch(/negative/);
    expect(validateRow(row({ marks: "abc" }), 100)).toMatch(/number/);
    expect(validateRow(row({ marks: "50.123" }), 100)).toMatch(/two decimal/);
  });

  it("rejects marks on an absent student", () => {
    expect(validateRow(row({ isAbsent: true, marks: "50" }), 100)).toMatch(/absent student/);
    expect(validateRow(row({ isAbsent: true }), 100)).toBeNull();
  });
});

describe("toEntries", () => {
  const original = row({ marks: "50" });

  it("sends only rows that changed", () => {
    const rows = [row({ marks: "50" }), row({ studentId: "s-2", name: "Bilal", marks: "60" })];
    const originals = new Map([
      ["s-1", original],
      ["s-2", row({ studentId: "s-2", name: "Bilal", marks: "55" })],
    ]);

    expect(toEntries(rows, originals).map((e) => e.studentId)).toEqual(["s-2"]);
  });

  it("clears a mark that was emptied, and sends null marks for an absent student", () => {
    const originals = new Map([["s-1", original]]);

    expect(toEntries([row({ marks: "" })], originals)[0]).toMatchObject({ marksObtained: null, isAbsent: false });
    expect(toEntries([row({ isAbsent: true, marks: "" })], originals)[0]).toMatchObject({
      marksObtained: null,
      isAbsent: true,
    });
  });

  it("always sends the remark, so an emptied remark clears the saved one", () => {
    const originals = new Map([["s-1", row({ marks: "50", remarks: "Old note" })]]);

    expect(toEntries([row({ marks: "50", remarks: "  " })], originals)[0]).toMatchObject({ remarks: "" });
  });

  it("keeps a typed zero as the number zero", () => {
    expect(toEntries([row({ marks: "0" })], new Map())[0]).toMatchObject({ marksObtained: 0 });
  });
});

describe("isDirty and summarize", () => {
  it("treats a row with no original as new", () => {
    expect(isDirty(row(), undefined)).toBe(true);
    expect(isDirty(row(), row())).toBe(false);
  });

  it("counts recorded students and those below passing, counting an absence as recorded but not failing", () => {
    const rows = [
      row({ marks: "80" }),
      row({ studentId: "b", marks: "39" }),
      row({ studentId: "c", isAbsent: true }),
      row({ studentId: "d" }),
    ];

    expect(summarize(rows, 40)).toEqual({ total: 4, recorded: 3, belowPassing: 1 });
  });
});
