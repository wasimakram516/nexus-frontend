import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CustomFieldVisibilityEditor from "./CustomFieldVisibilityEditor";

describe("CustomFieldVisibilityEditor", () => {
  it("renders with no roles selected when value is empty", () => {
    render(<CustomFieldVisibilityEditor value="" onChange={vi.fn()} disabled={false} />);
    expect(screen.getByLabelText("Visible to roles")).toBeInTheDocument();
  });

  it("emits an empty string when every role is cleared, leaving the field visible to everyone", () => {
    const onChange = vi.fn();
    render(<CustomFieldVisibilityEditor value={JSON.stringify({ roles: ["STAFF"] })} onChange={onChange} disabled={false} />);
    fireEvent.mouseDown(screen.getByLabelText("Visible to roles"));
    fireEvent.click(screen.getByRole("option", { name: "Staff" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("adds a role to the allow-list and serializes it as { roles }", () => {
    const onChange = vi.fn();
    render(<CustomFieldVisibilityEditor value="" onChange={onChange} disabled={false} />);
    fireEvent.mouseDown(screen.getByLabelText("Visible to roles"));
    fireEvent.click(screen.getByRole("option", { name: "Staff" }));
    expect(onChange).toHaveBeenCalledWith(JSON.stringify({ roles: ["STAFF"] }));
  });

  it("renders selected roles from an existing value as chips", () => {
    render(<CustomFieldVisibilityEditor value={JSON.stringify({ roles: ["ADMIN", "STAFF"] })} onChange={vi.fn()} disabled={false} />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Staff")).toBeInTheDocument();
  });

  it("disables the control when disabled is true", () => {
    render(<CustomFieldVisibilityEditor value="" onChange={vi.fn()} disabled={true} />);
    expect(screen.getByRole("group")).toBeDisabled();
  });
});
