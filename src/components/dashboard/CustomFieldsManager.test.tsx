import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomFieldsManager from "./CustomFieldsManager";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), showMessage: vi.fn() }));
vi.mock("@/lib/axios", () => ({ default: { get: mocks.get, post: mocks.post } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockImplementation(async (url: string) => ({ data: { data: url.endsWith("entities") ? [
    { entityType: "salary_adjustment", moduleKey: "FINANCE" },
  ] : [] } }));
  mocks.post.mockResolvedValue({ data: { data: { id: "new" } } });
});

describe("CustomFieldsManager", () => {
  it("creates a previously missing entity definition with the catalog's module", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/custom-fields/definitions", expect.objectContaining({
      institutionId: "institution", entityType: "salary_adjustment", moduleKey: "FINANCE", fieldKey: "reason", inputType: "SELECT",
      options: [{ label: "Performance", value: "performance" }],
    })));
  });

  it("shows a visible error when the entity catalog cannot load", async () => {
    mocks.get.mockRejectedValue(new Error("Unavailable"));
    render(<CustomFieldsManager />);
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
