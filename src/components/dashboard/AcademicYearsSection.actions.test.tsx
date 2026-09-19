import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  showMessage: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  setCurrent: vi.fn(),
}));

vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/academics.service", () => ({
  academicsService: {
    createAcademicYear: mocks.create, updateAcademicYear: mocks.update,
    deleteAcademicYear: mocks.remove, setCurrentAcademicYear: mocks.setCurrent,
  },
}));

import AcademicYearsSection, { type AcademicYear } from "./AcademicYearsSection";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

const campuses = [{ id: "c1", name: "Main" }, { id: "c2", name: "North" }];
const years: AcademicYear[] = [
  { id: "y1", name: "2025-26", startDate: "2025-08-01T00:00:00Z", endDate: "2026-06-30T00:00:00Z", isCurrent: true, campusOverrides: [], createdAt: "2025-07-01T00:00:00Z" },
  {
    id: "y2", name: "2026-27", startDate: "2026-08-01T00:00:00Z", endDate: "2027-06-30T00:00:00Z", isCurrent: false, createdAt: "2026-07-01T00:00:00Z",
    campusOverrides: [{ campusId: "c2", startDate: "2026-09-01T00:00:00Z", endDate: null }],
  },
];

function setup(props: Partial<React.ComponentProps<typeof AcademicYearsSection>> = {}) {
  const onReload = vi.fn();
  render(<AcademicYearsSection academicYears={years} campuses={campuses} loading={false} canManage onReload={onReload} {...props} />);
  return { onReload };
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of [mocks.create, mocks.update, mocks.remove, mocks.setCurrent]) fn.mockImplementation(() => ok());
});

describe("AcademicYearsSection actions", () => {
  it("shows a spinner while loading and an empty state with a create action", () => {
    const { unmount } = render(<AcademicYearsSection academicYears={[]} campuses={[]} loading canManage onReload={() => {}} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    unmount();
    setup({ academicYears: [] });
    expect(screen.getByText("No academic years yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add First Academic Year" })).toBeInTheDocument();
  });

  it("hides every management control for read-only users", () => {
    setup({ canManage: false });
    expect(screen.queryByRole("button", { name: /Add Academic Year/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Set Current")).not.toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    expect(screen.getByText("2025-26")).toBeInTheDocument();
  });

  it("offers Set Current only for non-current years and forwards the institution id", async () => {
    const { onReload } = setup({ institutionId: "inst-9" });
    expect(screen.getAllByRole("button", { name: "Set Current" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Set Current" }));
    await waitFor(() => expect(mocks.setCurrent).toHaveBeenCalledWith("y2", "inst-9"));
    await waitFor(() => expect(onReload).toHaveBeenCalled());
    expect(mocks.showMessage).toHaveBeenCalledWith('"2026-27" is now the current academic year.', "success");
  });

  it("edits a year using date-only values from the stored timestamps", async () => {
    const { onReload } = setup();
    const row = screen.getByText("2025-26").closest("tr")!;
    fireEvent.click(within(row).getByTestId("EditIcon").closest("button")!);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/Start Date/)).toHaveValue("2025-08-01");
    expect(within(dialog).getByLabelText(/End Date/)).toHaveValue("2026-06-30");
    fireEvent.change(within(dialog).getByLabelText(/Name/), { target: { value: "2025-26 revised" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("y1", { name: "2025-26 revised", startDate: "2025-08-01", endDate: "2026-06-30" }, undefined));
    await waitFor(() => expect(onReload).toHaveBeenCalled());
  });

  it("does not reload or close the dialog when creating fails", async () => {
    mocks.create.mockRejectedValue(new Error("Overlaps another year"));
    const { onReload } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Add Academic Year" }));
    const dialog = await screen.findByRole("dialog");
    const create = within(dialog).getByRole("button", { name: "Create" });
    expect(create).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText(/Name/), { target: { value: "X" } });
    fireEvent.change(within(dialog).getByLabelText(/Start Date/), { target: { value: "2027-01-01" } });
    fireEvent.change(within(dialog).getByLabelText(/End Date/), { target: { value: "2027-12-31" } });
    fireEvent.click(create);
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("Overlaps another year", "error"));
    expect(onReload).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("deletes only after confirmation", async () => {
    const { onReload } = setup({ institutionId: "inst-9" });
    const row = screen.getByText("2026-27").closest("tr")!;
    fireEvent.click(within(row).getByTestId("DeleteIcon").closest("button")!);
    expect(await screen.findByText(/delete "2026-27"\?/)).toBeInTheDocument();
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("y2", "inst-9"));
    await waitFor(() => expect(onReload).toHaveBeenCalled());
  });

  it("seeds the override editor from existing overrides and saves only enabled campuses", async () => {
    const { onReload } = setup();
    const row = screen.getByText("2026-27").closest("tr")!;
    fireEvent.click(within(row).getByTestId("EditCalendarIcon").closest("button")!);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Campus Overrides — 2026-27/)).toBeInTheDocument();
    const [main, north] = within(dialog).getAllByRole("checkbox");
    expect(main).not.toBeChecked();
    expect(north).toBeChecked();
    expect(within(dialog).getByLabelText("Start Date")).toHaveValue("2026-09-01");
    expect(within(dialog).getByLabelText("End Date")).toHaveValue("");
    fireEvent.click(main);
    const [mainStart] = within(dialog).getAllByLabelText("Start Date");
    fireEvent.change(mainStart, { target: { value: "2026-08-15" } });
    fireEvent.click(north);
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("y2", { campusOverrides: [{ campusId: "c1", startDate: "2026-08-15" }] }, undefined));
    await waitFor(() => expect(onReload).toHaveBeenCalled());
  });

  it("says so when there are no campuses to override", async () => {
    setup({ campuses: [] });
    const row = screen.getByText("2025-26").closest("tr")!;
    fireEvent.click(within(row).getByTestId("EditCalendarIcon").closest("button")!);
    expect(await screen.findByText("No campuses to override yet.")).toBeInTheDocument();
  });
});
