import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import FeeBreakdownInput, { breakdownProblem, breakdownToJson, parseBreakdown } from "./FeeBreakdownInput";

describe("fee breakdown helpers", () => {
  it("reads stored JSON back into lines, and falls back to one empty line", () => {
    expect(parseBreakdown('{"tuition":5000,"transport":1500}')).toEqual([
      { label: "tuition", amount: "5000" },
      { label: "transport", amount: "1500" },
    ]);
    expect(parseBreakdown("")).toEqual([{ label: "", amount: "" }]);
    expect(parseBreakdown("not json")).toEqual([{ label: "", amount: "" }]);
    expect(parseBreakdown("[1,2]")).toEqual([{ label: "", amount: "" }]);
  });

  it.each([
    [[{ label: "", amount: "" }], "Add at least one fee line."],
    [[{ label: "", amount: "100" }], "Every line needs a name, such as Tuition."],
    [[{ label: "Tuition", amount: "" }], "Enter an amount above zero for Tuition."],
    [[{ label: "Tuition", amount: "0" }], "Enter an amount above zero for Tuition."],
    [[{ label: "Tuition", amount: "10.555" }], "Tuition can have at most two decimals."],
    [
      [
        { label: "Tuition", amount: "1" },
        { label: " tuition ", amount: "2" },
      ],
      "tuition is listed twice. Combine them into one line.",
    ],
  ])("reports the first problem: %#", (lines, message) => {
    expect(breakdownProblem(lines)).toBe(message);
    expect(breakdownToJson(lines)).toBe("");
  });

  it("builds JSON from valid lines and ignores blank ones", () => {
    const lines = [
      { label: " Tuition ", amount: "5000" },
      { label: "", amount: "" },
      { label: "Transport", amount: "1500.5" },
    ];

    expect(breakdownProblem(lines)).toBeNull();
    expect(JSON.parse(breakdownToJson(lines))).toEqual({ Tuition: 5000, Transport: 1500.5 });
  });
});

describe("FeeBreakdownInput", () => {
  it("starts from the stored lines and shows their total", () => {
    render(<FeeBreakdownInput value='{"tuition":5000,"transport":1500}' onChange={vi.fn()} disabled={false} />);

    expect(screen.getByLabelText("Fee name 1")).toHaveValue("tuition");
    expect(screen.getByLabelText("Fee amount 2")).toHaveValue(1500);
    expect(screen.getByText("Total 6500.00")).toBeInTheDocument();
  });

  it("hands over valid JSON as lines are filled in, and an empty value while incomplete", () => {
    const onChange = vi.fn();
    render(<FeeBreakdownInput value="" onChange={onChange} disabled={false} />);

    fireEvent.change(screen.getByLabelText("Fee name 1"), { target: { value: "Tuition" } });
    expect(onChange).toHaveBeenLastCalledWith("");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter an amount above zero for Tuition.");

    fireEvent.change(screen.getByLabelText("Fee amount 1"), { target: { value: "5000" } });
    expect(onChange).toHaveBeenLastCalledWith('{"Tuition":5000}');
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("adds and removes lines, but always keeps one", () => {
    const onChange = vi.fn();
    render(<FeeBreakdownInput value='{"tuition":5000}' onChange={onChange} disabled={false} />);

    expect(screen.getByRole("button", { name: "Remove fee line 1" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Add line" }));
    fireEvent.change(screen.getByLabelText("Fee name 2"), { target: { value: "Transport" } });
    fireEvent.change(screen.getByLabelText("Fee amount 2"), { target: { value: "1500" } });
    expect(onChange).toHaveBeenLastCalledWith('{"tuition":5000,"Transport":1500}');

    fireEvent.click(screen.getByRole("button", { name: "Remove fee line 1" }));
    expect(onChange).toHaveBeenLastCalledWith('{"Transport":1500}');
    expect(screen.queryByLabelText("Fee name 2")).not.toBeInTheDocument();
  });

  it("is read-only while disabled", () => {
    render(<FeeBreakdownInput value='{"tuition":5000}' onChange={vi.fn()} disabled />);

    expect(screen.getByLabelText("Fee name 1")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add line" })).toBeDisabled();
  });
});
