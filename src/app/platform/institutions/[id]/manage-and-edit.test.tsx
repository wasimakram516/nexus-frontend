import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  params: {} as Record<string, string>,
  showMessage: vi.fn(),
  getInstitution: vi.fn(),
  getRuntimeConfig: vi.fn(),
  updateInstitution: vi.fn(),
  updateSubscription: vi.fn(),
  updateBranding: vi.fn(),
  updateEntitlements: vi.fn(),
  updateSettings: vi.fn(),
  getCampuses: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }), useParams: () => mocks.params }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/platform.service", () => ({
  platformService: {
    getInstitution: mocks.getInstitution, getRuntimeConfig: mocks.getRuntimeConfig, updateInstitution: mocks.updateInstitution,
    updateSubscription: mocks.updateSubscription, updateBranding: mocks.updateBranding,
    updateEntitlements: mocks.updateEntitlements, updateSettings: mocks.updateSettings,
  },
}));
vi.mock("@/services/campuses.service", () => ({ campusesService: { getAll: mocks.getCampuses } }));
vi.mock("@/components/shared/PlatformBreadcrumbs", () => ({
  default: ({ crumbs }: { crumbs: Array<{ label: string }> }) => <nav>{crumbs.map((c) => c.label).join(" > ")}</nav>,
}));

// Wizard steps are covered on their own; here they are stubs that expose/modify the shared wizard data.
vi.mock("@/components/platform/wizard/StepBasicInfo", () => ({
  default: ({ data, update }: { data: { name: string; slug: string; contactEmail: string; notes: string }; update: (p: Record<string, unknown>) => void }) => (
    <div>
      basic {data.name}|{data.slug}|{data.contactEmail}|{data.notes}
      <button onClick={() => update({ name: "Renamed", contactEmail: "" })}>rename</button>
    </div>
  ),
}));
vi.mock("@/components/platform/wizard/StepPlan", () => ({ default: () => <div>plan-step</div> }));
vi.mock("@/components/platform/wizard/StepBranding", () => ({ default: ({ data }: { data: { displayName: string; primaryColorLight: string; theme: string } }) => <div>branding {data.displayName}|{data.primaryColorLight}|{data.theme}</div> }));
vi.mock("@/components/platform/wizard/StepModules", () => ({ default: ({ data }: { data: { modules: Record<string, boolean> } }) => <div>modules {JSON.stringify(data.modules)}</div> }));
vi.mock("@/components/platform/wizard/StepSettings", () => ({ default: ({ data }: { data: { settings: unknown[] } }) => <div>settings {JSON.stringify(data.settings)}</div> }));
vi.mock("@/components/platform/wizard/StepPermissions", () => ({ default: ({ institutionId }: { institutionId: string }) => <div>permissions {institutionId}</div> }));
vi.mock("@/components/platform/wizard/StepReview", () => ({
  default: ({ onSubmit, onBack, onCancel, submitting }: { onSubmit: () => void; onBack: () => void; onCancel: () => void; submitting: boolean }) => (
    <div>
      review {String(submitting)}
      <button onClick={onSubmit}>save-all</button>
      <button onClick={onBack}>review-back</button>
      <button onClick={onCancel}>review-cancel</button>
    </div>
  ),
}));
vi.mock("@/components/dashboard/AcademicsManager", () => ({ default: ({ institutionId }: { institutionId: string }) => <div>academics-manager {institutionId}</div> }));
vi.mock("@/components/dashboard/CampusesManager", () => ({ default: ({ institutionId }: { institutionId: string }) => <div>campuses-manager {institutionId}</div> }));
vi.mock("@/components/dashboard/AttendanceManager", () => ({ default: ({ institutionId }: { institutionId: string }) => <div>attendance-manager {institutionId}</div> }));
vi.mock("@/components/dashboard/CustomFieldsManager", () => ({ default: ({ institutionId }: { institutionId: string }) => <div>customfields-manager {institutionId}</div> }));
vi.mock("@/components/dashboard/FinanceManager", () => ({ default: ({ institutionId }: { institutionId: string }) => <div>finance-manager {institutionId}</div> }));
vi.mock("@/components/dashboard/NoticesManager", () => ({ default: ({ institutionId }: { institutionId: string }) => <div>notices-manager {institutionId}</div> }));
vi.mock("@/components/dashboard/PeopleManager", () => ({ default: ({ institutionId }: { institutionId: string }) => <div>people-manager {institutionId}</div> }));
vi.mock("@/components/dashboard/UsersManager", () => ({ default: ({ institutionId }: { institutionId: string }) => <div>users-manager {institutionId}</div> }));

