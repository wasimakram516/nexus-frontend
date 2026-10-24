import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { platformService } from "@/services/platform.service";
import FinanceSettingsCard, { dueDayError } from "./FinanceSettingsCard";

vi.mock("@/services/platform.service", () => ({
  platformService: { updateSettings: vi.fn() },
}));

function renderCard(setting: unknown, onSaved = vi.fn()) {
  render(
    <MessageProvider>
      <FinanceSettingsCard institutionId="inst-1" setting={setting} onSaved={onSaved} />
    </MessageProvider>,
  );
  return onSaved;
}

beforeEach(() => {
  vi.mocked(platformService.updateSettings).mockReset();
  vi.mocked(platformService.updateSettings).mockResolvedValue({ data: { data: {}, message: "ok" } } as never);
});

describe("dueDayError", () => {
  it.each(["1", "10", "28"])("accepts %s", (value) => {
    expect(dueDayError(value)).toBeNull();
  });

  it.each(["", "0", "29", "4.5", "abc"])("rejects %j", (value) => {
    expect(dueDayError(value)).not.toBeNull();
  });
});

describe("FinanceSettingsCard", () => {
  it("shows the defaults when nothing is set", () => {
    renderCard(undefined);

    expect(screen.getByText("Due on day 10 of the month · Amounts shown as Rs.")).toBeInTheDocument();
    expect(screen.getByText(/No instructions are printed on vouchers yet/)).toBeInTheDocument();
  });

  it("shows the stored setting, in whichever form it was saved", () => {
    renderCard(JSON.stringify({ dueDayOfMonth: 5, currencyLabel: "SAR", voucherInstructions: "One\n\nTwo", voucherContact: "info@school.test" }));

    expect(screen.getByText("Due on day 5 of the month · Amounts shown as SAR")).toBeInTheDocument();
    expect(screen.getByText(/2 instructions printed on every voucher · Footer: info@school.test/)).toBeInTheDocument();
  });

  it("saves every field and reports it saved", async () => {
    const user = userEvent.setup();
    const onSaved = renderCard(undefined);

    await user.click(screen.getByRole("button", { name: "Edit voucher settings" }));
    const day = screen.getByLabelText("Due day of the month");
    await user.clear(day);
    await user.type(day, "7");
    await user.type(screen.getByLabelText("Instructions on the voucher"), " Pay at the bank. ");
    await user.type(screen.getByLabelText("Footer line"), "info@school.test");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(platformService.updateSettings).toHaveBeenCalledWith("inst-1", {
      settings: [
        expect.objectContaining({
          key: "finance",
          value: {
            dueDayOfMonth: 7,
            currencyLabel: "Rs.",
            voucherInstructions: "Pay at the bank.",
            voucherContact: "info@school.test",
          },
        }),
      ],
    });
  });

  it("blocks saving a bad due day or an empty currency", async () => {
    const user = userEvent.setup();
    renderCard(undefined);

    await user.click(screen.getByRole("button", { name: "Edit voucher settings" }));
    const day = screen.getByLabelText("Due day of the month");
    await user.clear(day);
    await user.type(day, "31");
    expect(screen.getByText("Enter a whole number from 1 to 28.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    await user.clear(day);
    await user.type(day, "15");
    await user.clear(screen.getByLabelText("Currency label"));
    expect(screen.getByText("Enter a currency label, such as Rs.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("stays open when saving fails", async () => {
    const user = userEvent.setup();
    const onSaved = renderCard(undefined);
    vi.mocked(platformService.updateSettings).mockRejectedValue({ response: { data: { message: "No." } }, message: "x" });

    await user.click(screen.getByRole("button", { name: "Edit voucher settings" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(platformService.updateSettings).toHaveBeenCalled());
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
