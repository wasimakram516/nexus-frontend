import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CustomFieldDefaultEditor from "./CustomFieldDefaultEditor";

describe("CustomFieldDefaultEditor", () => {
  it("retains numeric zero as a number", () => {
    const onChange = vi.fn();
    render(<CustomFieldDefaultEditor value="1" form={{ inputType: "NUMBER" }} onChange={onChange} disabled={false} onBusyChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Default value"), { target: { value: "0" } });
    expect(onChange).toHaveBeenCalledWith("0");
  });
  it("retains boolean false instead of treating it as an empty default", () => {
    const onChange = vi.fn();
    render(<CustomFieldDefaultEditor value="true" form={{ inputType: "BOOLEAN" }} onChange={onChange} disabled={false} onBusyChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByLabelText("Default value"));
    fireEvent.click(screen.getByRole("option", { name: "No" }));
    expect(onChange).toHaveBeenCalledWith("false");
  });
  it("loads string defaults and supports clearing them explicitly", () => {
    const onChange = vi.fn();
    render(<CustomFieldDefaultEditor value={'"Saved text"'} form={{ inputType: "TEXT" }} onChange={onChange} disabled={false} onBusyChange={vi.fn()} />);
    expect(screen.getByLabelText("Default value")).toHaveValue("Saved text");
    fireEvent.change(screen.getByLabelText("Default value"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith("null");
  });
});