import InstitutionManagePage from "./manage/page";
import ModulePage from "./manage/[module]/page";
import EditInstitutionWizard from "./edit/page";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });
const inst = { id: "uuid-1", name: "Green School", slug: "green-school", status: "ACTIVE", deploymentMode: "SHARED_HOSTED", contactEmail: "hi@g.io", contactPhone: "0300", notes: "n" };
const runtime = {
  modules: { PEOPLE: { enabled: true }, FINANCE: { enabled: false }, TIMETABLE: { enabled: true } },
  subscription: { status: "TRIAL", planId: "plan-1", planName: "Starter" },
  branding: { displayName: "Green", primaryColorLight: "#123456", theme: "ocean", logoUrl: null },
  settings: { max_students: { value: "40" }, flags: '{"value":"on"}', plain: "x", nested: { a: 1 } },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.params = { id: "green-school" };
  mocks.getInstitution.mockImplementation(() => ok(inst));
  mocks.getRuntimeConfig.mockImplementation(() => ok(runtime));
  mocks.getCampuses.mockImplementation(() => ok({ items: [], total: 3 }));
  for (const fn of [mocks.updateInstitution, mocks.updateSubscription, mocks.updateBranding, mocks.updateEntitlements, mocks.updateSettings]) {
    fn.mockImplementation(() => ok());
  }
});

