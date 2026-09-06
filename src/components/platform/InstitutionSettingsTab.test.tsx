import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { platformService } from "@/services/platform.service";
import InstitutionSettingsTab from "./InstitutionSettingsTab";

vi.mock("@/services/platform.service", () => ({
  platformService: { updateSettings: vi.fn() },
}));

function renderTab(runtimeConfig: Record<string, unknown> | null, onSaved = vi.fn()) {
  return render(
    <MessageProvider>
      <InstitutionSettingsTab
        institutionId="institution-1"
        runtimeConfig={runtimeConfig}
        onSaved={onSaved}
      />
    </MessageProvider>
  );
}

describe("InstitutionSettingsTab", () => {
  beforeEach(() => {
    vi.mocked(platformService.updateSettings).mockReset();
  });

  it("shows the current values read-only, with no editable fields until Edit is clicked", () => {
    renderTab({
      settings: {
        recycle_bin: { retentionDays: 14 },
        payroll: { perDayBasis: 26 },
        attendance: { mode: "PERIOD" },
      },
    });

    expect(screen.getByText("14 days")).toBeInTheDocument();
    expect(screen.getByText("base salary ÷ 26")).toBeInTheDocument();
    expect(screen.getByText("PERIOD")).toBeInTheDocument();
    expect(screen.queryByLabelText(/retention period/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/per-day basis/i)).not.toBeInTheDocument();
  });

  it("defaults the read-only display to 30/30/DAILY when no settings exist", () => {
    renderTab({ settings: {} });

    expect(screen.getByText("30 days")).toBeInTheDocument();
    expect(screen.getByText("base salary ÷ 30")).toBeInTheDocument();
    expect(screen.getByText("DAILY")).toBeInTheDocument();
  });

  it("opens an edit dialog pre-filled with the current values on Edit click", async () => {
    const user = userEvent.setup();
    renderTab({
      settings: {
        recycle_bin: { retentionDays: 14 },
        payroll: { perDayBasis: 26 },
        attendance: { mode: "PERIOD" },
      },
    });

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByLabelText(/retention period/i)).toHaveValue(14);
    expect(screen.getByLabelText(/per-day basis/i)).toHaveValue(26);
    expect(screen.getByLabelText(/attendance mode/i)).toHaveTextContent("PERIOD");
  });

  it("saves all three settings with the exact snake_case keys the backend expects, then closes the dialog", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    vi.mocked(platformService.updateSettings).mockResolvedValue({
      data: { message: "Settings saved successfully", data: {} },
    } as never);

    renderTab({ settings: {} }, onSaved);
    await user.click(screen.getByRole("button", { name: /edit/i }));

    await user.clear(screen.getByLabelText(/retention period/i));
    await user.type(screen.getByLabelText(/retention period/i), "14");
    await user.clear(screen.getByLabelText(/per-day basis/i));
    await user.type(screen.getByLabelText(/per-day basis/i), "26");
    await user.click(screen.getByLabelText(/attendance mode/i));
    await user.click(await screen.findByRole("option", { name: "PERIOD" }));
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(platformService.updateSettings).toHaveBeenCalledWith("institution-1", {
      settings: [
        expect.objectContaining({ key: "recycle_bin", value: { retentionDays: 14 } }),
        expect.objectContaining({ key: "payroll", value: { perDayBasis: 26 } }),
        expect.objectContaining({ key: "attendance", value: { mode: "PERIOD" } }),
      ],
    });
    expect(onSaved).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByLabelText(/retention period/i)).not.toBeInTheDocument(),
    );
  });

  it("defaults the attendance mode to DAILY on save when it was never changed", async () => {
    const user = userEvent.setup();
    vi.mocked(platformService.updateSettings).mockResolvedValue({
      data: { message: "Settings saved successfully", data: {} },
    } as never);

    renderTab({ settings: {} });
    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(platformService.updateSettings).toHaveBeenCalledWith(
      "institution-1",
      expect.objectContaining({
        settings: expect.arrayContaining([
          expect.objectContaining({ key: "attendance", value: { mode: "DAILY" } }),
        ]),
      }),
    );
  });

  it("cancel closes the dialog without saving", async () => {
    const user = userEvent.setup();
    renderTab({ settings: {} });

    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(platformService.updateSettings).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByLabelText(/retention period/i)).not.toBeInTheDocument(),
    );
  });

  it("blocks saving when retention days is out of the 7-365 bound", async () => {
    const user = userEvent.setup();
    renderTab({ settings: {} });

    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.clear(screen.getByLabelText(/retention period/i));
    await user.type(screen.getByLabelText(/retention period/i), "5");

    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    expect(screen.getByText(/must be a whole number between 7 and 365/i)).toBeInTheDocument();
  });

  it("blocks saving when per-day basis is zero or negative", async () => {
    const user = userEvent.setup();
    renderTab({ settings: {} });

    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.clear(screen.getByLabelText(/per-day basis/i));
    await user.type(screen.getByLabelText(/per-day basis/i), "0");

    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    expect(screen.getByText(/must be a positive number/i)).toBeInTheDocument();
  });

  it("shows unrecognized settings in a read-only list without duplicating the editable ones", () => {
    renderTab({
      settings: {
        recycle_bin: { retentionDays: 30 },
        theme_default: "dark",
      },
    });

    expect(screen.getByText("theme_default")).toBeInTheDocument();
    expect(screen.getByText(/other settings/i)).toBeInTheDocument();
  });
});
