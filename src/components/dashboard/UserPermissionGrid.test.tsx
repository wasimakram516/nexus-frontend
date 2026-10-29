import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPermissionGrid from "./UserPermissionGrid";

const catalog = [
  { key: "students", label: "Students", module: "PEOPLE", actions: ["read", "update"] },
  { key: "fees", label: "Fees", module: "FINANCE", actions: ["read"] },
] as never[];
const base = { students: { read: true } };

function setup(overrides = {}) {
  const onChange = vi.fn();
  render(
    <UserPermissionGrid
      catalog={catalog}
      moduleLabels={{ PEOPLE: "People", FINANCE: "Finance" }}
      base={base}
      overrides={overrides}
      onChange={onChange}
    />,
  );
  return onChange;
}

describe("UserPermissionGrid", () => {
  it("starts from the role and says how many permissions are allowed", () => {
    setup();
    expect(screen.getByLabelText("Students Read")).toBeChecked();
    expect(screen.getByLabelText("Students Update")).not.toBeChecked();
    expect(screen.getByTestId("permission-summary")).toHaveTextContent("1 of 3 permissions allowed");
  });

  it("stores only the difference when a tick the role does not give is added", async () => {
    const onChange = setup();
    await userEvent.setup().click(screen.getByLabelText("Students Update"));
    expect(onChange).toHaveBeenCalledWith({ students: { update: "allow" } });
  });

  it("stores a removal when a tick the role gives is cleared", async () => {
    const onChange = setup();
    await userEvent.setup().click(screen.getByLabelText("Students Read"));
    expect(onChange).toHaveBeenCalledWith({ students: { read: "deny" } });
  });

  it("marks changed ticks and counts them", () => {
    setup({ students: { update: "allow", read: "deny" } });
    expect(screen.getByLabelText("Students Update (added)")).toBeChecked();
    expect(screen.getByLabelText("Students Read (removed)")).not.toBeChecked();
    expect(screen.getByTestId("permission-summary")).toHaveTextContent("2 changed from the role");
  });

  it("resets every change back to the role", async () => {
    const onChange = setup({ students: { update: "allow" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Reset to role" }));
    expect(onChange).toHaveBeenCalledWith({});
  });

  it("has nothing to reset when nothing differs from the role", () => {
    setup();
    expect(screen.getByRole("button", { name: "Reset to role" })).toBeDisabled();
  });

  it("selects every permission in a module at once", async () => {
    const onChange = setup();
    await userEvent.setup().click(screen.getByRole("button", { name: "Select all People" }));
    expect(onChange).toHaveBeenCalledWith({ students: { update: "allow" } });
  });

  it("clears a module that is fully on", async () => {
    const onChange = setup({ students: { update: "allow" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Clear all People" }));
    expect(onChange).toHaveBeenCalledWith({ students: { read: "deny" } });
  });
});
