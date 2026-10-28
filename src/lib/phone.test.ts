import { describe, expect, it } from "vitest";
import { COUNTRIES, FALLBACK_COUNTRY, flagUrl, getCountry, resolveCountry, searchCountries } from "./countries";
import { exampleNumber, formatPhone, isValidPhone, joinPhone, splitPhone, toE164 } from "./phone";

describe("toE164", () => {
  it.each([
    ["0300 1234567", "PK", "+923001234567"],
    ["+92 300 1234567", "PK", "+923001234567"],
    ["0092 300 1234567", "PK", "+923001234567"],
    ["03001234567", undefined, "+923001234567"],
    ["+44 7911 123456", "PK", "+447911123456"],
    ["50 123 4567", "AE", "+971501234567"],
  ])("reads %s (%s) as %s", (raw, country, expected) => {
    expect(toE164(raw, country)).toBe(expected);
  });

  it.each(["", "   ", "123", "not a number", "+92 12", null, undefined])("rejects %s", (raw) => {
    expect(toE164(raw as string, "PK")).toBeNull();
  });
});

describe("isValidPhone", () => {
  it("accepts a real number and rejects a short one", () => {
    expect(isValidPhone("+923001234567")).toBe(true);
    expect(isValidPhone("+92300")).toBe(false);
  });
});

describe("splitPhone", () => {
  it("splits an international number into its country and the rest", () => {
    expect(splitPhone("+923001234567")).toEqual({ country: "PK", national: "3001234567" });
    expect(splitPhone("+971501234567")).toEqual({ country: "AE", national: "501234567" });
  });

  it("reads an old local-format number as the fallback country's", () => {
    expect(splitPhone("03001234567", "PK")).toEqual({ country: "PK", national: "3001234567" });
  });

  it("uses the fallback country for an empty value", () => {
    expect(splitPhone("", "AE")).toEqual({ country: "AE", national: "" });
    expect(splitPhone(null)).toEqual({ country: FALLBACK_COUNTRY, national: "" });
  });
});

describe("joinPhone", () => {
  it("joins the calling code and the digits, dropping a leading trunk zero", () => {
    expect(joinPhone("PK", "0300 1234567")).toBe("+923001234567");
    expect(joinPhone("AE", "50-123-4567")).toBe("+971501234567");
  });

  it("keeps a leading zero that is part of the number, as in Italy, and drops one that is only a dialling prefix", () => {
    expect(joinPhone("IT", "06 1234 5678")).toBe("+390612345678");
    expect(isValidPhone(joinPhone("IT", "06 1234 5678"))).toBe(true);
    expect(joinPhone("GB", "07911 123456")).toBe("+447911123456");
    expect(joinPhone("PK", "0301 2345678")).toBe("+923012345678");
    expect(joinPhone("PK", "301 2345678")).toBe("+923012345678");
  });

  it("keeps a half-typed number in step so nothing is lost while typing", () => {
    expect(joinPhone("PK", "0300")).toBe("+92300");
    expect(joinPhone("AE", "5")).toBe("+9715");
  });

  it("is empty when there are no digits yet", () => {
    expect(joinPhone("PK", "")).toBe("");
    expect(joinPhone("PK", "  ")).toBe("");
  });
});

describe("formatPhone", () => {
  it("lays out a valid number and leaves an unreadable one as stored", () => {
    expect(formatPhone("+923001234567")).toBe("+92 300 1234567");
    expect(formatPhone("abc")).toBe("abc");
    expect(formatPhone(null)).toBe("");
  });
});

describe("exampleNumber", () => {
  it("gives a sample to type after the calling code, without a leading zero", () => {
    const sample = exampleNumber("PK");
    expect(sample).toMatch(/^3\d{2} \d+/);
    expect(sample?.startsWith("0")).toBe(false);
    expect(exampleNumber("AE")).toMatch(/^5/);
  });
});

describe("countries", () => {
  it("lists every country with a calling code, in alphabetical order", () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
    expect(getCountry("pk")).toMatchObject({ iso: "PK", dialCode: "+92" });
    const names = COUNTRIES.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("falls back to the default for an unknown code", () => {
    expect(resolveCountry("zz")).toBe(FALLBACK_COUNTRY);
    expect(resolveCountry(null)).toBe(FALLBACK_COUNTRY);
    expect(resolveCountry("ae")).toBe("AE");
  });

  it("finds a country by name, code or calling code", () => {
    expect(searchCountries("pakis").map((c) => c.iso)).toContain("PK");
    expect(searchCountries("pk").map((c) => c.iso)).toContain("PK");
    expect(searchCountries("+92").map((c) => c.iso)).toContain("PK");
    expect(searchCountries("")).toHaveLength(COUNTRIES.length);
    expect(searchCountries("zzzzzz")).toEqual([]);
  });

  it("builds a flag image address", () => {
    expect(flagUrl("PK", 40)).toBe("https://flagcdn.com/w40/pk.png");
  });
});
