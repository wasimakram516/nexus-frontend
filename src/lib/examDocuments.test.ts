import { describe, expect, it } from "vitest";
import {
  describeMarks,
  describeRetake,
  formatPercent,
  formatPosition,
  ordinal,
  OutcomeSubject,
} from "./examDocuments";

const subject = (overrides: Partial<OutcomeSubject> = {}): OutcomeSubject => ({
  examSubjectId: "p1",
  subjectId: "s1",
  subjectName: "Maths",
  maxMarks: 100,
  passingMarks: 40,
  marksObtained: 72.5,
  state: "MARKED",
  percentage: 72.5,
  grade: "B",
  passed: true,
  ...overrides,
});

describe("ordinal", () => {
  it("uses st, nd, rd and th, with the teens all th", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th",
    ]);
  });
});

describe("formatPercent and formatPosition", () => {
  it("trims to two decimals and shows a dash for no value", () => {
    expect(formatPercent(86.6667)).toBe("86.67%");
    expect(formatPercent(80)).toBe("80%");
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(undefined)).toBe("—");
  });

  it("shows the position out of the ranked students, or a dash when unranked", () => {
    expect(formatPosition(2, 30)).toBe("2nd of 30");
    expect(formatPosition(null, 30)).toBe("—");
    expect(formatPosition(1, 0)).toBe("—");
  });
});

describe("describeMarks", () => {
  it("shows marks, an absence or that marks are pending", () => {
    expect(describeMarks(subject())).toBe("72.5");
    expect(describeMarks(subject({ marksObtained: 0 }))).toBe("0");
    expect(describeMarks(subject({ state: "ABSENT", marksObtained: null }))).toBe("Absent");
    expect(describeMarks(subject({ state: "UNMARKED", marksObtained: null }))).toBe("Pending");
  });
});

describe("describeRetake", () => {
  it("is empty for an ordinary subject", () => {
    expect(describeRetake(subject())).toBe("");
  });

  it("names the kind of sitting and keeps the original mark and grade visible", () => {
    expect(
      describeRetake(
        subject({ isRetake: true, retakeExamType: "IMPROVEMENT", originalMarksObtained: 30, originalGrade: "F" }),
      ),
    ).toBe("Counted from the improvement; original 30 (F)");
  });

  it("copes with a missing original mark or grade", () => {
    expect(describeRetake(subject({ isRetake: true, retakeExamType: "RETAKE", originalMarksObtained: null }))).toBe(
      "Counted from the retake; no original mark",
    );
    expect(describeRetake(subject({ isRetake: true, retakeExamType: null, originalMarksObtained: 45, originalGrade: null }))).toBe(
      "Counted from the retake; original 45",
    );
  });
});
