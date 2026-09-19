import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  showMessage: vi.fn(),
  getModuleCatalog: vi.fn(),
  updateEntitlements: vi.fn(),
  getPlans: vi.fn(),
  updateSubscription: vi.fn(),
}));

vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/roles.service", () => ({ rolesService: { getModuleCatalog: mocks.getModuleCatalog } }));
vi.mock("@/services/platform.service", () => ({
  platformService: {
    updateEntitlements: mocks.updateEntitlements,
    getPlans: mocks.getPlans,
    updateSubscription: mocks.updateSubscription,
  },
}));

import InstitutionEntitlementsTab from "./InstitutionEntitlementsTab";
import InstitutionSubscriptionTab from "./InstitutionSubscriptionTab";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getModuleCatalog.mockImplementation(() =>
    ok([
      { key: "ACADEMICS", label: "Academics", description: "Levels and classes" },
      { key: "FINANCE", label: "Finance", description: "Fees and payroll" },
    ]),
  );
  mocks.updateEntitlements.mockImplementation(() => ok());
  mocks.getPlans.mockImplementation(() => ok([{ id: "p1", key: "STARTER", name: "Starter" }, { id: "p2", key: "PRO", name: "Pro" }]));
  mocks.updateSubscription.mockImplementation(() => ok());
});

describe("InstitutionEntitlementsTab", () => {
  const runtime = { modules: { ACADEMICS: { enabled: true }, FINANCE: { enabled: false } } };

  it("lists catalog modules with their enabled state and count", async () => {
    render(<InstitutionEntitlementsTab institutionId="i1" runtimeConfig={runtime} />);
    expect(await screen.findByText("1 of 2 modules enabled.")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(screen.getByText("Fees and payroll")).toBeInTheDocument();
  });

  it("saves the toggled entitlements for every catalog module", async () => {
    const onSaved = vi.fn();
    render(<InstitutionEntitlementsTab institutionId="i1" runtimeConfig={runtime} onSaved={onSaved} />);
    await screen.findByText("1 of 2 modules enabled.");
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const dialog = await screen.findByRole("dialog");
    const switches = within(dialog).getAllByRole("switch");
    expect(switches[0]).toBeChecked();
    expect(switches[1]).not.toBeChecked();
    fireEvent.click(switches[0]);
    fireEvent.click(switches[1]);
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.updateEntitlements).toHaveBeenCalledWith("i1", {
      entitlements: [
        { moduleKey: "ACADEMICS", isEnabled: false },
        { moduleKey: "FINANCE", isEnabled: true },
      ],
    }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("stays open and does not call onSaved when the save fails", async () => {
    mocks.updateEntitlements.mockRejectedValue(new Error("nope"));
    const onSaved = vi.fn();
    render(<InstitutionEntitlementsTab institutionId="i1" runtimeConfig={null} onSaved={onSaved} />);
    await screen.findByText("0 of 2 modules enabled.");
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("nope", "error"));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("InstitutionSubscriptionTab", () => {
  const trial = {
    subscription: { status: "TRIAL", planId: "p1", planName: "Starter", startsAt: "2026-01-01T00:00:00Z", endsAt: "2999-01-01T00:00:00Z", autoRenew: false, agreedPrice: 5000, currency: "PKR", billingCycle: "MONTHLY", pricingNotes: "friends and family" },
  };

  it("prompts to assign a plan when there is no subscription", async () => {
    render(<InstitutionSubscriptionTab institutionId="i1" runtimeConfig={null} />);
    expect(screen.getByText(/No subscription yet/)).toBeInTheDocument();
    expect(screen.queryByText(/Convert Trial/)).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.getPlans).toHaveBeenCalled());
  });

  it("shows subscription details, pricing and trial chip", async () => {
    render(<InstitutionSubscriptionTab institutionId="i1" runtimeConfig={trial} />);
    expect(screen.getByText("TRIAL")).toBeInTheDocument();
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText(/Trial ends/)).toBeInTheDocument();
    expect(screen.getByText("PKR 5000")).toBeInTheDocument();
    expect(screen.getByText("friends and family")).toBeInTheDocument();
    await waitFor(() => expect(mocks.getPlans).toHaveBeenCalled());
  });

  it("flags an expired trial", async () => {
    render(<InstitutionSubscriptionTab institutionId="i1" runtimeConfig={{ subscription: { ...trial.subscription, endsAt: "2020-01-01T00:00:00Z" } }} />);
    expect(screen.getByText(/Trial expired/)).toBeInTheDocument();
    await waitFor(() => expect(mocks.getPlans).toHaveBeenCalled());
  });

  it("converts a trial to a one-year active subscription on the current plan", async () => {
    const onSaved = vi.fn();
    render(<InstitutionSubscriptionTab institutionId="i1" runtimeConfig={trial} onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("button", { name: /Convert Trial/ }));
    await waitFor(() => expect(mocks.updateSubscription).toHaveBeenCalledTimes(1));
    const [id, payload] = mocks.updateSubscription.mock.calls[0];
    expect(id).toBe("i1");
    expect(payload).toMatchObject({ planId: "p1", status: "ACTIVE", autoRenew: false });
    const days = (new Date(payload.endsAt).getTime() - new Date(payload.startsAt).getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(365);
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("hides the convert action for non-trial subscriptions", async () => {
    render(<InstitutionSubscriptionTab institutionId="i1" runtimeConfig={{ subscription: { ...trial.subscription, status: "ACTIVE" } }} />);
    expect(screen.queryByText(/Convert Trial/)).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.getPlans).toHaveBeenCalled());
  });

  it("edits a subscription, sending only the filled optional fields", async () => {
    render(<InstitutionSubscriptionTab institutionId="i1" runtimeConfig={{ subscription: { status: "ACTIVE", planId: "p1", autoRenew: true } }} />);
    await waitFor(() => expect(mocks.getPlans).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Agreed Price"), { target: { value: "7000" } });
    fireEvent.change(within(dialog).getByLabelText("Currency"), { target: { value: "USD" } });
    fireEvent.change(within(dialog).getByLabelText("Ends At"), { target: { value: "2027-05-01" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.updateSubscription).toHaveBeenCalled());
    const [, payload] = mocks.updateSubscription.mock.calls[0];
    expect(payload).toEqual({
      planId: "p1", status: "ACTIVE", autoRenew: true, agreedPrice: 7000, currency: "USD",
      endsAt: new Date("2027-05-01").toISOString(),
    });
  });

  it("warns and does not save when no plan is selected", async () => {
    render(<InstitutionSubscriptionTab institutionId="i1" runtimeConfig={{ subscription: { status: "ACTIVE" } }} />);
    await waitFor(() => expect(mocks.getPlans).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled();
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
  });

  it("keeps the dialog open when saving fails", async () => {
    mocks.updateSubscription.mockRejectedValue(new Error("bad plan"));
    render(<InstitutionSubscriptionTab institutionId="i1" runtimeConfig={trial} />);
    await waitFor(() => expect(mocks.getPlans).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /^Edit/ }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("bad plan", "error"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
