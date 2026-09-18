import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CustomFieldValidationEditor from "./CustomFieldValidationEditor";

describe("CustomFieldValidationEditor", () => {
  it("renders empty inputs when value is empty", () => {
    render(<CustomFieldValidationEditor value="" onChange={vi.fn()} disabled={false} />);
    expect(screen.getByLabelText("Allowed formats")).toHaveValue("");
    expect(screen.getByLabelText("Max file size (MB)")).toHaveValue(null);
  });

  it("parses a comma-separated formats list into a lowercase array", () => {
    const onChange = vi.fn();
    render(<CustomFieldValidationEditor value="" onChange={onChange} disabled={false} />);
    fireEvent.change(screen.getByLabelText("Allowed formats"), { target: { value: "PDF, jpg , png" } });
    expect(onChange).toHaveBeenCalledWith(JSON.stringify({ allowedFormats: ["pdf", "jpg", "png"] }));
  });

  it("converts an entered MB value into bytes", () => {
    const onChange = vi.fn();
    render(<CustomFieldValidationEditor value="" onChange={onChange} disabled={false} />);
    fireEvent.change(screen.getByLabelText("Max file size (MB)"), { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith(JSON.stringify({ maxBytes: 5 * 1024 * 1024 }));
  });

  it("hydrates existing maxBytes back into MB for display", () => {
    render(<CustomFieldValidationEditor value={JSON.stringify({ maxBytes: 2 * 1024 * 1024 })} onChange={vi.fn()} disabled={false} />);
    expect(screen.getByLabelText("Max file size (MB)")).toHaveValue(2);
  });

  it("emits an empty string once every rule is cleared", () => {
    const onChange = vi.fn();
    render(<CustomFieldValidationEditor value={JSON.stringify({ allowedFormats: ["pdf"] })} onChange={onChange} disabled={false} />);
    fireEvent.change(screen.getByLabelText("Allowed formats"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("disables both inputs when disabled is true", () => {
    render(<CustomFieldValidationEditor value="" onChange={vi.fn()} disabled={true} />);
    expect(screen.getByLabelText("Allowed formats")).toBeDisabled();
    expect(screen.getByLabelText("Max file size (MB)")).toBeDisabled();
  });
});
