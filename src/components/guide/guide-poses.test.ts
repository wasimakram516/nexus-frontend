import { describe, expect, it } from "vitest";
import { CENTER, LIMBS, LOGO_ENDS, MAIN_LIMBS, POSES, limbLength } from "@/components/guide/guide-poses";

describe("Nex geometry", () => {
  it("matches the logo: every rest limb leaves the center at exactly 45 degrees", () => {
    for (const limb of LIMBS) {
      const [x, y] = LOGO_ENDS[limb];
      expect(Math.abs(x - CENTER)).toBe(Math.abs(y - CENTER));
    }
  });

  it("keeps all four limbs the same length, like the logo", () => {
    const lengths = LIMBS.map((l) => limbLength(LOGO_ENDS[l]));
    expect(new Set(lengths.map((n) => n.toFixed(6))).size).toBe(1);
  });

  it("puts the logo's bold diagonal on the bottom-left foot and top-right hand", () => {
    expect([...MAIN_LIMBS].sort()).toEqual(["lf", "rh"]);
    expect(LOGO_ENDS.rh[0]).toBeGreaterThan(CENTER);
    expect(LOGO_ENDS.rh[1]).toBeLessThan(CENTER);
    expect(LOGO_ENDS.lf[0]).toBeLessThan(CENTER);
    expect(LOGO_ENDS.lf[1]).toBeGreaterThan(CENTER);
  });

  it("uses the logo skeleton for both rest poses, and folds the face into the node for the logo pose", () => {
    expect(POSES.idle.limbs).toBe(LOGO_ENDS);
    expect(POSES.logo.limbs).toBe(LOGO_ENDS);
    expect(POSES.logo.face).toBeLessThan(0.5);
    expect(POSES.idle.face ?? 1).toBe(1);
  });

  it("defines every pose with an end point for each limb", () => {
    for (const pose of Object.values(POSES)) {
      for (const limb of LIMBS) expect(pose.limbs[limb]).toHaveLength(2);
    }
  });
});
