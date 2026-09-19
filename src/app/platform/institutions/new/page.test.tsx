import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  showMessage: vi.fn(),
  createInstitution: vi.fn(),
  updateSubscription: vi.fn(),
  updateBranding: vi.fn(),
  updateEntitlements: vi.fn(),
  register: vi.fn(),
  createCampus: vi.fn(),
  getModuleCatalog: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/platform.service", () => ({
  platformService: {
    createInstitution: mocks.createInstitution,
    updateSubscription: mocks.updateSubscription,
    updateBranding: mocks.updateBranding,
    updateEntitlements: mocks.updateEntitlements,
  },
}));
vi.mock("@/services/auth.service", () => ({ authService: { register: mocks.register } }));
vi.mock("@/services/campuses.service", () => ({ campusesService: { create: mocks.createCampus } }));
vi.mock("@/services/roles.service", () => ({ rolesService: { getModuleCatalog: mocks.getModuleCatalog } }));

import NewInstitutionWizard from "./page";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

const plan = {
  id: "plan-1", key: "STARTER", name: "Starter", description: "Small schools", basePrice: "5000", currency: "PKR",
  billingCycle: "MONTHLY", setupFee: "1000", defaultModules: ["ACADEMICS", "PEOPLE"], limits: { maxCampuses: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getModuleCatalog.mockImplementation(() =>
    ok([
      { key: "ACADEMICS", label: "Academics", description: "Levels" },
      { key: "PEOPLE", label: "People", description: "Profiles" },
      { key: "FINANCE", label: "Finance", description: "Fees" },
    ]),
  );
  mocks.createInstitution.mockImplementation(() => ok({ id: "inst-1", slug: "green-school" }));
  mocks.updateSubscription.mockImplementation(() => ok());
  mocks.updateBranding.mockImplementation(() => ok());
  mocks.updateEntitlements.mockImplementation(() => ok());
  mocks.register.mockImplementation(() => ok());
  mocks.createCampus.mockImplementation(() => ok());
  vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => ({ data: [plan] }) })));
});

const continueBtn = () => screen.getByRole("button", { name: /Continue/ });

