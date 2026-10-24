import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { chargesPayload, filledCharges, invalidCharge, OneTimeChargesField, parseCharges } from "./OneTimeChargesEditor";

describe("charge helpers", () => {
  it("ignores blank rows and trims labels in the payload", () => {
    const charges = [
      { label: " Admission fee ", amount: "2000" },
      { label: "", amount: "" },
    ];

    expect(filledCharges(charges)).toHaveLength(1);
    expect(chargesPayload(charges)).toEqual([{ label: "Admission fee", amount: 2000 }]);
    expect(invalidCharge(charges)).toBeUndefined();
  });

  it.each([
    [{ label: "", amount: "5" }],
    [{ label: "Fee", amount: "" }],
    [{ label: "Fee", amount: "0" }],
    [{ label: "Fee", amount: "-3" }],
    [{ label: "Fee", amount: "1.234" }],
  ])("flags %j as unusable", (charge) => {
    expect(invalidCharge([charge])).toEqual(charge);
  });

  it("reads a JSON array back into lines and treats anything else as none", () => {
    expect(parseCharges('[{"label":"Exam fee","amount":300}]')).toEqual([{ label: "Exam fee", amount: "300" }]);
    expect(parseCharges("")).toEqual([]);
    expect(parseCharges("{}")).toEqual([]);
    expect(parseCharges("nope")).toEqual([]);
  });
});

describe("OneTimeChargesField", () => {
  it("starts from the stored charges", () => {
    render(<OneTimeChargesField value='[{"label":"Exam fee","amount":300}]' onChange={vi.fn()} disabled={false} />);

    expect(screen.getByLabelText("Charge label 1")).toHaveValue("Exam fee");
    expect(screen.getByLabelText("Charge amount 1")).toHaveValue(300);
  });

  it("hands over a JSON array, an incomplete marker while a line is unfinished, and [] when emptied", () => {
    const onChange = vi.fn();
    render(<OneTimeChargesField value="" onChange={onChange} disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Add charge" }));
    fireEvent.change(screen.getByLabelText("Charge label 1"), { target: { value: "Admission fee" } });
    expect(onChange).toHaveBeenLastCalledWith("incomplete");
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Charge amount 1"), { target: { value: "2000" } });
    expect(onChange).toHaveBeenLastCalledWith('[{"label":"Admission fee","amount":2000}]');
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove charge 1" }));
    expect(onChange).toHaveBeenLastCalledWith("[]");
  });

  it("is read-only while disabled", () => {
    render(<OneTimeChargesField value='[{"label":"Fee","amount":1}]' onChange={vi.fn()} disabled />);

    expect(screen.getByLabelText("Charge label 1")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add charge" })).toBeDisabled();
  });
});
