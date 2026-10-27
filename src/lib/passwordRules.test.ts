import { describe, expect, it } from "vitest";
import { validateNewPassword } from "./passwordRules";

describe("validateNewPassword", () => {
  it("asks for at least eight characters", () => {
    expect(validateNewPassword("short", "short")).toBe("Use at least 8 characters.");
    expect(validateNewPassword("12345678", "12345678")).toBeNull();
  });

  it("refuses more than the server reads, counting bytes not letters", () => {
    expect(validateNewPassword("a".repeat(72), "a".repeat(72))).toBeNull();
    expect(validateNewPassword("a".repeat(73), "a".repeat(73))).toBe("Use at most 72 characters.");
    expect(validateNewPassword("é".repeat(37), "é".repeat(37))).toBe("Use at most 72 characters.");
  });

  it("asks for it to be typed twice, and the same", () => {
    expect(validateNewPassword("long-enough-1", "")).toBe("Type the password again to confirm it.");
    expect(validateNewPassword("long-enough-1", "long-enough-2")).toBe("The two passwords do not match.");
  });
});
