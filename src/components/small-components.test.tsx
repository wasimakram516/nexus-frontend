import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";

const state = vi.hoisted(() => ({
  showMessage: vi.fn(),
  runtime: {} as Record<string, unknown>,
  inView: false,
}));

vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: state.showMessage }) }));
vi.mock("@/contexts/RuntimeConfigContext", () => ({ useRuntimeConfig: () => state.runtime }));
vi.mock("framer-motion", () => ({ useInView: () => state.inView }));

import ContactForm from "./public/ContactForm";
import CountUp from "./shared/CountUp";
import ScrollToTop from "./shared/ScrollToTop";
import ModuleGate from "./dashboard/ModuleGate";
import TrialBanner from "./dashboard/TrialBanner";
import FeatureSectionNav from "./public/FeatureSectionNav";
import { proxy, config as proxyConfig } from "@/proxy";

beforeEach(() => {
  vi.clearAllMocks();
  state.inView = false;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ContactForm", () => {
  it("submits after a delay, confirms to the user and resets the form", async () => {
    vi.useFakeTimers();
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "Ali" } });
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: "ali@x.io" } });
    fireEvent.change(screen.getByLabelText(/^Message/), { target: { value: "Hello there" } });
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Pricing Question" }));
    fireEvent.click(screen.getByRole("button", { name: "Send Message" }));
    expect(screen.getByRole("button", { name: "" })).toBeDisabled();
    expect(state.showMessage).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(state.showMessage).toHaveBeenCalledWith("Message sent! We'll get back to you within 24 hours.", "success");
    expect(screen.getByLabelText(/Full Name/)).toHaveValue("");
    expect(screen.getByLabelText(/^Message/)).toHaveValue("");
  });
});

