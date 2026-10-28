import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AccessRoleSelect from "./AccessRoleSelect";

const roles = [{ id: "r1", name: "Front Desk" }, { id: "r2", name: "Accountant" }];

describe("AccessRoleSelect", () => {
  it("lists the roles and reports the one picked", async () => {
    const onChange = vi.fn();
    render(<AccessRoleSelect roles={roles} value="" onChange={onChange} isStaff />);

    fireEvent.mouseDown(screen.getByRole("combobox", { name: /access role/i }));
    fireEvent.click(await screen.findByRole("option", { name: "Front Desk" }));

    expect(onChange).toHaveBeenCalledWith("r1");
  });

  it("warns that staff without a role cannot open anything", () => {
    render(<AccessRoleSelect roles={roles} value="" onChange={vi.fn()} isStaff />);
    expect(screen.getByText(/cannot open anything/i)).toBeInTheDocument();
  });

  it("explains what students and guardians get without a role", () => {
    render(<AccessRoleSelect roles={roles} value="" onChange={vi.fn()} />);
    expect(screen.getByText(/only see their own records/i)).toBeInTheDocument();
  });

  it("points to the Roles page when none exist yet", () => {
    render(<AccessRoleSelect roles={[]} value="" onChange={vi.fn()} isStaff />);
    expect(screen.getByText(/create them on the roles page/i)).toBeInTheDocument();
  });
});
