import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhoneInput from "./PhoneInput";
import CountrySelect from "./CountrySelect";

vi.mock("@/contexts/RuntimeConfigContext", () => ({ useOptionalRuntimeConfig: () => null }));

function Harness({ initial = "", defaultCountry }: { initial?: string; defaultCountry?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <PhoneInput label="Phone" value={value} onChange={setValue} defaultCountry={defaultCountry} />
      <span data-testid="value">{value}</span>
    </>
  );
}

describe("PhoneInput", () => {
  it("starts on the school's default country, so a local number needs no code", async () => {
    const user = userEvent.setup();
    render(<Harness defaultCountry="AE" />);

    expect(screen.getByRole("combobox", { name: /country code/i })).toHaveTextContent("+971");
    await user.type(screen.getByLabelText("Phone"), "50 123 4567");
    expect(screen.getByTestId("value")).toHaveTextContent("+971501234567");
  });

  it("falls back to Pakistan when the school has not chosen a country", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Phone"), "0300 1234567");
    expect(screen.getByTestId("value")).toHaveTextContent("+923001234567");
  });

  it("shows a stored international number split into its country and the rest", () => {
    render(<Harness initial="+971501234567" defaultCountry="PK" />);

    expect(screen.getByRole("combobox", { name: /country code/i })).toHaveTextContent("+971");
    expect(screen.getByLabelText("Phone")).toHaveValue("501234567");
  });

  it("lets any country be chosen from the searchable list", async () => {
    const user = userEvent.setup();
    render(<Harness defaultCountry="PK" />);

    await user.click(screen.getByRole("combobox", { name: /country code/i }));
    await user.type(await screen.findByLabelText("Search countries"), "united kingdom");
    await user.click(await screen.findByRole("option", { name: /United Kingdom/ }));
    await user.type(screen.getByLabelText("Phone"), "7911 123456");

    expect(screen.getByTestId("value")).toHaveTextContent("+447911123456");
  });

  it("switches country by itself when a number is pasted with its calling code", () => {
    render(<Harness defaultCountry="PK" />);

    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "+971 50 123 4567" } });

    expect(screen.getByRole("combobox", { name: /country code/i })).toHaveTextContent("+971");
    expect(screen.getByTestId("value")).toHaveTextContent("+971501234567");
  });

  it("explains a number that cannot be right once the box is left", async () => {
    const user = userEvent.setup();
    render(<Harness defaultCountry="PK" />);

    await user.type(screen.getByLabelText("Phone"), "300");
    expect(screen.queryByText(/Enter a valid/)).not.toBeInTheDocument();
    await user.tab();

    expect(screen.getByText(/Enter a valid Pakistan number/)).toBeInTheDocument();
  });

  it("is empty again when the box is cleared", async () => {
    const user = userEvent.setup();
    render(<Harness initial="+923001234567" />);

    await user.clear(screen.getByLabelText("Phone"));
    expect(screen.getByTestId("value")).toHaveTextContent("");
  });
});

describe("CountrySelect", () => {
  it("finds a country by typing and reports its code", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CountrySelect label="Default country" value="" onChange={onChange} />);

    await user.type(screen.getByRole("combobox", { name: /default country/i }), "saudi");
    await user.click(await screen.findByRole("option", { name: /Saudi Arabia/ }));

    expect(onChange).toHaveBeenCalledWith("SA");
  });

  it("shows the country that is chosen", () => {
    render(<CountrySelect label="Default country" value="AE" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: /default country/i })).toHaveValue("United Arab Emirates");
  });
});
