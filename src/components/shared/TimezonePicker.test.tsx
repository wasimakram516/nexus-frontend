import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimezonePicker, { browserTimeZone, listTimeZones } from "./TimezonePicker";

describe("TimezonePicker", () => {
  it("lists many zones, always including UTC and this device's own", () => {
    const zones = listTimeZones();

    expect(zones.length).toBeGreaterThan(20);
    expect(zones).toContain("UTC");
    expect(zones).toContain("Asia/Karachi");
    if (browserTimeZone()) expect(zones).toContain(browserTimeZone());
  });

  it("shows the chosen zone with its offset", () => {
    render(<TimezonePicker value="Asia/Karachi" onChange={() => {}} />);

    expect(screen.getByRole("combobox", { name: "Timezone" })).toHaveValue("Asia/Karachi (GMT+5)");
  });

  it("finds a zone by city name, even with a space where the identifier has an underscore", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TimezonePicker value="Asia/Karachi" onChange={onChange} />);

    const input = screen.getByRole("combobox", { name: "Timezone" });
    await user.clear(input);
    await user.type(input, "new york");
    await user.click(await screen.findByRole("option", { name: /America\/New_York/ }));

    expect(onChange).toHaveBeenCalledWith("America/New_York");
  });

  it("finds a zone by its offset", async () => {
    const user = userEvent.setup();
    render(<TimezonePicker value="UTC" onChange={() => {}} />);

    const input = screen.getByRole("combobox", { name: "Timezone" });
    await user.clear(input);
    await user.type(input, "gmt+5");

    expect(await screen.findByRole("option", { name: /Asia\/Karachi/ })).toBeInTheDocument();
  });

  it("says when nothing matches", async () => {
    const user = userEvent.setup();
    render(<TimezonePicker value="UTC" onChange={() => {}} />);

    const input = screen.getByRole("combobox", { name: "Timezone" });
    await user.clear(input);
    await user.type(input, "zzzz");

    expect(await screen.findByText("No options")).toBeInTheDocument();
  });

  it("can be cleared when the choice is optional, and shows what empty means", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<TimezonePicker value="Asia/Dubai" onChange={onChange} clearable emptyLabel="Same as the institution" />);

    await user.click(screen.getByTitle("Clear"));
    expect(onChange).toHaveBeenCalledWith("");

    rerender(<TimezonePicker value="" onChange={onChange} clearable emptyLabel="Same as the institution" />);
    expect(screen.getByPlaceholderText("Same as the institution")).toBeInTheDocument();
  });

  it("cannot be cleared when a zone is required", () => {
    render(<TimezonePicker value="Asia/Karachi" onChange={() => {}} />);

    expect(screen.queryByRole("button", { name: "Clear", hidden: true })).not.toBeInTheDocument();
  });
});