describe("InstitutionManagePage", () => {
  it("shows banner stats and gates module cards on entitlements", async () => {
    render(<InstitutionManagePage />);
    expect(await screen.findByText("Green School")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // campuses
    expect(screen.getByText("2")).toBeInTheDocument(); // enabled modules from the full entitlement map (PEOPLE + TIMETABLE)
    expect(screen.getByText("trial")).toBeInTheDocument();
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText(/SHARED HOSTED · hi@g.io/)).toBeInTheDocument();
    expect(screen.getByText("Institutions > Green School > Manage")).toBeInTheDocument();
    // Finance is disabled, so it shows "Not enabled" and no navigation happens
    expect(screen.getAllByText("Not enabled").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Finance"));
    expect(mocks.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("People"));
    expect(mocks.push).toHaveBeenCalledWith("/platform/institutions/green-school/manage/people");
    // module-less entries (campuses/users/custom fields) are always available
    fireEvent.click(screen.getAllByText("Campuses")[1]);
    expect(mocks.push).toHaveBeenCalledWith("/platform/institutions/green-school/manage/campuses");
  });

  it("shows not-found when the institution is missing", async () => {
    mocks.getInstitution.mockRejectedValue(Object.assign(new Error("nf"), { response: { status: 404 } }));
    render(<InstitutionManagePage />);
    expect(await screen.findByText("Institution not found.")).toBeInTheDocument();
  });
});

describe("Manage module page", () => {
  it.each([
    ["campuses", "campuses-manager uuid-1"],
    ["people", "people-manager uuid-1"],
    ["academics", "academics-manager uuid-1"],
    ["attendance", "attendance-manager uuid-1"],
    ["finance", "finance-manager uuid-1"],
    ["users", "users-manager uuid-1"],
    ["custom-fields", "customfields-manager uuid-1"],
    ["notices", "notices-manager uuid-1"],
  ])("renders the %s manager scoped to the resolved institution UUID", async (module, text) => {
    mocks.params = { id: "green-school", module };
    render(<ModulePage />);
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it("shows a coming-soon card for modules without a manager", async () => {
    mocks.params = { id: "green-school", module: "reports" };
    render(<ModulePage />);
    expect(await screen.findByText(/coming soon/)).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
  });

  it("handles unknown modules gracefully", async () => {
    mocks.params = { id: "green-school", module: "mystery" };
    render(<ModulePage />);
    expect(await screen.findByText("mystery")).toBeInTheDocument();
    expect(screen.getByText(/coming soon/)).toBeInTheDocument();
  });
});

describe("EditInstitutionWizard", () => {
  it("preserves the real YEARLY billing cycle and non-PKR currency when billing is untouched", async () => {
    mocks.getInstitution.mockImplementation(() =>
      ok({ ...inst, subscriptions: [{ planId: "plan-1", billingCycle: "YEARLY", currency: "USD" }, { planId: "old", billingCycle: "MONTHLY", currency: "PKR" }] }));
    render(<EditInstitutionWizard />);
    await screen.findByText(/^basic/);
    fireEvent.click(screen.getByText("Review & Save"));
    fireEvent.click(screen.getByText("save-all"));
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
    expect(mocks.updateSubscription).toHaveBeenCalledWith("uuid-1", { planId: "plan-1", billingCycle: "YEARLY", currency: "USD" });
  });

  it("pre-fills the wizard from the institution and runtime config", async () => {
    render(<EditInstitutionWizard />);
    expect(await screen.findByText("basic Green School|green-school|hi@g.io|n")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 7 — Basic Info")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Branding"));
    expect(screen.getByText("branding Green|#123456|ocean")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Modules"));
    expect(screen.getByText('modules {"PEOPLE":true,"FINANCE":false,"TIMETABLE":true}')).toBeInTheDocument();
    fireEvent.click(screen.getByText("Settings"));
    expect(screen.getByText(/"key":"max_students","value":"40"/)).toBeInTheDocument();
    expect(screen.getByText(/"key":"flags","value":"on"/)).toBeInTheDocument();
    expect(screen.getByText(/"key":"plain","value":"x"/)).toBeInTheDocument();
    expect(screen.getByText(/"key":"nested"/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Permissions"));
    expect(screen.getByText("permissions uuid-1")).toBeInTheDocument();
  });

  it("saves every section with normalized payloads, then returns to the institution page", async () => {
    render(<EditInstitutionWizard />);
    await screen.findByText(/^basic/);
    fireEvent.click(screen.getByText("rename"));
    fireEvent.click(screen.getByText("Review & Save"));
    fireEvent.click(screen.getByText("save-all"));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/platform/institutions/green-school"));
    expect(mocks.updateInstitution).toHaveBeenCalledWith("uuid-1", {
      name: "Renamed", slug: "green-school", status: "ACTIVE", deploymentMode: "SHARED_HOSTED",
      contactEmail: null, contactPhone: "0300", primaryDomain: null, notes: "n",
    });
    expect(mocks.updateSubscription).toHaveBeenCalledWith("uuid-1", { planId: "plan-1", billingCycle: "MONTHLY", currency: "PKR" });
    expect(mocks.updateBranding).toHaveBeenCalledWith("uuid-1", expect.objectContaining({ displayName: "Green", logoUrl: null, primaryColorLight: "#123456", theme: "ocean" }));
    expect(mocks.updateEntitlements).toHaveBeenCalledWith("uuid-1", {
      entitlements: [
        { moduleKey: "PEOPLE", isEnabled: true },
        { moduleKey: "FINANCE", isEnabled: false },
        { moduleKey: "TIMETABLE", isEnabled: true },
      ],
    });
    expect(mocks.updateSettings).toHaveBeenCalledWith("uuid-1", {
      settings: expect.arrayContaining([{ key: "max_students", value: "40", description: "" }]),
    });
    expect(mocks.showMessage).toHaveBeenCalledWith("Institution updated successfully.", "success");
  });

  it("skips subscription, entitlement and settings writes when there is nothing to send", async () => {
    mocks.getRuntimeConfig.mockImplementation(() => ok({ branding: null, subscription: null, modules: {}, settings: {} }));
    render(<EditInstitutionWizard />);
    await screen.findByText(/^basic/);
    fireEvent.click(screen.getByText("Review & Save"));
    fireEvent.click(screen.getByText("save-all"));
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
    expect(mocks.updateEntitlements).not.toHaveBeenCalled();
    expect(mocks.updateSettings).not.toHaveBeenCalled();
    expect(mocks.updateBranding).toHaveBeenCalledWith("uuid-1", expect.objectContaining({ primaryColorLight: "#2C6B48", theme: "default" }));
  });

  it("navigates back, cancels to the institution, and steps through the wizard", async () => {
    render(<EditInstitutionWizard />);
    await screen.findByText(/^basic/);
    fireEvent.click(screen.getByText("Review & Save"));
    fireEvent.click(screen.getByText("review-cancel"));
    expect(mocks.push).toHaveBeenLastCalledWith("/platform/institutions/green-school");
    fireEvent.click(screen.getByText("review-back"));
    expect(screen.getByText("Step 6 of 7 — Permissions")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Green School"));
    expect(mocks.push).toHaveBeenLastCalledWith("/platform/institutions/green-school");
  });
});
