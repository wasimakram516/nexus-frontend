import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/link", () => ({ default: ({ children, href, style }: { children: React.ReactNode; href: string; style?: object }) => <a href={href} style={style}>{children}</a> }));
vi.mock("@/components/shared/PageBreadcrumbs", () => ({ default: () => <nav>crumbs</nav> }));
vi.mock("@/components/public/FaqAccordion", () => ({ default: () => <div>faq</div> }));

import PricingClient from "./PricingClient";
import PricingPage from "@/app/(public)/pricing/page";

const plan = (over: Record<string, unknown>) => ({
  id: "p", key: "starter", name: "Starter", description: "For small schools", basePrice: "5000", currency: "PKR",
  billingCycle: "MONTHLY", setupFee: null, defaultModules: ["ACADEMICS", "PEOPLE"], limits: { maxCampuses: 1 },
  deploymentModes: ["SHARED_HOSTED"], isActive: true, ...over,
});

const plans = [
  plan({ id: "1" }),
  plan({ id: "2", key: "growth", name: "Growth", basePrice: 12000, defaultModules: ["FINANCE", "CUSTOM_KEY"], limits: { maxCampuses: 5 } }),
  plan({ id: "3", key: "enterprise", name: "Enterprise", basePrice: null, billingCycle: "CUSTOM", defaultModules: [], limits: {}, deploymentModes: ["SELF_HOSTED"] }),
  plan({ id: "4", key: "flagged", name: "Flagged", basePrice: 3000, billingCycle: "CUSTOM", metadata: { popular: true } }),
];

const card = (name: string) =>
  screen.getAllByText(name).find((el) => el.classList.contains("MuiTypography-overline"))!.closest(".MuiCard-root") as HTMLElement;

describe("PricingClient", () => {
  it("renders each plan with monthly price, annual savings hint, campus limits and module labels", () => {
    render(<PricingClient apiPlans={plans} />);
    const starter = within(card("Starter"));
    expect(starter.getByText("PKR 5,000")).toBeInTheDocument();
    expect(starter.getByText("/mo")).toBeInTheDocument();
    expect(starter.getByText(/Save with annual - PKR 48,000\/yr/)).toBeInTheDocument();
    expect(starter.getByText("Up to 1 campus")).toBeInTheDocument();
    expect(starter.getByText("Academics")).toBeInTheDocument();
    expect(starter.getByText("People Management")).toBeInTheDocument();
    expect(starter.getByText("SHARED HOSTED")).toBeInTheDocument();
    const growth = within(card("Growth"));
    expect(growth.getByText("Up to 5 campuses")).toBeInTheDocument();
    expect(growth.getByText("CUSTOM_KEY")).toBeInTheDocument();
    expect(growth.getByText("Most Popular")).toBeInTheDocument();
  });

  it("shows custom pricing and unlimited campuses when there is no base price", () => {
    render(<PricingClient apiPlans={plans} />);
    const enterprise = within(card("Enterprise"));
    expect(enterprise.getByText("Custom")).toBeInTheDocument();
    expect(enterprise.getByText("Unlimited campuses")).toBeInTheDocument();
    expect(enterprise.getByRole("link")).toHaveAttribute("href", "/contact");
    expect(enterprise.getByRole("button", { name: /Contact Sales/ })).toBeInTheDocument();
  });

  it("routes priced monthly plans to signup and CUSTOM-billing plans to sales", () => {
    render(<PricingClient apiPlans={plans} />);
    expect(within(card("Starter")).getByRole("link")).toHaveAttribute("href", "/signup");
    expect(within(card("Starter")).getByRole("button", { name: /Start Free Trial/ })).toBeInTheDocument();
    expect(within(card("Flagged")).getByRole("link")).toHaveAttribute("href", "/contact");
    expect(within(card("Flagged")).getByText("Most Popular")).toBeInTheDocument();
  });

  it("switches to annual pricing with a 20 percent discount and back", () => {
    render(<PricingClient apiPlans={plans} />);
    fireEvent.click(screen.getByRole("button", { name: /^Annual/ }));
    const starter = within(card("Starter"));
    expect(starter.getByText("PKR 48,000")).toBeInTheDocument();
    expect(starter.getByText("/yr")).toBeInTheDocument();
    expect(starter.getByText("20% off annually")).toBeInTheDocument();
    expect(within(card("Growth")).getByText("PKR 115,200")).toBeInTheDocument();
    expect(within(card("Enterprise")).getByText("Custom")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    expect(within(card("Starter")).getByText("PKR 5,000")).toBeInTheDocument();
    expect(screen.queryByText("20% off annually")).not.toBeInTheDocument();
  });

  it("renders with no plans", () => {
    render(<PricingClient apiPlans={[]} />);
    expect(screen.queryByText("Most Popular")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Monthly" })).toBeInTheDocument();
    expect(screen.getByText(/Pricing plans are not available right now/)).toBeInTheDocument();
  });
});

describe("Pricing page (server)", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  const load = async () => {
    const element = (await PricingPage()) as { props: { apiPlans: unknown[] } };
    return element.props.apiPlans;
  };

  it("loads plans from the versioned platform endpoint without caching", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ data: [{ id: "x" }] }) }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await load()).toEqual([{ id: "x" }]);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4000/api/v1/platform/plans", { cache: "no-store" });
  });

  it("falls back to no plans on a non-OK response, a bad payload or a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    expect(await load()).toEqual([]);
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({}) })));
    expect(await load()).toEqual([]);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await load()).toEqual([]);
  });
});
