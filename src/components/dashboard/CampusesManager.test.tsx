import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CampusesManager from "./CampusesManager";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), showMessage: vi.fn(), confirm: vi.fn() }));
vi.mock("@/lib/axios", () => ({ default: { get: mocks.get, post: mocks.post } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { institutionId: "institution" } }) }));
vi.mock("@/contexts/ConfirmContext", () => ({ useConfirm: () => mocks.confirm }));
vi.mock("@/lib/users", () => ({ fetchAllUsers: async () => [] }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockImplementation(async (url: string) => ({ data: { data: url === "/campuses" ? { items: [] } : [
    { id: "code", fieldKey: "code", label: "Campus code", inputType: "TEXT", isRequired: true },
  ] } }));
});

describe("CampusesManager custom fields", () => {
  it("preserves custom values after a failed save and submits them on retry", async () => {
    mocks.post.mockRejectedValueOnce(new Error("Save failed"));
    mocks.post.mockResolvedValueOnce({ data: { data: { id: "campus" } } });
    render(<CampusesManager />);
    await screen.findByRole("button", { name: "Add First Campus" });
    fireEvent.click(screen.getByRole("button", { name: "Add Campus" }));
    fireEvent.change(screen.getByLabelText(/Campus Name/), { target: { value: "Main" } });
    fireEvent.change(screen.getByLabelText(/Location/), { target: { value: "Lahore" } });
    fireEvent.change(await screen.findByLabelText(/Campus code/), { target: { value: "MAIN" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Campus" }));
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("Save failed", "error"));
    expect(screen.getByLabelText(/Campus code/)).toHaveValue("MAIN");
    fireEvent.click(screen.getByRole("button", { name: "Create Campus" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.post).toHaveBeenLastCalledWith("/campuses", expect.objectContaining({
      name: "Main", institutionId: "institution", customFields: { code: "MAIN" },
    }));
  });
});
