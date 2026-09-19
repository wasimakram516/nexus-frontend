import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  showMessage: vi.fn(),
  getAll: vi.fn(),
  register: vi.fn(),
  updateInstitution: vi.fn(),
}));

vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/users.service", () => ({ usersService: { getAll: mocks.getAll } }));
vi.mock("@/services/auth.service", () => ({ authService: { register: mocks.register } }));
vi.mock("@/services/platform.service", () => ({ platformService: { updateInstitution: mocks.updateInstitution } }));
vi.mock("@/components/shared/RecordMetadataPopover", () => ({ default: () => null }));

import InstitutionOverviewTab from "./InstitutionOverviewTab";

const institution = {
  id: "inst-1", name: "Green School", slug: "green-school", status: "ACTIVE", deploymentMode: "SHARED_HOSTED",
  primaryDomain: "green.edu", contactEmail: "hi@green.edu", contactPhone: "0300", notes: "VIP client",
  createdAt: "2026-01-05T10:00:00Z",
};

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAll.mockImplementation(() => ok({ items: [] }));
  mocks.register.mockImplementation(() => ok());
  mocks.updateInstitution.mockImplementation(() => ok());
});

describe("InstitutionOverviewTab", () => {
  it("shows the institution details, deployment chips and notes", async () => {
    render(<InstitutionOverviewTab institution={institution} runtimeConfig={null} />);
    expect(screen.getByText("Green School")).toBeInTheDocument();
    expect(screen.getByText("green.edu")).toBeInTheDocument();
    expect(screen.getByText("SHARED HOSTED")).toBeInTheDocument();
    expect(screen.getByText("VIP client")).toBeInTheDocument();
    expect(screen.queryByText("Subscription")).not.toBeInTheDocument();
    await screen.findByText(/No admin accounts yet/);
    expect(mocks.getAll).toHaveBeenCalledWith({ institutionId: "inst-1", role: "ADMIN", limit: 50 });
  });

  it("lists administrators with their status", async () => {
    mocks.getAll.mockImplementation(() =>
      ok({ items: [
        { id: "a1", name: "ann", email: "ann@x.io", status: "ACTIVE", createdAt: "" },
        { id: "a2", name: "bob", email: "bob@x.io", status: "SUSPENDED", createdAt: "" },
      ] }),
    );
    render(<InstitutionOverviewTab institution={institution} runtimeConfig={null} />);
    expect(await screen.findByText("ann@x.io")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("SUSPENDED")).toBeInTheDocument();
  });

  it("renders subscription state including an expired trial and auto-renew", async () => {
    render(
      <InstitutionOverviewTab
        institution={institution}
        runtimeConfig={{ subscription: { status: "TRIAL", planName: "Starter", endsAt: "2020-01-01T00:00:00Z", autoRenew: true } }}
      />,
    );
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText(/Trial expired/)).toBeInTheDocument();
    expect(screen.getByText("Auto-renew: Yes")).toBeInTheDocument();
    await screen.findByText(/No admin accounts yet/);
  });

  it("shows a countdown chip for an unexpired trial", async () => {
    const future = new Date(Date.now() + 10 * 86_400_000).toISOString();
    render(<InstitutionOverviewTab institution={institution} runtimeConfig={{ subscription: { status: "TRIAL", endsAt: future } }} />);
    expect(screen.getByText(/Trial ends/)).toBeInTheDocument();
    expect(screen.getByText("Auto-renew: No")).toBeInTheDocument();
    await screen.findByText(/No admin accounts yet/);
  });

  it("creates an admin only when the form is complete, then reloads the list", async () => {
    render(<InstitutionOverviewTab institution={institution} runtimeConfig={null} />);
    await screen.findByText(/No admin accounts yet/);
    fireEvent.click(screen.getByRole("button", { name: /Add Admin/ }));
    const create = screen.getByRole("button", { name: "Create Admin" });
    expect(create).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "New Admin" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "new@x.io" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "short" } });
    expect(create).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "longenough" } });
    expect(create).toBeEnabled();
    fireEvent.click(create);
    await waitFor(() => expect(mocks.register).toHaveBeenCalledWith({
      name: "New Admin", email: "new@x.io", password: "longenough", role: "ADMIN", institutionId: "inst-1",
    }));
    await waitFor(() => expect(screen.queryByText("New Administrator")).not.toBeInTheDocument());
    expect(mocks.getAll).toHaveBeenCalledTimes(2);
  });

  it("keeps the add-admin dialog open when creation fails", async () => {
    mocks.register.mockRejectedValue(new Error("Email exists"));
    render(<InstitutionOverviewTab institution={institution} runtimeConfig={null} />);
    await screen.findByText(/No admin accounts yet/);
    fireEvent.click(screen.getByRole("button", { name: /Add Admin/ }));
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "N" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "n@x.io" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "longenough" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Admin" }));
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("Email exists", "error"));
    expect(screen.getByText("New Administrator")).toBeInTheDocument();
  });

  it("validates the slug in the edit dialog and saves trimmed values, dropping blank optionals", async () => {
    const onSaved = vi.fn();
    render(<InstitutionOverviewTab institution={institution} runtimeConfig={null} onSaved={onSaved} />);
    await screen.findByText(/No admin accounts yet/);
    fireEvent.click(screen.getByRole("button", { name: /^Edit$/ }));
    const save = screen.getByRole("button", { name: "Save" });
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Green School");
    fireEvent.change(screen.getByLabelText(/^Slug/), { target: { value: "Bad Slug" } });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^Slug/), { target: { value: "  new-slug " } });
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: " Green Two " } });
    fireEvent.change(screen.getByLabelText("Contact Phone"), { target: { value: "   " } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(mocks.updateInstitution).toHaveBeenCalledWith("inst-1", {
      name: "Green Two", slug: "new-slug", status: "ACTIVE", deploymentMode: "SHARED_HOSTED",
      primaryDomain: "green.edu", contactEmail: "hi@green.edu", contactPhone: undefined, notes: "VIP client",
    }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("does not close the edit dialog or call onSaved when saving fails", async () => {
    mocks.updateInstitution.mockRejectedValue(new Error("Slug taken"));
    const onSaved = vi.fn();
    render(<InstitutionOverviewTab institution={institution} runtimeConfig={null} onSaved={onSaved} />);
    await screen.findByText(/No admin accounts yet/);
    fireEvent.click(screen.getByRole("button", { name: /^Edit$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("Slug taken", "error"));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByText("Edit Institution Details")).toBeInTheDocument();
  });
});
