import { describe, expect, it } from "vitest";
import { contrastRatio, findContrastIssues } from "./contrast";

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for the same colour", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#336699", "#336699")).toBe(1);
  });

  it("does not depend on which colour is first", () => {
    expect(contrastRatio("#1a237e", "#ffffff")).toBeCloseTo(contrastRatio("#ffffff", "#1a237e") as number, 6);
  });

  it("matches known values, such as grey #777 on white at 4.48", () => {
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
  });

  it("is null for a colour that is not six hex digits", () => {
    expect(contrastRatio("red", "#ffffff")).toBeNull();
    expect(contrastRatio("#fff", "#000")).toBeNull();
  });
});

describe("findContrastIssues", () => {
  it("has nothing to say when the school set no colours", () => {
    expect(findContrastIssues("light", {})).toEqual([]);
    expect(findContrastIssues("dark", {})).toEqual([]);
  });

  it("warns when text chosen for primary buttons is too close to the button", () => {
    const issues = findContrastIssues("light", { light: { "primary.main": "#ffee00", "primary.contrastText": "#ffffff" } });

    const text = issues.find((issue) => issue.message.includes("text on primary buttons"));
    expect(text?.message).toMatch(/^The text on primary buttons would be hard to read \(contrast \d\.\d:1; 4\.5:1 is needed\)\.$/);
    expect(text?.required).toBe(4.5);
    // The same pale yellow is also too faint to see as a button on a white card.
    expect(issues).toHaveLength(2);
  });

  it("does not check button text the school left to be worked out, since that is chosen to be readable", () => {
    const issues = findContrastIssues("light", { light: { "primary.main": "#ffee00" } });

    expect(issues.some((issue) => issue.message.includes("text on primary buttons"))).toBe(false);
  });

  it("warns about a primary colour too faint against the cards it sits on, needing 3:1 there", () => {
    const issues = findContrastIssues("light", { light: { "primary.main": "#f0f0f0" } });

    expect(issues.map((issue) => issue.required)).toEqual([3]);
    expect(issues[0].message).toContain("Primary buttons and links on cards and panels");
  });

  it("warns about body text on a background that was changed, but only for the mode being edited", () => {
    const overrides = { light: { "background.paper": "#222222" } };

    expect(findContrastIssues("light", overrides).some((issue) => issue.message.includes("main text on cards"))).toBe(true);
    expect(findContrastIssues("dark", overrides)).toEqual([]);
  });

  it("accepts a good dark text on a light background", () => {
    expect(findContrastIssues("light", { light: { "background.paper": "#ffffff", "text.primary": "#111111" } })).toEqual([]);
  });
});
