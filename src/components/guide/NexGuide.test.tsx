import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NexGuide, { type GuideTip } from "@/components/guide/NexGuide";

const TIPS: GuideTip[] = [
  { pose: "wave", text: "Hi, I am Nex! First tip." },
  { pose: "point", text: "Second tip.", action: { label: "Ask Nexus AI", onClick: vi.fn() } },
];

/** People who prefer reduced motion get the full text instantly, which keeps these tests synchronous. */
function preferReducedMotion(): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

beforeEach(preferReducedMotion);
afterEach(() => vi.clearAllMocks());

describe("NexGuide", () => {
  it("shows the first tip and moves through the tips to the end", () => {
    render(<NexGuide tips={TIPS} />);
    expect(screen.getAllByText("Hi, I am Nex! First tip.").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Next tip" }));
    expect(screen.getAllByText("Second tip.").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByRole("button", { name: "Got it" })).not.toBeInTheDocument();
  });

  it("changes Nex's drawn pose when the tip changes", () => {
    const rightHandX = (): number => Number(document.querySelector('[data-limb="rh"]')?.getAttribute("x2"));
    render(<NexGuide tips={TIPS} />);
    const before = rightHandX(); // "wave" raises the right hand high
    fireEvent.click(screen.getByRole("button", { name: "Next tip" }));
    return waitFor(() => expect(rightHandX()).not.toBe(before)); // "point" stretches it out
  });

  it("runs a tip's action, such as handing over to Nexus AI", () => {
    render(<NexGuide tips={TIPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Next tip" }));
    fireEvent.click(screen.getByRole("button", { name: "Ask Nexus AI" }));
    expect(TIPS[1].action?.onClick).toHaveBeenCalledTimes(1);
  });

  it("announces the full tip to screen readers once", () => {
    render(<NexGuide tips={TIPS} />);
    expect(screen.getByRole("status")).toHaveTextContent("Hi, I am Nex! First tip.");
  });

  it("restarts from the first tip when the tips change, such as a new setup step", () => {
    const { rerender } = render(<NexGuide tips={TIPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Next tip" }));
    rerender(<NexGuide tips={[{ pose: "think", text: "A different step." }]} />);
    expect(screen.getAllByText("A different step.").length).toBeGreaterThan(0);
  });

  it("remembers a dismissal and parks as a Show guide pill that brings it back", () => {
    render(<NexGuide tips={TIPS} storageKey="test-guide" />);
    fireEvent.click(screen.getByRole("button", { name: "Hide guide" }));
    expect(localStorage.getItem("test-guide")).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: /Show guide/ }));
    expect(localStorage.getItem("test-guide")).toBeNull();
    expect(screen.getByRole("button", { name: "Next tip" })).toBeInTheDocument();
  });

  it("stays parked on the next visit when it was dismissed", () => {
    localStorage.setItem("test-guide", "1");
    render(<NexGuide tips={TIPS} storageKey="test-guide" />);
    expect(screen.getByRole("button", { name: /Show guide/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next tip" })).not.toBeInTheDocument();
  });

  it("shows the bubble once per session for a page, then leaves only the mascot", () => {
    const first = render(<NexGuide tips={TIPS} oncePerSession="/pricing" />);
    expect(screen.getByRole("button", { name: "Next tip" })).toBeInTheDocument();
    first.unmount();
    render(<NexGuide tips={TIPS} oncePerSession="/pricing" />);
    expect(screen.queryByRole("button", { name: "Next tip" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show tip from Nex" })).toBeInTheDocument();
  });

  it("works as the chat launcher: the mascot is the button, and hiding it leaves no Show guide pill", () => {
    const onMascotClick = vi.fn();
    render(<NexGuide tips={TIPS} storageKey="launcher" onMascotClick={onMascotClick} mascotLabel="Open Nexus AI chat" />);
    fireEvent.click(screen.getByRole("button", { name: "Open Nexus AI chat" }));
    expect(onMascotClick).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Hide guide" }));
    expect(screen.queryByRole("button", { name: /Show guide/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Nexus AI chat" })).toBeInTheDocument();
  });

  it("hides the bubble while quiet, for example when the chat panel is open", () => {
    render(<NexGuide tips={TIPS} quiet onMascotClick={() => {}} />);
    expect(screen.queryByRole("button", { name: "Next tip" })).not.toBeInTheDocument();
  });

  it("renders nothing when there are no tips", () => {
    const { container } = render(<NexGuide tips={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
