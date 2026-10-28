import { describe, expect, it } from "vitest";
import { describeLimits, limitFieldsOf, limitProblem, limitsFromFields, NEW_PLAN_LIMITS } from "./planLimits";

describe("planLimits", () => {
  it("reads stored limits into fields, blank for none", () => {
    expect(limitFieldsOf({ maxCampuses: 3, maxStudents: 500, maxStaff: null })).toEqual({ maxCampuses: "3", maxStudents: "500", maxStaff: "" });
    expect(limitFieldsOf(null)).toEqual({ maxCampuses: "", maxStudents: "", maxStaff: "" });
    expect(limitFieldsOf({ maxCampuses: "many" })).toEqual({ maxCampuses: "", maxStudents: "", maxStaff: "" });
  });

  it("starts a new plan at one campus with nothing else limited", () => {
    expect(NEW_PLAN_LIMITS).toEqual({ maxCampuses: "1", maxStudents: "", maxStaff: "" });
  });

  it("turns the fields into numbers, blank into null, and keeps settings the form does not know", () => {
    expect(limitsFromFields({ maxCampuses: " 5 ", maxStudents: "", maxStaff: "40" }, { maxCampuses: 1, somethingElse: true })).toEqual({
      maxCampuses: 5,
      maxStudents: null,
      maxStaff: 40,
      somethingElse: true,
    });
    expect(limitsFromFields(NEW_PLAN_LIMITS, undefined)).toEqual({ maxCampuses: 1, maxStudents: null, maxStaff: null });
  });

  it("accepts a whole number of one or more, or blank, and says what to fix otherwise", () => {
    expect(limitProblem("Students", "")).toBeNull();
    expect(limitProblem("Students", "  ")).toBeNull();
    expect(limitProblem("Students", "250")).toBeNull();
    for (const bad of ["0", "-5", "2.5", "ten", "1e3"]) {
      expect(limitProblem("Students", bad)).toBe("Students must be a whole number of 1 or more, or blank for no limit.");
    }
  });

  it("describes limits for a plan card", () => {
    expect(describeLimits({ maxCampuses: 3, maxStudents: 500, maxStaff: null })).toBe("3 campuses · 500 students · unlimited staff");
    expect(describeLimits({})).toBe("unlimited campuses · unlimited students · unlimited staff");
  });
});
