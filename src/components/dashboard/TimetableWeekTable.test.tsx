import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TimetableWeekTable from "./TimetableWeekTable";
import type { TimetableGroup, WeekEntry } from "@/lib/timetableDocuments";

const entry = (overrides: Partial<WeekEntry> = {}): WeekEntry => ({
  id: "e1",
  dayOfWeek: "MONDAY",
  periodNumber: 1,
  name: "Period 1",
  startTime: "08:00",
  endTime: "08:40",
  room: "Lab 1",
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

const group = (kind: TimetableGroup["kind"], entries: WeekEntry[]): TimetableGroup => ({ kind, id: "g1", title: "Grade 5, section A", subtitle: null, entries });

describe("TimetableWeekTable", () => {
  it("shows each day with its date and the period in its column", () => {
    render(<TimetableWeekTable group={group("SECTION", [entry()])} />);

    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("02 Nov")).toBeInTheDocument();
    expect(screen.getByText("Maths")).toBeInTheDocument();
    expect(screen.getByText("Teacher One")).toBeInTheDocument();
    expect(screen.getByText("Lab 1")).toBeInTheDocument();
    expect(screen.getByText("08:00 - 08:40")).toBeInTheDocument();
  });

  it("marks a covered period, naming the substitute", () => {
    render(<TimetableWeekTable group={group("SECTION", [entry({ isCovered: true, effectiveTeacherName: "Teacher Two" })])} />);

    expect(screen.getByText("Teacher Two")).toBeInTheDocument();
    expect(screen.getByText("Cover")).toBeInTheDocument();
  });

  it("shows a teacher the class of each period and marks cover duty", () => {
    render(<TimetableWeekTable group={group("TEACHER", [entry({ isCovered: true, isCoverDuty: true })])} />);

    expect(screen.getByText("Grade 5 A")).toBeInTheDocument();
    expect(screen.getByText("Cover duty")).toBeInTheDocument();
  });

  it("says so when there are no periods", () => {
    render(<TimetableWeekTable group={group("SECTION", [])} />);

    expect(screen.getByText("There are no periods in this timetable yet.")).toBeInTheDocument();
  });
});
