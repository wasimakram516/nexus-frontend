import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AcademicsManager from "./AcademicsManager";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), showMessage: vi.fn() }));
vi.mock("@/lib/axios", () => ({ default: { get: mocks.get, post: mocks.post } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/contexts/RuntimeConfigContext", () => ({ useOptionalRuntimeConfig: () => null }));
vi.mock("@/lib/users", () => ({ fetchAllUsers: async () => [] }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.post.mockResolvedValue({ data: { data: { id: "new" } } });
  mocks.get.mockImplementation(async (url: string) => ({ data: { data:
    url === "/campuses" ? { items: [{ id: "campus", name: "Main Campus", institutionId: "institution" }] } :
    url === "/custom-fields/form-definitions" ? [{ id: "shift", fieldKey: "shift", label: "Shift", inputType: "TEXT", isRequired: true }] : [],
  } }));
});

describe("AcademicsManager custom fields", () => {
  it("includes entered custom fields in the actual level creation request", async () => {
    render(<AcademicsManager institutionId="institution" />);
    fireEvent.click(await screen.findByRole("button", { name: /Levels/ }));
    fireEvent.click((await screen.findAllByRole("button", { name: /Add Level/i }))[0]);
    fireEvent.change(screen.getByLabelText(/Level Name/), { target: { value: "Primary" } });
    fireEvent.mouseDown(screen.getByLabelText(/Campus/));
    fireEvent.click(screen.getByRole("option", { name: "Main Campus" }));
    fireEvent.change(await screen.findByLabelText(/Shift/), { target: { value: "Morning" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/academics/levels", {
      name: "Primary", campusId: "campus", customFields: { shift: "Morning" },
    }));
  });
});
