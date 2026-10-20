import { describe, expect, it } from "vitest";
import { ABOVE_GUIDE, GUIDE_OFFSET, GUIDE_SIZE, PANEL_ABOVE_GUIDE_BOTTOM } from "@/theme/layout";

describe("corner layout", () => {
  it("stacks the scroll-to-top button above Nex so they never overlap", () => {
    expect(ABOVE_GUIDE.bottom).toBeGreaterThanOrEqual(GUIDE_OFFSET + GUIDE_SIZE);
  });

  it("centers the small button over Nex, inside the screen", () => {
    expect(ABOVE_GUIDE.right).toBe(GUIDE_OFFSET + GUIDE_SIZE / 2 - 20);
    expect(ABOVE_GUIDE.right).toBeGreaterThan(0);
  });

  it("opens the chat panel above Nex, not over it", () => {
    expect(PANEL_ABOVE_GUIDE_BOTTOM).toBeGreaterThanOrEqual(GUIDE_OFFSET + GUIDE_SIZE);
  });
});
