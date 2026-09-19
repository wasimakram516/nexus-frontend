/** Formats a calendar date in an explicit campus zone, independent of the browser. */
export function campusDate(timezone: string, at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

/** Formats campus wall-clock time for display and time inputs. */
export function campusTime(timezone: string, at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at);
}

/** Converts a campus date/time to an instant; rejects nonexistent DST wall times. */
export function campusInstant(timezone: string, date: string, time: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Enter a valid date and time.");
  const target = Date.parse(`${date}T${time}:00.000Z`);
  let guess = target;
  for (let attempt = 0; attempt < 3; attempt++) {
    const instant = new Date(guess);
    const represented = Date.parse(`${campusDate(timezone, instant)}T${campusTime(timezone, instant)}:00.000Z`);
    const delta = represented - target;
    if (!delta) return instant.toISOString();
    guess -= delta;
  }
  throw new Error("This local time does not exist because the campus clocks change. Choose another time.");
}
