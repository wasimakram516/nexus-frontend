import { describe, expect, it } from "vitest";
import { addDays, buildGrid, cellLines, clashNotes, shiftWeek, weekdayOf, type WeekEntry } from "./timetableDocuments";

const entry = (overrides: Partial<WeekEntry> = {}): WeekEntry => ({
  id: "e1",
  dayOfWeek: "MONDAY",
  periodNumber: 1,
  name: "Period 1",
  startTime: "08:00",
  endTime: "08:40",
  room: null,
  sectionId: "sec-1",
  className: "Grade 5",
  sectionName: "A",
  subjectName: "Maths",
  staffProfileId: "t1",
  teacherName: "Teacher One",
  date: "2026-11-02",
  effectiveTeacherName: "Teacher One",
  isCovered: false,
  coverSubstituteName: null,
  coverReason: null,
  isCoverDuty: false,
  ...overrides,
});

describe("buildGrid", () => {
  it("always shows Monday to Friday, and the weekend only when something is on it", () => {
    expect(buildGrid([]).days).toEqual(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
    expect(buildGrid([entry({ dayOfWeek: "SATURDAY", date: "2026-11-07" })]).days).toEqual([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ]);
  });

  it("makes one row per time slot in time order, with each day in its column and its date", () => {
    const grid = buildGrid([
      entry({ id: "late", startTime: "09:20", endTime: "10:00", name: "Period 3" }),
      entry({ id: "mon" }),
      entry({ id: "tue", dayOfWeek: "TUESDAY", date: "2026-11-03" }),
    ]);

    expect(grid.rows.map((row) => row.key)).toEqual(["08:00-08:40", "09:20-10:00"]);
    expect(grid.rows[0].cells.get("MONDAY")?.[0].id).toBe("mon");
    expect(grid.rows[0].cells.get("TUESDAY")?.[0].id).toBe("tue");
    expect(grid.rows[0].cells.get("WEDNESDAY")).toBeUndefined();
    expect(grid.dates.get("TUESDAY")).toBe("2026-11-03");
  });
});

describe("cellLines", () => {
  it("shows the subject, the teacher and the room for a section", () => {
    expect(cellLines(entry({ room: "Lab 1" }), false)).toEqual(["Maths", "Teacher One", "Lab 1"]);
  });

  it("names the covering teacher and says it is cover", () => {
    expect(cellLines(entry({ isCovered: true, effectiveTeacherName: "Teacher Two" }), false)).toEqual(["Maths", "Teacher Two", "(cover)"]);
  });

  it("falls back to the period name, and leaves out a missing teacher", () => {
    expect(cellLines(entry({ subjectName: null, name: "Recess", effectiveTeacherName: null }), false)).toEqual(["Recess"]);
  });

  it("shows the class for a teacher, and who covers or whom they cover", () => {
    expect(cellLines(entry(), true)).toEqual(["Maths", "Grade 5 A"]);
    expect(cellLines(entry({ isCovered: true, coverSubstituteName: "Teacher Two" }), true)).toEqual(["Maths", "Grade 5 A", "Covered by Teacher Two"]);
    expect(cellLines(entry({ isCovered: true, isCoverDuty: true }), true)).toEqual(["Maths", "Grade 5 A", "Covering"]);
  });
});

describe("dates", () => {
  it("moves a date by whole weeks across month and year ends", () => {
    expect(shiftWeek("2026-11-02", 1)).toBe("2026-11-09");
    expect(shiftWeek("2026-11-02", -1)).toBe("2026-10-26");
    expect(shiftWeek("2026-12-28", 1)).toBe("2027-01-04");
  });
});

describe("clashNotes", () => {
  it("tells each clashing period what it clashes with", () => {
    const side = (id: string, section: string, start: string) => ({
      id,
      className: "Grade 5",
      sectionName: section,
      teacherName: "T",
      room: null,
      dayOfWeek: "MONDAY",
      startTime: start,
      endTime: "09:00",
    });

    const notes = clashNotes([{ kind: "TEACHER", first: side("a", "A", "08:00"), second: side("b", "B", "08:20") }]);

    expect(notes.get("a")).toEqual(["Same teacher as Grade 5 B at 8:20 AM - 9:00 AM"]);
    expect(notes.get("b")).toEqual(["Same teacher as Grade 5 A at 8:00 AM - 9:00 AM"]);
  });

  it("collects several clashes for one period", () => {
    const side = (id: string) => ({ id, className: null, sectionName: null, teacherName: null, room: "R", dayOfWeek: null, startTime: "08:00", endTime: "09:00" });

    const notes = clashNotes([
      { kind: "ROOM", first: side("a"), second: side("b") },
      { kind: "TEACHER", first: side("a"), second: side("c") },
    ]);

    expect(notes.get("a")).toHaveLength(2);
    expect(notes.get("a")?.[0]).toBe("Same room as another class at 8:00 AM - 9:00 AM");
  });
});

describe("weekdays", () => {
  it("finds the weekday of a date, Monday first", () => {
    expect(weekdayOf("2026-11-02")).toBe("MONDAY");
    expect(weekdayOf("2026-11-08")).toBe("SUNDAY");
    expect(weekdayOf("2026-11-04")).toBe("WEDNESDAY");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  });
});
