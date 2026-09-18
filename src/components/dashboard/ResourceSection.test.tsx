import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResourceSection, { ColumnDef, FieldDef } from "./ResourceSection";
import { customFieldsService } from "@/services/customFields.service";

vi.mock("@/services/customFields.service", () => ({ customFieldsService: { getFormDefinitions: vi.fn() } }));

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
  it("retains the request key when retrying a failed creation", async () => {
    const onCreate = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    render(<ResourceSection title="Receipts" rows={[]} loading={false} columns={[]} fields={[]}
      idempotencyKeyField="requestKey" onCreate={onCreate} />);
    fireEvent.click(screen.getAllByRole("button", { name: /add receipt/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Create" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(2));
    expect(onCreate.mock.calls[0][0]).toEqual(onCreate.mock.calls[1][0]);
    expect(onCreate.mock.calls[0][0].requestKey).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("displays saved custom values without exposing save actions in the detail view", async () => {
    vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({ data: { data: [
      { id: "note", fieldKey: "note", label: "Note", inputType: "TEXT", isRequired: false, defaultValue: "Default" },
    ] } } as Awaited<ReturnType<typeof customFieldsService.getFormDefinitions>>);
    render(<ResourceSection title="Records" rows={[{ id: "record", customFields: { note: "Saved value" } }]}
      loading={false} columns={[]} fields={[]} customFieldEntity="level" />);
    fireEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(await screen.findByLabelText("Note")).toHaveValue("Saved value");
    expect(screen.getByLabelText("Note")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
    expect(customFieldsService.getFormDefinitions).toHaveBeenCalledWith({ entityType: "level", action: "read", institutionId: undefined });
  });

  it("loads record definitions and submits typed required custom values", async () => {
    vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({ data: { data: [
      { id: "age", fieldKey: "age", label: "Age", inputType: "NUMBER", isRequired: true },
      { id: "active", fieldKey: "active", label: "Active", inputType: "BOOLEAN", isRequired: true, defaultValue: false },
    ] } } as Awaited<ReturnType<typeof customFieldsService.getFormDefinitions>>);
    const onCreate = vi.fn().mockResolvedValue(true);
    render(<ResourceSection title="Records" rows={[]} loading={false} columns={[]} fields={[]}
      customFieldEntity="student" institutionId="institution" onCreate={onCreate} />);
    fireEvent.click(screen.getAllByRole("button", { name: /add record/i })[0]);
    const age = await screen.findByLabelText(/Age/);
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
    fireEvent.change(age, { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ customFields: { age: 0, active: false } }));
    expect(customFieldsService.getFormDefinitions).toHaveBeenCalledWith({ entityType: "student", institutionId: "institution", action: "create" });
  });

  it("blocks saving when required custom definitions cannot be loaded", async () => {
    vi.mocked(customFieldsService.getFormDefinitions).mockRejectedValue(new Error("Unavailable"));
    const onCreate = vi.fn();
    render(<ResourceSection title="Records" rows={[]} loading={false} columns={[]} fields={[]}
      customFieldEntity="student" onCreate={onCreate} />);
    fireEvent.click(screen.getAllByRole("button", { name: /add record/i })[0]);
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("requires preview confirmation and invalidates it when the form changes", async () => {
    const previewCreate = vi.fn().mockResolvedValue(<p>Net salary: 1200</p>);
    const onCreate = vi.fn().mockResolvedValue(true);
    render(<ResourceSection title="Payments" rows={[]} loading={false} columns={columns}
      fields={fields} onCreate={onCreate} previewCreate={previewCreate} confirmCreateLabel="Confirm payment" />);
    fireEvent.click(screen.getAllByRole("button", { name: /add payment/i })[0]);
    fireEvent.change(screen.getByLabelText(/Name \*/), { target: { value: "March" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(await screen.findByText("Net salary: 1200")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Name \*/), { target: { value: "April" } });
    expect(screen.queryByText("Net salary: 1200")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm payment" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ name: "April" }));
    expect(previewCreate).toHaveBeenLastCalledWith({ name: "April" });
  });

  it("shows preview failures and permits retry without making a payment", async () => {
    const previewCreate = vi.fn().mockRejectedValueOnce(new Error("Preview unavailable"))
      .mockResolvedValue(<p>Net salary: 1200</p>);
    const onCreate = vi.fn();
    render(<ResourceSection title="Payments" rows={[]} loading={false} columns={columns}
      fields={[]} onCreate={onCreate} previewCreate={previewCreate} />);
    fireEvent.click(screen.getAllByRole("button", { name: /add payment/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Preview unavailable");
    expect(onCreate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(await screen.findByText("Net salary: 1200")).toBeInTheDocument();
  });

  it("rejects numeric values outside configured period bounds", async () => {
    const onCreate = vi.fn();
    render(<ResourceSection title="Adjustments" rows={[]} loading={false} columns={columns}
      fields={[{ key: "year", label: "Year", type: "number", required: true, min: 2000, integer: true }]}
      onCreate={onCreate} />);
    fireEvent.click(screen.getAllByRole("button", { name: /add adjustment/i })[0]);
    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: "1999" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Year");
    expect(onCreate).not.toHaveBeenCalled();
  });

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

