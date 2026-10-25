import { formatClockRange } from "@/lib/dateFormat";

export type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

const ORDER: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

/** Monday to Friday always show, even when empty; the weekend shows only when something is on it. */
const ALWAYS_SHOWN = ORDER.slice(0, 5);

export const DAY_NAMES: Record<Weekday, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

/** One period laid on a date of a week, with that date's cover applied. */
export interface WeekEntry {
  id: string;
  dayOfWeek: Weekday;
  periodNumber: number;
  name: string;
  startTime: string;
  endTime: string;
  room: string | null;
  sectionId: string;
  className: string;
  sectionName: string;
  subjectName: string | null;
  staffProfileId: string | null;
  teacherName: string | null;
  date: string;
  effectiveTeacherName: string | null;
  isCovered: boolean;
  coverSubstituteName: string | null;
  coverReason: string | null;
  isCoverDuty: boolean;
}

export interface TimetableGroup {
  kind: "SECTION" | "STUDENT" | "TEACHER";
  id: string;
  title: string;
  subtitle: string | null;
  entries: WeekEntry[];
}

export interface TimetableWeek {
  from: string;
  to: string;
}

export interface GridRow {
  key: string;
  startTime: string;
  endTime: string;
  label: string;
  cells: Map<Weekday, WeekEntry[]>;
}

export interface TimetableGrid {
  days: Weekday[];
  dates: Map<Weekday, string>;
  rows: GridRow[];
}

/**
 * Turns a week's periods into the day-by-period table a timetable uses: one
 * column per day, one row per time slot, ordered by time. With `onlyDay` the
 * table has just that day's column.
 */
export function buildGrid(entries: WeekEntry[], onlyDay?: Weekday): TimetableGrid {
  const used = new Set(entries.map((entry) => entry.dayOfWeek));
  const days = onlyDay ? [onlyDay] : ORDER.filter((day) => ALWAYS_SHOWN.includes(day) || used.has(day));
  const dates = new Map<Weekday, string>(entries.map((entry) => [entry.dayOfWeek, entry.date]));
  const rows = new Map<string, GridRow>();
  for (const entry of entries) {
    const key = `${entry.startTime}-${entry.endTime}`;
    const row = rows.get(key) ?? { key, startTime: entry.startTime, endTime: entry.endTime, label: entry.name, cells: new Map<Weekday, WeekEntry[]>() };
    row.cells.set(entry.dayOfWeek, [...(row.cells.get(entry.dayOfWeek) ?? []), entry]);
    rows.set(key, row);
  }
  return {
    days,
    dates,
    rows: [...rows.values()].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime)),
  };
}

/**
 * The lines shown in one cell: what is taught and by whom, noting cover. A
 * section's or student's timetable names the teacher; a teacher's names the class.
 */
export function cellLines(entry: WeekEntry, forTeacher: boolean): string[] {
  const lines = [entry.subjectName ?? entry.name];
  if (forTeacher) {
    lines.push(`${entry.className} ${entry.sectionName}`);
    if (entry.isCoverDuty) lines.push("Covering");
    else if (entry.isCovered) lines.push(`Covered by ${entry.coverSubstituteName ?? "a substitute"}`);
  } else {
    if (entry.effectiveTeacherName) lines.push(entry.effectiveTeacherName);
    if (entry.isCovered) lines.push("(cover)");
  }
  if (entry.room) lines.push(entry.room);
  return lines;
}

/** A `YYYY-MM-DD` date moved by whole weeks. */
export function shiftWeek(date: string, weeks: number): string {
  const moved = new Date(`${date}T00:00:00.000Z`);
  moved.setUTCDate(moved.getUTCDate() + weeks * 7);
  return moved.toISOString().slice(0, 10);
}

/** Today as a `YYYY-MM-DD` date. */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The two periods that clash with each other, as the clash list reports them. */
export interface TimetableClash {
  kind: "TEACHER" | "ROOM";
  first: ClashSide;
  second: ClashSide;
}

export interface ClashSide {
  id: string;
  className: string | null;
  sectionName: string | null;
  teacherName: string | null;
  room: string | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
}

/** For each clashing period, a sentence saying what it clashes with. */
export function clashNotes(clashes: TimetableClash[]): Map<string, string[]> {
  const notes = new Map<string, string[]>();
  const add = (id: string, text: string) => notes.set(id, [...(notes.get(id) ?? []), text]);
  for (const clash of clashes) {
    const describe = (other: ClashSide) =>
      `${clash.kind === "TEACHER" ? "Same teacher" : "Same room"} as ${other.className ?? "another class"} ${other.sectionName ?? ""} at ${formatClockRange(other.startTime ?? "", other.endTime ?? "")}`.replace(/\s+/g, " ");
    add(clash.first.id, describe(clash.second));
    add(clash.second.id, describe(clash.first));
  }
  return notes;
}

/** The weekday a `YYYY-MM-DD` date falls on. */
export function weekdayOf(date: string): Weekday {
  return ORDER[(new Date(`${date}T00:00:00.000Z`).getUTCDay() + 6) % 7];
}

/** A `YYYY-MM-DD` date moved by whole days. */
export function addDays(date: string, days: number): string {
  const moved = new Date(`${date}T00:00:00.000Z`);
  moved.setUTCDate(moved.getUTCDate() + days);
  return moved.toISOString().slice(0, 10);
}
