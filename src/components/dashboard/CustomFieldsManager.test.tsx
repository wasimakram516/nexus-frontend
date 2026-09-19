import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomFieldsManager from "./CustomFieldsManager";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), showMessage: vi.fn() }));
vi.mock("@/lib/axios", () => ({ default: { get: mocks.get, post: mocks.post, patch: mocks.patch } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockImplementation(async (url: string) => ({ data: { data: url.endsWith("entities") ? [
    { entityType: "salary_adjustment", moduleKey: "FINANCE" },
  ] : [] } }));
  mocks.post.mockResolvedValue({ data: { data: { id: "new" } } });
  mocks.patch.mockResolvedValue({ data: { data: {} } });
});

describe("CustomFieldsManager", () => {
  it.each([{ inputType: "NUMBER", defaultValue: 0 }, { inputType: "BOOLEAN", defaultValue: false }])("preserves $inputType defaults, plan restrictions and unrelated validation when editing", async ({ inputType, defaultValue }) => {
    mocks.get.mockImplementation(async (url: string) => ({ data: { data: url.endsWith("entities") ? [
      { entityType: "salary_adjustment", moduleKey: "FINANCE" },
    ] : [{ id: "field-1", label: "Saved field", fieldKey: "saved", entityType: "salary_adjustment", moduleKey: "FINANCE", inputType, defaultValue,
      planKeys: ["enterprise"], validation: { min: 0, max: 100, customRule: "preserve" } }] } }));
    render(<CustomFieldsManager institutionId="institution" />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText(/Field Label/), { target: { value: "Renamed field" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mocks.patch).toHaveBeenCalledWith("/custom-fields/definitions/field-1", expect.objectContaining({
      label: "Renamed field", defaultValue, planKeys: ["enterprise"], validation: { min: 0, max: 100, customRule: "preserve" },
    })));
  });
  it("creates a previously missing entity definition with the catalog's module", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CustomFieldsManager institutionId="institution" />);
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button", { name: "Add Field" })[0]);
    fireEvent.change(screen.getByLabelText(/Field Label/), { target: { value: "Reason" } });
    fireEvent.change(screen.getByLabelText(/Field Key/), { target: { value: "reason" } });
    fireEvent.mouseDown(screen.getByLabelText(/Entity Type/));
    fireEvent.click(screen.getByRole("option", { name: "salary adjustment" }));
    fireEvent.mouseDown(screen.getByLabelText(/Input Type/));
    fireEvent.click(screen.getByRole("option", { name: "SELECT" }));
    fireEvent.click(screen.getByRole("button", { name: "Add choice" }));
    fireEvent.change(screen.getByLabelText("Choice 1 label"), { target: { value: "Performance" } });
    fireEvent.change(screen.getByLabelText("Choice 1 value"), { target: { value: "performance" } });
    await user.type(screen.getByLabelText("Plan keys"), "basic, enterprise");
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/custom-fields/definitions", expect.objectContaining({
      institutionId: "institution", entityType: "salary_adjustment", moduleKey: "FINANCE", fieldKey: "reason", inputType: "SELECT",
      options: [{ label: "Performance", value: "performance" }],
      planKeys: ["basic", "enterprise"],
    })));
  });

  it("shows a visible error when the entity catalog cannot load", async () => {
    mocks.get.mockRejectedValue(new Error("Unavailable"));
    render(<CustomFieldsManager />);
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
