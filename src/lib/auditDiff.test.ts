import { describe, it, expect } from "vitest";
import { buildDiffRows, formatAuditValue, humanizeKey } from "./auditDiff";

describe("humanizeKey", () => {
  it("turns field names into readable labels", () => {
    expect(humanizeKey("contactEmail")).toBe("Contact email");
    expect(humanizeKey("currentAcademicYearId")).toBe("Current academic year");
    expect(humanizeKey("name")).toBe("Name");
  });
});

describe("formatAuditValue", () => {
  it("shows an empty value as a dash and booleans as Yes or No", () => {
    expect(formatAuditValue(null).text).toBe("—");
    expect(formatAuditValue("").text).toBe("—");
    expect(formatAuditValue(true).text).toBe("Yes");
    expect(formatAuditValue(false).text).toBe("No");
  });

  it("formats dates instead of showing the raw timestamp", () => {
    const { text } = formatAuditValue("2026-10-22T07:32:32.229Z");
    expect(text).not.toContain("T07:32");
    expect(text).toContain("2026");
  });

  it("shortens ids and keeps the full one as a tooltip", () => {
    const id = "4f25b912-60f8-4382-a02e-03b8a4c62f52";
    expect(formatAuditValue(id)).toEqual({ text: "Ref …c62f52", title: id });
  });

  it("writes enum names in sentence case", () => {
    expect(formatAuditValue("SHARED_HOSTED").text).toBe("Shared hosted");
    expect(formatAuditValue("ACTIVE").text).toBe("Active");
  });

  it("shows the name of a referenced record instead of its id", () => {
    const id = "4f25b912-60f8-4382-a02e-03b8a4c62f52";
    expect(formatAuditValue(id, { [id]: "Naeem Akhtar" })).toEqual({ text: "Naeem Akhtar" });
  });

  it("counts lists and summarises objects instead of dumping JSON", () => {
    expect(formatAuditValue([{ a: 1 }, { a: 2 }]).text).toBe("2 items");
    expect(formatAuditValue({ theme: "default", logoUrl: null }).text).toBe(
      "Theme: default, Logo url: —",
    );
  });
});

describe("buildDiffRows", () => {
  it("hides bookkeeping fields, keeps who changed it, and sorts by label", () => {
    const rows = buildDiffRows(
      { id: "x", updatedAt: "a", updatedBy: null, name: "A", city: "L" },
      { id: "x", updatedAt: "b", updatedBy: "u1", name: "B", city: "L" },
    );
    expect(rows.map((r) => r.key)).toEqual(["city", "name", "updatedBy"]);
    expect(rows.find((r) => r.key === "name")?.changed).toBe(true);
    expect(rows.find((r) => r.key === "city")?.changed).toBe(false);
  });

  it("skips a related record that only the after snapshot carries", () => {
    const rows = buildDiffRows(
      { name: "A" },
      { name: "A", branding: { theme: "default" }, entitlements: [{}] },
    );
    expect(rows.map((r) => r.key)).toEqual(["name"]);
  });

  it("keeps every field for a create", () => {
    const rows = buildDiffRows(null, { name: "A", items: [1] });
    expect(rows.map((r) => r.key)).toEqual(["items", "name"]);
  });
});
