import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PermissionMatrixEditor from "./PermissionMatrixEditor";
import { PermissionCatalogFeature } from "@/contexts/RuntimeConfigContext";

const catalog: PermissionCatalogFeature[] = [
  { key: "students", label: "Students", module: "PEOPLE", actions: ["create", "read", "update", "delete"] },
  { key: "guardians", label: "Guardians", module: "PEOPLE", actions: ["create", "read", "update", "delete"] },
  { key: "audit_logs", label: "Audit Logs", module: null, actions: ["read"] },
];

describe("PermissionMatrixEditor", () => {
  it("groups features by module and renders a placeholder for unsupported actions", () => {
    render(<PermissionMatrixEditor catalog={catalog} value={{}} onChange={vi.fn()} />);

    expect(screen.getByText("People")).toBeInTheDocument();
    expect(screen.getByText("Administrative")).toBeInTheDocument();

    const auditRow = screen.getByText("Audit Logs").closest("tr")!;
    // Only "Read" is a real checkbox for audit_logs; create/update/delete render as dashes.
    expect(within(auditRow).getAllByRole("checkbox")).toHaveLength(1);
    expect(within(auditRow).getAllByText("—")).toHaveLength(3);
  });

  it("toggles a single cell and reports the updated value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PermissionMatrixEditor catalog={catalog} value={{}} onChange={onChange} />);

    const studentsRow = screen.getByText("Students").closest("tr")!;
    const checkboxes = within(studentsRow).getAllByRole("checkbox");
    await user.click(checkboxes[1]); // read

    expect(onChange).toHaveBeenCalledWith({ students: { read: true } });
  });

  it("toggling a column header grants that action to every feature in the group", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PermissionMatrixEditor catalog={catalog} value={{}} onChange={onChange} />);

    // Two groups exist (People, Administrative); the People group renders first.
    const [peopleReadHeader] = screen.getAllByText("Read", { selector: "th *" });
    await user.click(peopleReadHeader);

    expect(onChange).toHaveBeenCalledWith({
      students: { read: true },
      guardians: { read: true },
    });
  });

  it("reflects pre-existing granted values as checked", () => {
    render(
      <PermissionMatrixEditor
        catalog={catalog}
        value={{ students: { read: true, update: true } }}
        onChange={vi.fn()}
      />
    );

    const studentsRow = screen.getByText("Students").closest("tr")!;
    const [create, read, update, del] = within(studentsRow).getAllByRole("checkbox");
    expect(create).not.toBeChecked();
    expect(read).toBeChecked();
    expect(update).toBeChecked();
    expect(del).not.toBeChecked();
  });
});
