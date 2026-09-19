import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiHandler } from "./apiHandler";
import { parseSettingObject } from "./settings";
import { toSlug, toSnakeCase } from "./slugify";
import { formatDate, formatDateTime, formatDateTimeLong, formatRelative } from "./dateFormat";
import { getResponse } from "./chatEngine";

describe("apiHandler", () => {
  it("returns data and shows the server message on success", async () => {
    const showMessage = vi.fn();
    const result = await apiHandler(async () => ({ data: { data: { id: 1 }, message: "Saved!" } }), { showMessage });
    expect(result).toEqual({ data: { id: 1 }, success: true });
    expect(showMessage).toHaveBeenCalledWith("Saved!", "success");
  });

  it("prefers the explicit successMessage and falls back to a default", async () => {
    const showMessage = vi.fn();
    await apiHandler(async () => ({ data: { data: 1, message: "server" } }), { showMessage, successMessage: "Mine" });
    expect(showMessage).toHaveBeenLastCalledWith("Mine", "success");
    await apiHandler(async () => ({ data: { data: 1 } }), { showMessage });
    expect(showMessage).toHaveBeenLastCalledWith("Operation successful", "success");
  });

  it("stays quiet on success when silent and maps a missing payload to null", async () => {
    const showMessage = vi.fn();
    const result = await apiHandler(async () => ({ data: { data: undefined as never } }), { showMessage, silent: true });
    expect(result).toEqual({ data: null, success: true });
    expect(showMessage).not.toHaveBeenCalled();
  });

  it("surfaces the backend message on failure", async () => {
    const showMessage = vi.fn();
    const err = Object.assign(new Error("Request failed"), { response: { status: 400, data: { message: "Email taken" } } });
    const result = await apiHandler(async () => { throw err; }, { showMessage });
    expect(result).toEqual({ data: null, success: false });
    expect(showMessage).toHaveBeenCalledWith("Email taken", "error");
  });

  it("falls back to the error message, then a generic one", async () => {
    const showMessage = vi.fn();
    await apiHandler(async () => { throw new Error("Network Error"); }, { showMessage });
    expect(showMessage).toHaveBeenLastCalledWith("Network Error", "error");
    await apiHandler(async () => { throw {}; }, { showMessage });
    expect(showMessage).toHaveBeenLastCalledWith("Something went wrong", "error");
  });

  it.each([403, 404])("suppresses expected %i errors in silent mode but still reports others", async (status) => {
    const showMessage = vi.fn();
    const expected = Object.assign(new Error("x"), { response: { status, data: {} } });
    await apiHandler(async () => { throw expected; }, { showMessage, silent: true });
    expect(showMessage).not.toHaveBeenCalled();
    const unexpected = Object.assign(new Error("boom"), { response: { status: 500, data: {} } });
    await apiHandler(async () => { throw unexpected; }, { showMessage, silent: true });
    expect(showMessage).toHaveBeenCalledWith("boom", "error");
  });

  it("does not suppress 403 when not silent", async () => {
    const showMessage = vi.fn();
    const err = Object.assign(new Error("Forbidden"), { response: { status: 403, data: { message: "No access" } } });
    await apiHandler(async () => { throw err; }, { showMessage });
    expect(showMessage).toHaveBeenCalledWith("No access", "error");
  });
});

describe("parseSettingObject", () => {
  it("returns null for absent or non-object values", () => {
    expect(parseSettingObject(null)).toBeNull();
    expect(parseSettingObject(undefined)).toBeNull();
    expect(parseSettingObject(5)).toBeNull();
    expect(parseSettingObject([1, 2])).toBeNull();
  });

  it("returns plain objects as-is", () => {
    expect(parseSettingObject({ mode: "DAILY" })).toEqual({ mode: "DAILY" });
  });

  it("decodes JSON strings and unwraps { value } wrappers, including nested combinations", () => {
    expect(parseSettingObject('{"mode":"PERIOD"}')).toEqual({ mode: "PERIOD" });
    expect(parseSettingObject({ value: { a: 1 } })).toEqual({ a: 1 });
    expect(parseSettingObject({ value: '{"b":2}' })).toEqual({ b: 2 });
    expect(parseSettingObject('{"value":{"c":3}}')).toEqual({ c: 3 });
  });

  it("returns null for invalid JSON", () => {
    expect(parseSettingObject("{not json")).toBeNull();
  });
});

describe("slugify", () => {
  it("builds URL-safe slugs", () => {
    expect(toSlug("  Greenfield Public  School!! ")).toBe("greenfield-public-school");
    expect(toSlug("a - - b")).toBe("a-b");
  });

  it("builds snake_case keys", () => {
    expect(toSnakeCase("  Father's Name  (Full) ")).toBe("fathers_name_full");
    expect(toSnakeCase("a  __ b")).toBe("a_b");
  });
});

describe("dateFormat", () => {
  const iso = "2026-03-05T14:30:45.000Z";

  it("formats dates from strings and Date objects identically", () => {
    expect(formatDate(iso)).toBe(formatDate(new Date(iso)));
    expect(formatDate(iso)).toMatch(/2026/);
  });

  it("includes time components for date-time formats", () => {
    expect(formatDateTime(iso)).toMatch(/2026/);
    expect(formatDateTime(iso)).toMatch(/\d{1,2}:\d{2}/);
    expect(formatDateTimeLong(iso)).toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(formatDateTimeLong(new Date(iso))).toBe(formatDateTimeLong(iso));
  });

  describe("formatRelative", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    });
    afterEach(() => vi.useRealTimers());

    it.each([
      ["2026-06-15T11:59:45Z", "Just now"],
      ["2026-06-15T11:30:00Z", "30m ago"],
      ["2026-06-15T07:00:00Z", "5h ago"],
      ["2026-06-12T12:00:00Z", "3d ago"],
    ])("%s -> %s", (value, expected) => {
      expect(formatRelative(value)).toBe(expected);
    });

    it("falls back to an absolute date after a week", () => {
      const old = "2026-05-01T12:00:00Z";
      expect(formatRelative(old)).toBe(formatDate(old));
    });
  });
});

describe("chatEngine.getResponse", () => {
  it("matches a knowledge-base topic ignoring case and punctuation", () => {
    const res = getResponse("HELLO!!!");
    expect(res.reply).toMatch(/Nexus/);
    expect(res.suggestions?.length).toBeGreaterThan(0);
  });

  it("routes topic keywords to the relevant module answer", () => {
    expect(getResponse("Tell me about attendance").reply).toMatch(/attendance/i);
    expect(getResponse("what is the pricing").reply).toMatch(/plan|pric/i);
  });

  it("returns a fallback reply for unknown input", () => {
    const res = getResponse("zzqxv wibble");
    expect(typeof res.reply).toBe("string");
    expect(res.reply.length).toBeGreaterThan(0);
  });

  it("always picks one of several variants deterministically for a seeded random", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);
    const first = getResponse("hello").reply;
    spy.mockReturnValue(0.99);
    const last = getResponse("hello").reply;
    spy.mockRestore();
    expect(first).not.toBe(last);
  });
});
