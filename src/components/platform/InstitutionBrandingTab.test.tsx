import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ showMessage: vi.fn(), updateBranding: vi.fn() }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/platform.service", () => ({ platformService: { updateBranding: mocks.updateBranding } }));

import InstitutionBrandingTab from "./InstitutionBrandingTab";

const runtime = {
  branding: { displayName: "Green School", logoUrl: "https://cdn/logo.png", theme: "ocean", primaryColorLight: "#111111", primaryColorDark: "#999999" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateBranding.mockImplementation(() => Promise.resolve({ data: { data: {}, message: "ok" } }));
});

describe("InstitutionBrandingTab", () => {
  it("shows configured branding and lists the customized colors", () => {
    render(<InstitutionBrandingTab institutionId="i1" runtimeConfig={runtime} />);
    expect(screen.getAllByText("Green School").length).toBeGreaterThan(0);
    expect(screen.getByText("ocean")).toBeInTheDocument();
    expect(screen.getByText("Configured")).toBeInTheDocument();
    expect(screen.getByText("#111111")).toBeInTheDocument();
    expect(screen.getByText("#999999")).toBeInTheDocument();
    expect(screen.getByText("2 set")).toBeInTheDocument();
  });

  it("uses placeholders when nothing is configured", () => {
    render(<InstitutionBrandingTab institutionId="i1" runtimeConfig={null} />);
    expect(screen.getByText("Institution Name")).toBeInTheDocument();
    expect(screen.getByText("Not set")).toBeInTheDocument();
    expect(screen.getByText("default")).toBeInTheDocument();
  });

  it("switches the preview between light and dark palettes", () => {
    render(<InstitutionBrandingTab institutionId="i1" runtimeConfig={runtime} />);
    const before = document.body.innerHTML;
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(document.body.innerHTML).not.toBe(before);
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
  });

  it("saves the edited branding form", async () => {
    const onSaved = vi.fn();
    render(<InstitutionBrandingTab institutionId="i1" runtimeConfig={runtime} onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Display Name"), { target: { value: "Renamed" } });
    fireEvent.change(within(dialog).getAllByLabelText("Main hex value")[0], { target: { value: "#abcdef" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.updateBranding).toHaveBeenCalledWith("i1", expect.objectContaining({
      displayName: "Renamed", logoUrl: "https://cdn/logo.png", theme: "ocean",
      colorOverrides: { light: { "primary.main": "#ABCDEF" }, dark: { "primary.main": "#999999" } },
      // Legacy flat columns are cleared: overrides now carry those colors.
      primaryColorLight: null, primaryColorDark: null,
    })));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  }, 60000);

  it("keeps the dialog open on failure", async () => {
    mocks.updateBranding.mockRejectedValue(new Error("invalid color"));
    const onSaved = vi.fn();
    render(<InstitutionBrandingTab institutionId="i1" runtimeConfig={runtime} onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("invalid color", "error"));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  }, 60000);
});
