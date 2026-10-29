import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  showMessage: vi.fn(),
  previewPlanChange: vi.fn(),
  changePlan: vi.fn(),
}));

vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/platform.service", () => ({
  platformService: { previewPlanChange: mocks.previewPlanChange, changePlan: mocks.changePlan },
}));

import PlanChangeDialog, { type PlanChangePreview } from "./PlanChangeDialog";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

const plans = [
  { id: "p1", key: "starter", name: "Starter" },
  { id: "p2", key: "growth", name: "Growth" },
  { id: "p3", key: "old", name: "Old", isActive: false },
];

const upgrade: PlanChangePreview = {
  currentPlan: { id: "p1", key: "starter", name: "Starter" },
  targetPlan: { id: "p2", key: "growth", name: "Growth" },
  direction: "UPGRADE",
  modules: { enable: ["REPORTING"], disable: [], unchanged: ["ACADEMICS"] },
  limits: [
    { key: "maxCampuses", label: "campuses", current: 1, allowed: 3, ok: true },
    { key: "maxStudents", label: "students", current: 120, allowed: null, ok: true },
  ],
  price: { currency: "PKR", current: 12000, next: 35000 },
  blockers: [],
  canApply: true,
};

const renderDialog = (overrides: { onChanged?: () => void; onClose?: () => void } = {}) =>
  render(
    <PlanChangeDialog
      institutionId="i1"
      currentPlanId="p1"
      plans={plans}
      onClose={overrides.onClose ?? vi.fn()}
      onChanged={overrides.onChanged ?? vi.fn()}
    />,
  );

const choosePlan = async (name: string) => {
  const user = userEvent.setup();
  await user.click(screen.getByLabelText("Move to"));
  await user.click(await screen.findByRole("option", { name }));
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.previewPlanChange.mockImplementation(() => ok(upgrade));
  mocks.changePlan.mockImplementation(() => ok());
});

describe("PlanChangeDialog", () => {
  it("offers only the other plans that are still on sale", async () => {
    renderDialog();
    await userEvent.setup().click(screen.getByLabelText("Move to"));

    expect(await screen.findByRole("option", { name: "Growth" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Starter" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Old" })).not.toBeInTheDocument();
  });

  it("shows what the change would do before anything is saved", async () => {
    renderDialog();
    await choosePlan("Growth");

    expect(await screen.findByText("Starter to Growth")).toBeInTheDocument();
    expect(screen.getByText("Upgrade")).toBeInTheDocument();
    expect(mocks.previewPlanChange).toHaveBeenCalledWith("i1", { planId: "p2" });
    expect(screen.getByText("Reporting")).toBeInTheDocument();
    expect(screen.getByText("1 now, 3 allowed")).toBeInTheDocument();
    expect(screen.getByText("120 now, no limit")).toBeInTheDocument();
    expect(screen.getByLabelText("Agreed price from now on")).toHaveValue(35000);
    expect(mocks.changePlan).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Change plan" })).toBeEnabled();
  });

  it("changes the plan with the agreed price, then reports it", async () => {
    const onChanged = vi.fn();
    renderDialog({ onChanged });
    await choosePlan("Growth");
    const price = await screen.findByLabelText("Agreed price from now on");
    fireEvent.change(price, { target: { value: "30000" } });

    fireEvent.click(screen.getByRole("button", { name: "Change plan" }));

    await waitFor(() => expect(mocks.changePlan).toHaveBeenCalledWith("i1", { planId: "p2", agreedPrice: 30000 }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(mocks.showMessage).toHaveBeenCalledWith("Plan changed to Growth.", "success");
  });

  it("warns that a downgrade switches modules off, and says their data is kept", async () => {
    mocks.previewPlanChange.mockImplementation(() =>
      ok({
        ...upgrade,
        direction: "DOWNGRADE",
        modules: { enable: [], disable: ["REPORTING", "EXAMINATIONS"], unchanged: [] },
      }),
    );
    renderDialog();
    await choosePlan("Growth");

    expect(await screen.findByText("Downgrade")).toBeInTheDocument();
    expect(screen.getByText("Examinations")).toBeInTheDocument();
    expect(screen.getByText(/Their data is kept/)).toBeInTheDocument();
  });

  it("cannot be confirmed when the school does not fit the plan, and says why", async () => {
    mocks.previewPlanChange.mockImplementation(() =>
      ok({
        ...upgrade,
        limits: [{ key: "maxCampuses", label: "campuses", current: 3, allowed: 1, ok: false }],
        blockers: ["The institution has 3 campuses, and the Growth plan allows 1."],
        canApply: false,
      }),
    );
    renderDialog();
    await choosePlan("Growth");

    expect(await screen.findByText(/has 3 campuses, and the Growth plan allows 1/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change plan" })).toBeDisabled();
    expect(mocks.changePlan).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and says why when the change is refused", async () => {
    mocks.changePlan.mockRejectedValue(new Error("This plan change cannot be made."));
    const onChanged = vi.fn();
    renderDialog({ onChanged });
    await choosePlan("Growth");
    await screen.findByText("Starter to Growth");

    fireEvent.click(screen.getByRole("button", { name: "Change plan" }));

    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("This plan change cannot be made.", "error"));
    expect(onChanged).not.toHaveBeenCalled();
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Change plan" })).toBeEnabled();
  });

  it("can be cancelled without changing anything", () => {
    const onClose = vi.fn();
    renderDialog({ onClose });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
    expect(mocks.changePlan).not.toHaveBeenCalled();
  });
});
