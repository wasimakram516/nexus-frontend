import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResourceSection, { ColumnDef, FieldDef } from "./ResourceSection";

interface Row {
  id: string;
  name: string;
  code: string;
}

const columns: ColumnDef<Row>[] = [
  { key: "name", label: "Name" },
  { key: "code", label: "Code" },
];

const fields: FieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "code", label: "Code" },
];

const rows: Row[] = [
  { id: "1", name: "Main Campus", code: "MC" },
  { id: "2", name: "North Campus", code: "NC" },
];

describe("ResourceSection (table pattern)", () => {
  it("renders column headers and row data", () => {
    render(
      <ResourceSection
        title="Campuses"
        rows={rows}
        loading={false}
        columns={columns}
        fields={fields}
      />
    );

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Code" })).toBeInTheDocument();
    expect(screen.getByText("Main Campus")).toBeInTheDocument();
    expect(screen.getByText("North Campus")).toBeInTheDocument();
  });

  it("shows an empty state with no rows", () => {
    render(
      <ResourceSection
        title="Campuses"
        rows={[]}
        loading={false}
        columns={columns}
        fields={fields}
      />
    );

    expect(screen.getByText("No campuses yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows a spinner instead of the table while loading", () => {
    render(
      <ResourceSection
        title="Campuses"
        rows={rows}
        loading
        columns={columns}
        fields={fields}
      />
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("blocks Create until the required field is filled, then submits the built payload", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(true);

    render(
      <ResourceSection
        title="Campuses"
        rows={rows}
        loading={false}
        columns={columns}
        fields={fields}
        onCreate={onCreate}
      />
    );

    await user.click(screen.getByRole("button", { name: /add campus/i }));

    const dialog = await screen.findByRole("dialog");
    const createButton = within(dialog).getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/Name \*/), "South Campus");
    expect(createButton).toBeEnabled();

    await user.type(within(dialog).getByLabelText("Code"), "SC");
    await user.click(createButton);

    expect(onCreate).toHaveBeenCalledWith({ name: "South Campus", code: "SC" });
  });

  it("asks for confirmation before deleting a row", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(true);

    render(
      <ResourceSection
        title="Campuses"
        rows={rows}
        loading={false}
        columns={columns}
        fields={fields}
        onDelete={onDelete}
      />
    );

    const firstRow = screen.getByText("Main Campus").closest("tr")!;
    await user.click(within(firstRow).getByRole("button", { name: /delete/i }));

    const confirmDialog = await screen.findByRole("dialog");
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
