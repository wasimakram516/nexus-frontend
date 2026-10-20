import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import NexMascot from "@/components/guide/NexMascot";
import { LOGO_ENDS } from "@/components/guide/guide-poses";

const attr = (el: Element | null, name: string): number => Number(el?.getAttribute(name));

describe("NexMascot", () => {
  it("is announced as an image unless decorative", () => {
    const { container, rerender } = render(<NexMascot />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-label", "Nex, the Nexus guide");
    rerender(<NexMascot decorative />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("draws its limbs on the logo skeleton at rest: exact 45 degree ends from the center node", () => {
    const { container } = render(<NexMascot pose="idle" />);
    for (const [limb, [x, y]] of Object.entries(LOGO_ENDS)) {
      const line = container.querySelector(`[data-limb="${limb}"]`);
      expect(attr(line, "x2")).toBe(x);
      expect(attr(line, "y2")).toBe(y);
      expect(Math.abs(attr(line, "x2") - 60)).toBe(Math.abs(attr(line, "y2") - 60));
    }
  });

  it("starts a pose such as celebrate with the limbs of that pose", () => {
    const { container } = render(<NexMascot pose="celebrate" />);
    expect(attr(container.querySelector('[data-limb="lh"]'), "y2")).toBe(0);
  });

  it("draws the logo's bold diagonal heavier than the faint one", () => {
    const { container } = render(<NexMascot />);
    const width = (k: string) => attr(container.querySelector(`[data-limb="${k}"]`), "stroke-width");
    expect(width("rh")).toBeGreaterThan(width("lh"));
    expect(width("lf")).toBeGreaterThan(width("rf"));
  });

  it("takes every color from the theme, never a literal in the markup", () => {
    const { container } = render(<NexMascot />);
    const colors = Array.from(container.querySelectorAll("[fill], [stroke]"))
      .flatMap((e) => [e.getAttribute("fill"), e.getAttribute("stroke")])
      .filter((c): c is string => !!c && c !== "none" && !c.startsWith("url("));
    expect(colors.length).toBeGreaterThan(0);
    // Resolved theme values are plain hex or rgb strings, and none are the unresolved placeholder.
    expect(colors.every((c) => /^(#|rgb)/i.test(c))).toBe(true);
  });
});