describe("New institution wizard", () => {
  it("derives the slug from the name and gates Continue on name and slug", async () => {
    render(<NewInstitutionWizard />);
    expect(continueBtn()).toBeDisabled();
    expect(screen.getByRole("button", { name: /Back/ })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Institution Name/), { target: { value: "Green Valley School!" } });
    expect(screen.getByLabelText(/Slug/)).toHaveValue("green-valley-school");
    expect(continueBtn()).toBeEnabled();
    fireEvent.change(screen.getByLabelText(/Slug/), { target: { value: "" } });
    expect(continueBtn()).toBeDisabled();
  });

  it("requires admin name, email and an 8+ char password unless skipped", () => {
    render(<NewInstitutionWizard />);
    fireEvent.change(screen.getByLabelText(/Institution Name/), { target: { value: "Green" } });
    fireEvent.click(continueBtn());
    expect(screen.getByText("Institution Administrator")).toBeInTheDocument();
    expect(continueBtn()).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "Ann" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "ann@x.io" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "short" } });
    expect(continueBtn()).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "longenough" } });
    expect(continueBtn()).toBeEnabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.queryByLabelText(/Full Name/)).not.toBeInTheDocument();
    expect(continueBtn()).toBeEnabled();
  });

  it("persists a draft and restores it (step and data) on remount", async () => {
    const first = render(<NewInstitutionWizard />);
    fireEvent.change(screen.getByLabelText(/Institution Name/), { target: { value: "Draft School" } });
    fireEvent.click(continueBtn());
    first.unmount();
    render(<NewInstitutionWizard />);
    expect(await screen.findByText("Institution Administrator")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByLabelText(/Institution Name/)).toHaveValue("Draft School");
  });

  it("ignores a corrupt draft", () => {
    sessionStorage.setItem("nexus-wizard-draft", "{nope");
    render(<NewInstitutionWizard />);
    expect(screen.getByText(/Step 1 of 7/)).toBeInTheDocument();
  });

  /** Walks the wizard to the review step with a plan chosen and a campus filled. */
  async function walkToReview(opts: { skipAdmin?: boolean; skipCampus?: boolean } = {}) {
    render(<NewInstitutionWizard />);
    fireEvent.change(screen.getByLabelText(/Institution Name/), { target: { value: "Green School" } });
    fireEvent.change(screen.getByLabelText(/Contact Email/), { target: { value: "hi@green.io" } });
    fireEvent.click(continueBtn());
    if (opts.skipAdmin) {
      fireEvent.click(screen.getByRole("checkbox"));
    } else {
      fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "Ann Admin" } });
      fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "ann@green.io" } });
      fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "supersecret" } });
    }
    fireEvent.click(continueBtn());
    fireEvent.click(await screen.findByText("Small schools"));
    expect(screen.getByLabelText("Agreed Price")).toHaveValue(5000);
    fireEvent.change(screen.getByLabelText("Agreed Price"), { target: { value: "4500" } });
    fireEvent.click(continueBtn()); // branding
    fireEvent.click(continueBtn()); // modules
    expect(await screen.findByText("2 of 3 modules enabled")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Finance"));
    expect(screen.getByText("3 of 3 modules enabled")).toBeInTheDocument();
    fireEvent.click(continueBtn()); // campus
    if (opts.skipCampus) {
      fireEvent.click(screen.getByRole("switch"));
    } else {
      fireEvent.change(screen.getByLabelText(/Campus Name/), { target: { value: "Main" } });
      fireEvent.change(screen.getByLabelText(/Location/), { target: { value: "Lahore" } });
    }
    fireEvent.click(continueBtn()); // review
    return screen.findByRole("button", { name: "Create Institution" });
  }

  it("creates the institution, subscription, branding, entitlements, admin and campus with the entered data", async () => {
    const create = await walkToReview();
    fireEvent.click(create);
    expect(await screen.findByText(/Green School is ready!/)).toBeInTheDocument();

    expect(mocks.createInstitution).toHaveBeenCalledWith({
      name: "Green School", slug: "green-school", status: "ACTIVE", deploymentMode: "SHARED_HOSTED",
      contactEmail: "hi@green.io", planId: "plan-1",
    });
    expect(mocks.updateSubscription).toHaveBeenCalledWith("inst-1", {
      planId: "plan-1", status: "TRIAL", billingCycle: "MONTHLY", currency: "PKR", agreedPrice: 4500, setupFee: 1000,
    });
    expect(mocks.updateBranding).toHaveBeenCalledWith("inst-1", expect.objectContaining({ displayName: "Green School", logoUrl: null, theme: "default" }));
    expect(mocks.updateEntitlements).toHaveBeenCalledWith("inst-1", {
      entitlements: [
        { moduleKey: "ACADEMICS", isEnabled: true },
        { moduleKey: "PEOPLE", isEnabled: true },
        { moduleKey: "FINANCE", isEnabled: true },
      ],
    });
    expect(mocks.register).toHaveBeenCalledWith({
      name: "Ann Admin", email: "ann@green.io", password: "supersecret", role: "ADMIN", institutionId: "inst-1",
    });
    expect(mocks.createCampus).toHaveBeenCalledWith(expect.objectContaining({
      name: "Main", location: "Lahore", institutionId: "inst-1", lateThreshold: 15, earlyLeaveThreshold: 15,
      studentStartTime: "08:00", staffEndTime: "15:00",
    }));
    expect(sessionStorage.getItem("nexus-wizard-draft")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Manage Institution/ }));
    expect(mocks.push).toHaveBeenCalledWith("/platform/institutions/green-school/manage");
    fireEvent.click(screen.getByRole("button", { name: /View Details/ }));
    expect(mocks.push).toHaveBeenCalledWith("/platform/institutions/green-school");
  });

  it("reports skipped admin and campus steps without calling their services", async () => {
    const create = await walkToReview({ skipAdmin: true, skipCampus: true });
    fireEvent.click(create);
    await screen.findByText(/Green School is ready/);
    expect(mocks.register).not.toHaveBeenCalled();
    expect(mocks.createCampus).not.toHaveBeenCalled();
    expect(screen.getAllByText("Skipped")).toHaveLength(2);
  });

  it("flags follow-up steps that failed but still finishes with a warning", async () => {
    mocks.updateBranding.mockRejectedValue(new Error("brand fail"));
    mocks.register.mockRejectedValue(new Error("dup email"));
    const create = await walkToReview();
    fireEvent.click(create);
    expect(await screen.findByText(/is ready \(with warnings\)/)).toBeInTheDocument();
    expect(screen.getByText("Retry from the Branding tab.")).toBeInTheDocument();
    expect(screen.getByText("Admin account")).toBeInTheDocument();
    // silent mode only hides expected 403/404s, so real failures still toast
    expect(mocks.showMessage).toHaveBeenCalledWith("brand fail", "error");
  });

  it("stays on the review step and toasts when the institution itself cannot be created", async () => {
    mocks.createInstitution.mockRejectedValue(new Error("slug taken"));
    const create = await walkToReview();
    fireEvent.click(create);
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("slug taken", "error"));
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Create Institution" })).toBeEnabled();
  });
});
