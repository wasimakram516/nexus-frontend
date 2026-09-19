import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  showMessage: vi.fn(),
  getModuleCatalog: vi.fn(),
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
}));

vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/roles.service", () => ({ rolesService: { getModuleCatalog: mocks.getModuleCatalog } }));
vi.mock("@/services/platform.service", () => ({ platformService: { createPlan: mocks.createPlan, updatePlan: mocks.updatePlan } }));

import PlansPage from "./page";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

const plans = [
  { id: "p1", key: "starter", name: "Starter", description: "For small schools", basePrice: 5000, currency: "PKR", billingCycle: "MONTHLY", setupFee: 1000, deploymentModes: ["SHARED_HOSTED"], defaultModules: ["ACADEMICS"], limits: { maxCampuses: 1 }, isActive: true },
  { id: "p2", key: "enterprise", name: "Enterprise", basePrice: null, currency: "PKR", billingCycle: "CUSTOM", deploymentModes: ["SELF_HOSTED", "DEDICATED_HOSTED"], defaultModules: [], limits: {}, isActive: false },
];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock = vi.fn(async () => ({ json: async () => ({ data: plans }) }));
  vi.stubGlobal("fetch", fetchMock);
  mocks.getModuleCatalog.mockImplementation(() => ok([{ key: "ACADEMICS" }, { key: "FINANCE" }]));
  mocks.createPlan.mockImplementation(() => ok());
  mocks.updatePlan.mockImplementation(() => ok());
});

describe("Plans page", () => {
  it("renders plan cards with price, custom pricing, status and limits", async () => {
    render(<PlansPage />);
    expect(await screen.findByText("Starter")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:4000/api/v1/platform/plans");
    expect(screen.getByText(/PKR 5,000/)).toBeInTheDocument();
    expect(screen.getByText("+ PKR 1,000 setup fee")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("1 modules · Max 1 campuses")).toBeInTheDocument();
    expect(screen.getByText("0 modules · Max ∞ campuses")).toBeInTheDocument();
    expect(screen.getByText("SELF HOSTED")).toBeInTheDocument();
  });

  it("creates a plan from the entered form and reloads the list", async () => {
    render(<PlansPage />);
    await screen.findByText("Starter");
    fireEvent.click(screen.getByRole("button", { name: /New Plan/ }));
    const dialog = await screen.findByRole("dialog");
    const create = within(dialog).getByRole("button", { name: "Create Plan" });
    expect(create).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText(/Plan Key/), { target: { value: "GROWTH" } });
    fireEvent.change(within(dialog).getByLabelText(/^Name/), { target: { value: "Growth" } });
    fireEvent.change(within(dialog).getByLabelText("Base Price"), { target: { value: "9000" } });
    fireEvent.click(within(dialog).getByText("SHARED HOSTED"));
    fireEvent.click(await within(dialog).findByText("FINANCE"));
    fireEvent.click(within(dialog).getByText("FINANCE")); // toggle back off
    fireEvent.click(within(dialog).getByText("ACADEMICS"));
    fireEvent.change(within(dialog).getByLabelText(/Limits/), { target: { value: '{"maxCampuses":5}' } });
    expect(create).toBeEnabled();
    fireEvent.click(create);
    await waitFor(() => expect(mocks.createPlan).toHaveBeenCalledWith({
      key: "growth", name: "Growth", description: "", basePrice: 9000, currency: "PKR", billingCycle: "MONTHLY",
      setupFee: undefined, deploymentModes: ["SHARED_HOSTED"], defaultModules: ["ACADEMICS"], limits: { maxCampuses: 5 }, isActive: true,
    }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("rejects invalid limits JSON without calling the API", async () => {
    render(<PlansPage />);
    await screen.findByText("Starter");
    fireEvent.click(screen.getByRole("button", { name: /New Plan/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Plan Key/), { target: { value: "x" } });
    fireEvent.change(within(dialog).getByLabelText(/^Name/), { target: { value: "X" } });
    fireEvent.change(within(dialog).getByLabelText(/Limits/), { target: { value: "{oops" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create Plan" }));
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("Invalid JSON in limits.", "error"));
    expect(mocks.createPlan).not.toHaveBeenCalled();
  });

  it("edits an existing plan with its key locked", async () => {
    render(<PlansPage />);
    await screen.findByText("Starter");
    fireEvent.click(screen.getAllByTestId("EditIcon")[0].closest("button")!);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/Plan Key/)).toBeDisabled();
    expect(within(dialog).getByLabelText(/Plan Key/)).toHaveValue("starter");
    fireEvent.change(within(dialog).getByLabelText(/^Name/), { target: { value: "Starter Plus" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mocks.updatePlan).toHaveBeenCalledWith("p1", expect.objectContaining({
      key: "starter", name: "Starter Plus", basePrice: 5000, setupFee: 1000, limits: { maxCampuses: 1 },
      deploymentModes: ["SHARED_HOSTED"], defaultModules: ["ACADEMICS"],
    })));
    expect(mocks.createPlan).not.toHaveBeenCalled();
  });
});
