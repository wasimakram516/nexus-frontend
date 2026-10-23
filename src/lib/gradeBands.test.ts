import { describe, expect, it } from "vitest";
import { bandsToForm, bandsToPayload, describeBand, GradeBandForm, validateBands } from "./gradeBands";

const band = (grade: string, min: string, max: string, remarks = ""): GradeBandForm => ({
  grade,
  minPercentage: min,
  maxPercentage: max,
  remarks,
});

describe("validateBands", () => {
  it("accepts non-overlapping bands, including gaps", () => {
    expect(validateBands([band("A", "80", "100"), band("C", "40", "60")])).toBeNull();
  });

  it("requires at least one band", () => {
    expect(validateBands([])).toMatch(/at least one/i);
  });

  it("requires a grade label and both percentages", () => {
    expect(validateBands([band("", "0", "100")])).toMatch(/grade label/i);
    expect(validateBands([band("A", "", "100")])).toMatch(/both percentages/i);
  });

  it("keeps percentages inside 0 to 100 with at most two decimals", () => {
    expect(validateBands([band("A", "-1", "50")])).toMatch(/between 0 and 100/);
    expect(validateBands([band("A", "0", "101")])).toMatch(/between 0 and 100/);
    expect(validateBands([band("A", "0", "50.123")])).toMatch(/two decimal/);
  });

  it("rejects a minimum above the maximum", () => {
    expect(validateBands([band("A", "90", "80")])).toMatch(/minimum cannot be greater/);
  });

  it("rejects duplicate grade labels regardless of case", () => {
    expect(validateBands([band("A", "90", "100"), band("a", "0", "50")])).toMatch(/more than once/);
  });

  it("rejects overlapping ranges and ranges that touch", () => {
    expect(validateBands([band("A", "70", "100"), band("B", "60", "75")])).toMatch(/overlapping/);
    expect(validateBands([band("A", "80", "100"), band("B", "60", "80")])).toMatch(/overlapping/);
  });
});

describe("band helpers", () => {
  it("builds the payload in row order with trimmed text and only non-empty remarks", () => {
    expect(bandsToPayload([band(" A ", "80", "100", " Excellent "), band("F", "0", "79.99")])).toEqual([
      { grade: "A", minPercentage: 80, maxPercentage: 100, remarks: "Excellent", sortOrder: 0 },
      { grade: "F", minPercentage: 0, maxPercentage: 79.99, sortOrder: 1 },
    ]);
  });

  it("seeds the editor highest range first and strips trailing zeros from API decimals", () => {
    const form = bandsToForm([
      { grade: "F", minPercentage: "0.00", maxPercentage: "59.99", remarks: null },
      { grade: "A", minPercentage: "80.00", maxPercentage: "100.00", remarks: "Top" },
    ]);

    expect(form.map((row) => row.grade)).toEqual(["A", "F"]);
    expect(form[0]).toEqual({ grade: "A", minPercentage: "80", maxPercentage: "100", remarks: "Top" });
  });

  it("describes a band compactly", () => {
    expect(describeBand({ grade: "B", minPercentage: "60.00", maxPercentage: "79.99" })).toBe("B 60–79.99");
  });
});
