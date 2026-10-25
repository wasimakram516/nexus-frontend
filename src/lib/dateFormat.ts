/**
 * The one way dates and times are written for people: `25 Oct 2026`,
 * `8:00 AM`, `25 Oct 2026, 8:00 AM`. Stored and sent values stay ISO; use
 * these only for text a person reads. The backend has the same rules in
 * `src/common/utils/date-format.util.ts`; change both together.
 *
 * Instants are written in the school's timezone, so everyone sees the same
 * time and a screen matches the PDF. The runtime configuration sets it once
 * the school is known.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Used until the school's timezone is known. */
export const DEFAULT_DISPLAY_TIME_ZONE = "Asia/Karachi";

let displayTimeZone = DEFAULT_DISPLAY_TIME_ZONE;

/** Sets the timezone dates are written in; pass nothing to go back to the default. */
export function setDisplayTimeZone(timeZone?: string | null): void {
  displayTimeZone = timeZone || DEFAULT_DISPLAY_TIME_ZONE;
}

export function getDisplayTimeZone(): string {
  return displayTimeZone;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const MIDNIGHT_UTC = /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/;
const CLOCK_TIME = /^([01]?\d|2[0-3]):([0-5]\d)$/;

interface Parts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  zoneName: string;
}

/** The wall-clock parts of an instant in a timezone (the school's unless one is given). */
function partsOf(date: Date, timeZone: string = displayTimeZone): Parts {
  const found = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
    timeZoneName: "short",
  }).formatToParts(date);
  const pick = (type: string) => Number(found.find((part) => part.type === type)?.value ?? 0);
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour") % 24,
    minute: pick("minute"),
    second: pick("second"),
    zoneName: found.find((part) => part.type === "timeZoneName")?.value ?? "",
  };
}

const writeDate = (parts: Pick<Parts, "year" | "month" | "day">) => `${parts.day} ${MONTHS[parts.month - 1]} ${parts.year}`;

const writeTime = (hour: number, minute: number, second?: number) =>
  `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, "0")}${second === undefined ? "" : `:${String(second).padStart(2, "0")}`} ${hour < 12 ? "AM" : "PM"}`;

const toDate = (value: string | Date) => (typeof value === "string" ? new Date(value) : value);

/**
 * Whether a value is a calendar date (no time of day) rather than an instant:
 * a `YYYY-MM-DD` string, or midnight UTC, which is how a database date comes
 * back. A calendar date must not move to another day in another timezone.
 */
function isCalendarDate(value: string | Date): boolean {
  if (typeof value === "string") return DATE_ONLY.test(value) || MIDNIGHT_UTC.test(value);
  return value.getUTCHours() === 0 && value.getUTCMinutes() === 0 && value.getUTCSeconds() === 0 && value.getUTCMilliseconds() === 0;
}

/**
 * A date as `25 Oct 2026`. A calendar date (a due date, an exam date) is
 * written as stored; any other instant on the day it falls in the school's
 * timezone. Returns an empty string for something that is not a date.
 */
export function formatDate(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  if (isCalendarDate(value)) {
    return writeDate({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
  }
  return writeDate(partsOf(date));
}

/** An instant's time of day as `8:00 AM`, in the school's timezone unless a campus's own is given. */
export function formatTime(value: string | Date, timeZone?: string): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = partsOf(date, timeZone);
  return writeTime(parts.hour, parts.minute);
}

/** An instant as `25 Oct 2026, 8:00 AM` in the school's timezone. */
export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = partsOf(date);
  return `${writeDate(parts)}, ${writeTime(parts.hour, parts.minute)}`;
}

/** The detailed form for audit trails: `25 Oct 2026, 8:00:12 AM GMT+5`. */
export function formatDateTimeLong(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = partsOf(date);
  return `${writeDate(parts)}, ${writeTime(parts.hour, parts.minute, parts.second)} ${parts.zoneName}`.trim();
}

export function formatRelative(value: string | Date): string {
  const date = toDate(value);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

/**
 * A stored wall-clock time (`"08:00"`, 24 hour) as `8:00 AM`. A period's start
 * time has no timezone, so nothing is converted.
 */
export function formatClockTime(value: string | null | undefined): string {
  if (!value) return "";
  const match = CLOCK_TIME.exec(value);
  return match ? writeTime(Number(match[1]), Number(match[2])) : value;
}

/** Two stored wall-clock times as `8:00 AM - 8:40 AM`. */
export function formatClockRange(start: string, end: string): string {
  return `${formatClockTime(start)} - ${formatClockTime(end)}`;
}
