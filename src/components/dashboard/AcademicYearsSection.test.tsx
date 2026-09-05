import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { academicsService } from "@/services/academics.service";
import AcademicYearsSection, { AcademicYear } from "./AcademicYearsSection";

vi.mock("@/services/academics.service", () => ({
  academicsService: {
    createAcademicYear: vi.fn(),
    updateAcademicYear: vi.fn(),
    deleteAcademicYear: vi.fn(),
    setCurrentAcademicYear: vi.fn(),
  },
}));

const campuses = [
  { id: "campus-1", name: "Main Campus" },
  { id: "campus-2", name: "North Campus" },
];

const years: AcademicYear[] = [
  {
    id: "year-1",
    name: "2025-26",
    startDate: "2025-08-01T00:00:00.000Z",
    endDate: "2026-06-30T00:00:00.000Z",
    isCurrent: true,
    campusOverrides: [],
    createdAt: "2025-07-01T00:00:00.000Z",
  },
  {
    id: "year-2",
    name: "2026-27",
    startDate: "2026-08-01T00:00:00.000Z",
    endDate: "2027-06-30T00:00:00.000Z",
    isCurrent: false,
    campusOverrides: [],
    createdAt: "2026-07-01T00:00:00.000Z",
  },
];

function renderSection(canManage = true, onReload = vi.fn(), institutionId?: string) {
  return render(
    <MessageProvider>
      <AcademicYearsSection
        academicYears={years}
        campuses={campuses}
        loading={false}
        canManage={canManage}
        institutionId={institutionId}
        onReload={onReload}
      />
    </MessageProvider>
  );
}

describe("AcademicYearsSection", () => {
  beforeEach(() => {
    vi.mocked(academicsService.createAcademicYear).mockReset();
    vi.mocked(academicsService.updateAcademicYear).mockReset();
    vi.mocked(academicsService.deleteAcademicYear).mockReset();
    vi.mocked(academicsService.setCurrentAcademicYear).mockReset();
  });

  it("renders rows with the Current chip only on the current row", () => {
    renderSection();

    expect(screen.getByText("2025-26")).toBeInTheDocument();
    expect(screen.getByText("2026-27")).toBeInTheDocument();

    const currentRow = screen.getByText("2025-26").closest("tr")!;
    const otherRow = screen.getByText("2026-27").closest("tr")!;
    expect(within(currentRow).getByText("Current")).toBeInTheDocument();
    expect(within(otherRow).queryByText("Current")).not.toBeInTheDocument();
  });

  it("submits the create dialog with the right payload", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    vi.mocked(academicsService.createAcademicYear).mockResolvedValue({
      data: { message: "Academic year created.", data: { id: "year-3" } },
    } as never);

    renderSection(true, onReload);

    await user.click(screen.getByRole("button", { name: /add academic year/i }));

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/Name \*/), "2027-28");
    await user.type(within(dialog).getByLabelText(/Start Date \*/), "2027-08-01");
    await user.type(within(dialog).getByLabelText(/End Date \*/), "2028-06-30");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(academicsService.createAcademicYear).toHaveBeenCalledWith(
      { name: "2027-28", startDate: "2027-08-01", endDate: "2028-06-30" },
      undefined
    );
    expect(onReload).toHaveBeenCalled();
  });

  it("calls setCurrentAcademicYear when Set Current is clicked on a non-current row", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    vi.mocked(academicsService.setCurrentAcademicYear).mockResolvedValue({
      data: { message: "Now current.", data: {} },
    } as never);

    renderSection(true, onReload);

    const otherRow = screen.getByText("2026-27").closest("tr")!;
    await user.click(within(otherRow).getByRole("button", { name: /set current/i }));

    expect(academicsService.setCurrentAcademicYear).toHaveBeenCalledWith("year-2", undefined);
    expect(onReload).toHaveBeenCalled();

    const currentRow = screen.getByText("2025-26").closest("tr")!;
    expect(within(currentRow).queryByRole("button", { name: /set current/i })).not.toBeInTheDocument();
  });

  it("asks for confirmation before deleting a row", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    vi.mocked(academicsService.deleteAcademicYear).mockResolvedValue({
      data: { message: "Moved to recycle bin.", data: {} },
    } as never);

    renderSection(true, onReload);

    const row = screen.getByText("2026-27").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /delete/i }));

    const confirmDialog = await screen.findByRole("dialog");
    expect(academicsService.deleteAcademicYear).not.toHaveBeenCalled();

    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));
    expect(academicsService.deleteAcademicYear).toHaveBeenCalledWith("year-2", undefined);
    expect(onReload).toHaveBeenCalled();
  });

  it("hides management actions when canManage is false", () => {
    renderSection(false);

    expect(screen.queryByRole("button", { name: /add academic year/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /set current/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
  });

  it("forwards institutionId to the service call when set (platform console)", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    vi.mocked(academicsService.setCurrentAcademicYear).mockResolvedValue({
      data: { message: "Now current.", data: {} },
    } as never);

    renderSection(true, onReload, "institution-99");

    const otherRow = screen.getByText("2026-27").closest("tr")!;
    await user.click(within(otherRow).getByRole("button", { name: /set current/i }));

    expect(academicsService.setCurrentAcademicYear).toHaveBeenCalledWith("year-2", "institution-99");
  });
});
