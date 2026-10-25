import { afterEach, describe, expect, it } from "vitest";
import {
  formatClockRange,
  formatClockTime,
  formatDate,
  formatDateTime,
  formatDateTimeLong,
  formatTime,
  getDisplayTimeZone,
  setDisplayTimeZone,
} from "./dateFormat";

describe("dateFormat", () => {
  afterEach(() => setDisplayTimeZone());

  describe("formatDate", () => {
    it("writes day, short month and year without padding the day", () => {
      expect(formatDate("2026-10-25")).toBe("25 Oct 2026");
      expect(formatDate("2026-11-02")).toBe("2 Nov 2026");
      expect(formatDate(new Date("2027-01-05T00:00:00.000Z"))).toBe("5 Jan 2027");
    });

    it("keeps a calendar date on its own day in any timezone", () => {
      setDisplayTimeZone("America/Los_Angeles");

      expect(formatDate("2026-10-25T00:00:00.000Z")).toBe("25 Oct 2026");
      expect(formatDate("2026-10-25")).toBe("25 Oct 2026");
    });

    it("writes an instant on the day it falls in the school timezone", () => {
      expect(formatDate("2026-10-24T20:00:00.000Z")).toBe("25 Oct 2026");

      setDisplayTimeZone("Europe/London");
      expect(formatDate("2026-10-24T20:00:00.000Z")).toBe("24 Oct 2026");
    });

    it("returns nothing for something that is not a date", () => {
      expect(formatDate("nope")).toBe("");
    });
  });

  describe("times", () => {
    it("writes a 12 hour time with AM or PM and no leading zero", () => {
      expect(formatTime("2026-10-25T03:00:00.000Z")).toBe("8:00 AM");
      expect(formatTime("2026-10-25T10:05:00.000Z")).toBe("3:05 PM");
      expect(formatTime("2026-10-24T19:00:00.000Z")).toBe("12:00 AM");
      expect(formatTime("2026-10-25T07:00:00.000Z")).toBe("12:00 PM");
    });

    it("writes date and time together in the school timezone", () => {
      expect(formatDateTime("2026-10-24T20:30:00.000Z")).toBe("25 Oct 2026, 1:30 AM");

      setDisplayTimeZone("Europe/London");
      expect(formatDateTime("2026-10-24T20:30:00.000Z")).toBe("24 Oct 2026, 9:30 PM");
    });

    it("adds seconds and the zone for audit trails", () => {
      const written = formatDateTimeLong("2026-10-24T20:30:12.000Z");

      expect(written).toMatch(/^25 Oct 2026, 1:30:12 AM /);
      expect(formatDateTimeLong(new Date("2026-10-24T20:30:12.000Z"))).toBe(written);
    });

    it("returns nothing for something that is not a date", () => {
      expect(formatTime("nope")).toBe("");
      expect(formatDateTime("nope")).toBe("");
      expect(formatDateTimeLong("nope")).toBe("");
    });
  });

  describe("stored wall-clock times", () => {
    it("turns 24 hour into 12 hour without converting a timezone", () => {
      expect(formatClockTime("08:00")).toBe("8:00 AM");
      expect(formatClockTime("13:40")).toBe("1:40 PM");
      expect(formatClockTime("00:15")).toBe("12:15 AM");
      expect(formatClockTime("12:00")).toBe("12:00 PM");
    });

    it("leaves a missing or odd value alone", () => {
      expect(formatClockTime(null)).toBe("");
      expect(formatClockTime(undefined)).toBe("");
      expect(formatClockTime("soon")).toBe("soon");
    });

    it("writes a range", () => {
      expect(formatClockRange("08:00", "08:40")).toBe("8:00 AM - 8:40 AM");
      expect(formatClockRange("11:30", "12:10")).toBe("11:30 AM - 12:10 PM");
    });
  });

  describe("display timezone", () => {
    it("defaults to Karachi and goes back to it when cleared", () => {
      expect(getDisplayTimeZone()).toBe("Asia/Karachi");

      setDisplayTimeZone("Asia/Dubai");
      expect(getDisplayTimeZone()).toBe("Asia/Dubai");

      setDisplayTimeZone(null);
      expect(getDisplayTimeZone()).toBe("Asia/Karachi");
    });
  });
});