describe("CountUp", () => {
  it("renders non-numeric values as-is", () => {
    render(<CountUp value="Unlimited" />);
    expect(screen.getByText("Unlimited")).toBeInTheDocument();
  });

  it("stays at zero until scrolled into view", () => {
    render(<CountUp value="1,200+" />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("counts up to the target keeping prefix, separators and suffix", () => {
    vi.useFakeTimers();
    state.inView = true;
    render(<CountUp value="$1,200+" />);
    act(() => { vi.advanceTimersByTime(600); });
    const mid = screen.getByText(/^\$/).textContent!;
    expect(mid).not.toBe("$1,200+");
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText("$1,200+")).toBeInTheDocument();
  });
});

describe("ScrollToTop", () => {
  it("scrolls to the top when clicked", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", { value: scrollTo, configurable: true, writable: true });
    render(<ScrollToTop />);
    Object.defineProperty(window, "scrollY", { value: 900, configurable: true, writable: true });
    act(() => { window.dispatchEvent(new Event("scroll")); });
    fireEvent.click(screen.getByTestId("KeyboardArrowUpIcon").closest("button")!);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});

describe("ModuleGate", () => {
  const gate = () => render(<ModuleGate module="FINANCE"><div>secret finance</div></ModuleGate>);

  it("shows a spinner while loading", () => {
    state.runtime = { isLoading: true, isModuleEnabled: () => true, canViewModule: () => true };
    gate();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("secret finance")).not.toBeInTheDocument();
  });

  it("explains when the module is not in the plan", () => {
    state.runtime = { isLoading: false, isModuleEnabled: () => false, canViewModule: () => true };
    gate();
    expect(screen.getByText("Module not enabled")).toBeInTheDocument();
    expect(screen.getByText(/finance module is not part of your institution/)).toBeInTheDocument();
    expect(screen.queryByText("secret finance")).not.toBeInTheDocument();
  });

  it("denies users without view permission", () => {
    state.runtime = { isLoading: false, isModuleEnabled: () => true, canViewModule: () => false };
    gate();
    expect(screen.getByText("No access")).toBeInTheDocument();
    expect(screen.queryByText("secret finance")).not.toBeInTheDocument();
  });

  it("renders children when enabled and permitted", () => {
    state.runtime = { isLoading: false, isModuleEnabled: () => true, canViewModule: () => true };
    gate();
    expect(screen.getByText("secret finance")).toBeInTheDocument();
  });
});

describe("TrialBanner", () => {
  const trial = (over: Record<string, unknown> = {}, days: number | null = 5, full = false) => {
    state.runtime = {
      config: { subscription: { status: "TRIAL", endsAt: "2030-01-10T00:00:00Z", ...over }, trialFullAccess: full },
      trialDaysLeft: days,
    };
  };

  it("renders nothing for non-trial or missing subscriptions", () => {
    state.runtime = { config: { subscription: { status: "ACTIVE" } }, trialDaysLeft: null };
    const { container, rerender } = render(<TrialBanner />);
    expect(container).toBeEmptyDOMElement();
    state.runtime = { config: null, trialDaysLeft: null };
    rerender(<TrialBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows days left with the unlocked-modules message and an upgrade link", () => {
    trial({}, 5, true);
    render(<TrialBanner />);
    expect(screen.getByText(/Free trial — 5 days left/)).toBeInTheDocument();
    expect(screen.getByText(/All modules are unlocked/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade Now" }).getAttribute("href")).toMatch(/^mailto:nexus@wisemensoft\.com/);
  });

  it("uses the singular for one day and the standard upsell without full access", () => {
    trial({}, 1, false);
    render(<TrialBanner />);
    expect(screen.getByText(/1 day left/)).toBeInTheDocument();
    expect(screen.getByText(/Enjoying Nexus\?/)).toBeInTheDocument();
  });

  it("falls back to a generic message without a countdown", () => {
    trial({}, null);
    render(<TrialBanner />);
    expect(screen.getByText(/You are on a free trial\./)).toBeInTheDocument();
  });

  it("shows a locked error when the trial has ended", () => {
    trial({}, 0);
    render(<TrialBanner />);
    expect(screen.getByText(/Your free trial ended on/)).toBeInTheDocument();
    expect(screen.getByText(/Module access is locked/)).toBeInTheDocument();
  });
});

describe("proxy (route protection)", () => {
  const req = (path: string, cookie?: string) =>
    new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { cookie } } : undefined);

  it.each(["/dashboard", "/dashboard/people", "/platform/institutions"])("redirects unauthenticated visitors from %s to /login", (path) => {
    const res = proxy(req(path));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("lets authenticated visitors through", () => {
    const res = proxy(req("/dashboard", "isAuthenticated=true"));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("does not gate public routes", () => {
    expect(proxy(req("/pricing")).headers.get("location")).toBeNull();
  });

  it("matches only the protected areas", () => {
    expect(proxyConfig.matcher).toEqual(["/dashboard/:path*", "/platform/:path*"]);
  });
});

describe("FeatureSectionNav", () => {
  const items = [
    { id: "sec-a", label: "Alpha", number: 1 },
    { id: "sec-b", label: "Beta", number: 2 },
  ];
  let observed: Array<(entries: unknown[]) => void> = [];
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observed = [];
    scrollIntoView = vi.fn();
    class FakeObserver {
      constructor(cb: (entries: unknown[]) => void) { observed.push(cb); }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    for (const item of items) {
      const el = document.createElement("h2");
      el.id = item.id;
      el.scrollIntoView = scrollIntoView as unknown as typeof el.scrollIntoView;
      document.body.appendChild(el);
    }
    const boundary = document.createElement("div");
    boundary.id = "boundary";
    document.body.appendChild(boundary);
  });

  afterEach(() => {
    ["sec-a", "sec-b", "boundary"].forEach((id) => document.getElementById(id)?.remove());
    vi.unstubAllGlobals();
  });

  it("lists sections with the first active, and scrolls to a section on click and keyboard", () => {
    render(<FeatureSectionNav items={items} boundaryId="boundary" />);
    expect(screen.getByText("In this section")).toBeInTheDocument();
    const [first, second] = screen.getAllByRole("button");
    expect(first).toHaveAttribute("aria-current", "true");
    expect(second).not.toHaveAttribute("aria-current");
    fireEvent.click(second);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    scrollIntoView.mockClear();
    fireEvent.keyDown(first, { key: "Enter" });
    fireEvent.keyDown(second, { key: " " });
    fireEvent.keyDown(second, { key: "a" });
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("activates the section reported as most visible by the observer", () => {
    render(<FeatureSectionNav items={items} boundaryId="boundary" />);
    const target = document.getElementById("sec-b")!;
    act(() => {
      observed[0]([
        { isIntersecting: true, intersectionRatio: 0.2, target, boundingClientRect: { top: 50 } },
        { isIntersecting: false, intersectionRatio: 0.9, target: document.getElementById("sec-a"), boundingClientRect: { top: 0 } },
      ]);
    });
    expect(screen.getAllByRole("button")[1]).toHaveAttribute("aria-current", "true");
    expect(screen.getAllByRole("button")[0]).not.toHaveAttribute("aria-current");
  });

  it("activates the last section scrolled past the sticky offset", () => {
    render(<FeatureSectionNav items={items} boundaryId="boundary" />);
    document.getElementById("sec-a")!.getBoundingClientRect = () => ({ top: -300 }) as DOMRect;
    document.getElementById("sec-b")!.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    act(() => { window.dispatchEvent(new Event("scroll")); });
    expect(screen.getAllByRole("button")[1]).toHaveAttribute("aria-current", "true");
  });

  it("renders without observers when the sections are absent from the page", () => {
    render(<FeatureSectionNav items={[{ id: "missing", label: "Nope", number: 1 }]} boundaryId="nothing" />);
    expect(screen.getByText("Nope")).toBeInTheDocument();
    expect(observed).toHaveLength(0);
  });
});
