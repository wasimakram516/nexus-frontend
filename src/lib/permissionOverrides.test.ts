import { describe, expect, it } from "vitest";
import {
  cleanOverrides,
  countAllowed,
  countCustomized,
  countStoredOverrides,
  isCustomized,
  isEffective,
  setPermission,
  setPermissionForFeatures,
  type PermissionMap,
} from "./permissionOverrides";

const base: PermissionMap = { students: { read: true, update: true }, fees: { read: true } };
const catalog = [
  { key: "students", label: "Students", module: "PEOPLE", actions: ["create", "read", "update", "delete"] },
  { key: "fees", label: "Fees", module: "FINANCE", actions: ["read", "update"] },
] as never[];

describe("permissionOverrides", () => {
  it("follows the base when there is no personal change", () => {
    expect(isEffective(base, {}, "students", "read")).toBe(true);
    expect(isEffective(base, {}, "students", "delete")).toBe(false);
  });

  it("lets a personal change win over the base", () => {
    expect(isEffective(base, { students: { read: "deny" } }, "students", "read")).toBe(false);
    expect(isEffective(base, { students: { delete: "allow" } }, "students", "delete")).toBe(true);
  });

  it("only calls a setting customized when it differs from the base", () => {
    expect(isCustomized(base, { students: { read: "allow" } }, "students", "read")).toBe(false);
    expect(isCustomized(base, { students: { read: "deny" } }, "students", "read")).toBe(true);
  });

  it("stores only the difference from the base when a permission is set", () => {
    const added = setPermission(base, {}, "students", "delete", true);
    expect(added).toEqual({ students: { delete: "allow" } });

    const removed = setPermission(base, {}, "students", "read", false);
    expect(removed).toEqual({ students: { read: "deny" } });

    // Putting it back to what the role gives leaves nothing behind.
    expect(setPermission(base, removed, "students", "read", true)).toEqual({});
  });

  it("sets one action across the features that offer it", () => {
    const next = setPermissionForFeatures(base, {}, catalog as never, "update", true);
    // students.update is already granted by the role, fees.update is the only change.
    expect(next).toEqual({ fees: { update: "allow" } });
  });

  it("drops changes that match the base when cleaning", () => {
    const cleaned = cleanOverrides(base, {
      students: { read: "allow", delete: "allow" },
      fees: { read: "allow" },
    });
    expect(cleaned).toEqual({ students: { delete: "allow" } });
  });

  it("counts stored changes including removals", () => {
    expect(countStoredOverrides({ students: { read: "deny" }, fees: { read: "allow" } })).toBe(2);
    expect(countStoredOverrides({})).toBe(0);
  });

  it("counts customized permissions and the final allowed total", () => {
    const overrides = { students: { delete: "allow", read: "deny" } } as never;
    expect(countCustomized(base, overrides)).toBe(2);
    // students: create no, read denied, update yes, delete allowed -> 2; fees: read yes, update no -> 1
    expect(countAllowed(base, overrides, catalog as never)).toEqual({ allowed: 3, total: 6 });
  });
});
