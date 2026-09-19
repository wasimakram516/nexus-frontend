import { describe, it, expect } from "vitest";
import { campusDate, campusTime, campusInstant } from "./campus-time";

describe("campus-local attendance time", () => {
  it("converts entered Karachi time independently of the browser zone", () => {
    expect(campusInstant("Asia/Karachi", "2026-09-19", "08:00")).toBe("2026-09-19T03:00:00.000Z");
  });
  it("uses the campus calendar date across UTC midnight", () => {
    const at = new Date("2026-09-19T20:30:00Z");
    expect(campusDate("Asia/Karachi", at)).toBe("2026-09-20");
    expect(campusTime("Asia/Karachi", at)).toBe("01:30");
    expect(campusDate("America/Los_Angeles", at)).toBe("2026-09-19");
  });
  it("resolves summer and winter offsets and rejects nonexistent spring-forward time", () => {
    expect(campusInstant("America/New_York", "2026-07-01", "08:00")).toBe("2026-07-01T12:00:00.000Z");
    expect(campusInstant("America/New_York", "2026-01-01", "08:00")).toBe("2026-01-01T13:00:00.000Z");
    expect(() => campusInstant("America/New_York", "2026-03-08", "02:30")).toThrow("does not exist");
  });
});
