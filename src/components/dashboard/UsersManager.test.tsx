import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { useAuth } from "@/contexts/AuthContext";
import { customFieldsService } from "@/services/customFields.service";
import { rolesService } from "@/services/roles.service";
import { usersService } from "@/services/users.service";
import UsersManager from "./UsersManager";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/customFields.service", () => ({
  customFieldsService: { getFormDefinitions: vi.fn() },
}));

vi.mock("@/services/roles.service", () => ({
  rolesService: {
    list: vi.fn(),
    getCatalog: vi.fn(),
    getModuleCatalog: vi.fn(),
  },
}));

vi.mock("@/services/auth.service", () => ({
  authService: { register: vi.fn() },
}));

vi.mock("@/services/users.service", () => ({
  usersService: {
    getAll: vi.fn(),
    resolve: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

const staffRow = {
  id: "user-2",
  name: "Sam Staff",
  email: "sam@test.com",
  role: "STAFF",
  status: "ACTIVE",
  institutionId: "inst-1",
  roleId: null,
  permissionOverrides: null,
  assignedRole: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function renderManager() {
  return render(
    <MessageProvider>
      <UsersManager />
    </MessageProvider>
  );
}

describe("UsersManager", () => {
  beforeEach(() => {
    vi.mocked(usersService.getAll).mockReset();
    vi.mocked(usersService.updateUser).mockReset();
    vi.mocked(rolesService.list).mockReset();
    vi.mocked(rolesService.getCatalog).mockReset();
    vi.mocked(rolesService.getModuleCatalog).mockReset();
    vi.mocked(customFieldsService.getFormDefinitions).mockReset();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "admin-1", email: "admin@test.com", name: "Admin", role: "ADMIN", institutionId: "inst-1", sessionId: "s1" },
    } as never);
    vi.mocked(usersService.getAll).mockResolvedValue({ data: { data: { items: [staffRow], total: 1 } } } as never);
    vi.mocked(rolesService.list).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(rolesService.getCatalog).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(rolesService.getModuleCatalog).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({ data: { data: [] } } as never);
  });

  it("renders the users table", async () => {
    renderManager();
    expect(await screen.findByText("Sam Staff")).toBeInTheDocument();
    expect(screen.getByText("sam@test.com")).toBeInTheDocument();
  });

  it("loads user custom field definitions when the edit access dialog opens, gated under PEOPLE per the backend's entity-module mapping", async () => {
    const user = userEvent.setup();
    renderManager();

    const row = (await screen.findByText("Sam Staff")).closest("tr")!;
    await user.click(within(row).getByTestId("EditIcon").closest("button")!);

    await screen.findByRole("dialog");
    expect(customFieldsService.getFormDefinitions).toHaveBeenCalledWith({
      entityType: "user",
      institutionId: undefined,
      action: "update",
    });
  });

  it("blocks save until a required user custom field is filled, then includes it in the update payload", async () => {
    const user = userEvent.setup();
    vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({
      data: { data: [{ id: "field-1", fieldKey: "badge_no", label: "Badge Number", inputType: "TEXT", isRequired: true }] },
    } as never);
    vi.mocked(usersService.updateUser).mockResolvedValue({ data: { message: "ok", data: {} } } as never);

    renderManager();

    const row = (await screen.findByText("Sam Staff")).closest("tr")!;
    await user.click(within(row).getByTestId("EditIcon").closest("button")!);
    const dialog = await screen.findByRole("dialog");

    await waitFor(() => expect(within(dialog).getByLabelText(/Badge Number/)).toBeInTheDocument());
    const saveButton = within(dialog).getByRole("button", { name: "Save Changes" });
    expect(saveButton).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/Badge Number/), "B-042");
    expect(saveButton).not.toBeDisabled();

    await user.click(saveButton);

    await waitFor(() =>
      expect(usersService.updateUser).toHaveBeenCalledWith(
        "user-2",
        expect.objectContaining({ customFields: { badge_no: "B-042" } })
      )
    );
  });

  it("preloads a row's saved custom field values into the edit dialog", async () => {
    vi.mocked(usersService.getAll).mockResolvedValue({
      data: { data: { items: [{ ...staffRow, customFields: { badge_no: "B-999" } }], total: 1 } },
    } as never);
    vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({
      data: { data: [{ id: "field-1", fieldKey: "badge_no", label: "Badge Number", inputType: "TEXT", isRequired: false }] },
    } as never);
    const user = userEvent.setup();

    renderManager();

    const row = (await screen.findByText("Sam Staff")).closest("tr")!;
    await user.click(within(row).getByTestId("EditIcon").closest("button")!);
    const dialog = await screen.findByRole("dialog");

    expect(await within(dialog).findByDisplayValue("B-999")).toBeInTheDocument();
  });
});
