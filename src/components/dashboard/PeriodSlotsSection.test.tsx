import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { timetableService } from "@/services/timetable.service";
import PeriodSlotsSection, { PeriodSlot } from "./PeriodSlotsSection";

vi.mock("@/services/timetable.service", () => ({
  timetableService: {
    createPeriodSlot: vi.fn(),
    getPeriodSlots: vi.fn(),
    getPeriodSlot: vi.fn(),
    updatePeriodSlot: vi.fn(),
    deletePeriodSlot: vi.fn(),
    getSectionWeek: vi.fn(),
  },
}));

const levels = [{ id: "level-1", name: "Level 1", campusId: "campus-1" }];
const classes = [{ id: "class-1", name: "Class 1", levelId: "level-1" }];
const sections = [{ id: "section-1", name: "Section A", classId: "class-1" }];
const subjects = [{ id: "subject-1", name: "Math", classId: "class-1" }];
const teachers = [{ id: "teacher-1", userId: "user-1", campusId: "campus-1" }];
const teacherName = (id: string) => (id === "teacher-1" ? "Jane Teacher" : "—");

const sampleSlot: PeriodSlot = {
  id: "slot-1",
  campusId: "campus-1",
  classId: "class-1",
  sectionId: "section-1",
  subjectId: "subject-1",
  staffProfileId: "teacher-1",
  name: "Period One",
  periodNumber: 1,
  dayOfWeek: "MONDAY",
  startTime: "08:00",
  endTime: "08:40",
  createdAt: "2026-08-01T00:00:00.000Z",
};

const secondSlot: PeriodSlot = {
  id: "slot-2",
  campusId: "campus-1",
  classId: "class-1",
  sectionId: "section-1",
  subjectId: null,
  staffProfileId: null,
  name: "Recess",
  periodNumber: 2,
  dayOfWeek: "WEDNESDAY",
  startTime: "10:00",
  endTime: "10:20",
  createdAt: "2026-08-01T00:00:00.000Z",
};

function renderSection(canManage = true, onReload = vi.fn()) {
  return {
    onReload,
    ...render(
      <MessageProvider>
        <PeriodSlotsSection
          classes={classes}
          levels={levels}
          sections={sections}
          subjects={subjects}
          teachers={teachers}
          teacherName={teacherName}
          canManage={canManage}
          onReload={onReload}
        />
      </MessageProvider>
    ),
  };
}

/** Selects Class 1 then Section A via the cascading pickers. */
async function pickClassAndSection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText("Class"));
  await user.click(await screen.findByRole("option", { name: "Class 1" }));

  await user.click(screen.getByLabelText("Section"));
  await user.click(await screen.findByRole("option", { name: "Section A" }));
}

describe("PeriodSlotsSection", () => {
  beforeEach(() => {
    vi.mocked(timetableService.createPeriodSlot).mockReset();
    vi.mocked(timetableService.getSectionWeek).mockReset();
    vi.mocked(timetableService.updatePeriodSlot).mockReset();
    vi.mocked(timetableService.deletePeriodSlot).mockReset();
  });

  it("prompts to pick a class and section before showing any grid", () => {
    renderSection();
    expect(screen.getByText(/Pick a class and section above/i)).toBeInTheDocument();
  });

  it("renders slots in their correct day/period grid cells", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({
      data: { data: [sampleSlot, secondSlot] },
    } as never);

    renderSection();
    await pickClassAndSection(user);

    expect(timetableService.getSectionWeek).toHaveBeenCalledWith("section-1");

    // Period 1 / Monday holds "Period One" with its subject and teacher.
    const mondayPeriod1 = await screen.findByTestId("slot-cell-1-MONDAY");
    expect(within(mondayPeriod1).getByText("Period One")).toBeInTheDocument();
    expect(within(mondayPeriod1).getByText("08:00–08:40")).toBeInTheDocument();
    expect(within(mondayPeriod1).getByText("Math")).toBeInTheDocument();
    expect(within(mondayPeriod1).getByText("Jane Teacher")).toBeInTheDocument();

    // Period 1 / Tuesday is empty — an Add affordance, not a slot.
    expect(screen.getByTestId("empty-cell-1-TUESDAY")).toBeInTheDocument();

    // Period 2 / Wednesday holds "Recess" with no subject/teacher shown.
    const wedPeriod2 = screen.getByTestId("slot-cell-2-WEDNESDAY");
    expect(within(wedPeriod2).getByText("Recess")).toBeInTheDocument();
    expect(within(wedPeriod2).queryByText("Math")).not.toBeInTheDocument();

    // Period 2 / Monday is empty (Recess is Wednesday-only for period 2).
    expect(screen.getByTestId("empty-cell-2-MONDAY")).toBeInTheDocument();
  });

  it("blocks period slot creation until name, period number, day and times are filled in", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [] } } as never);

    renderSection();
    await pickClassAndSection(user);

    await user.click(await screen.findByRole("button", { name: "Add First Period Slot" }));
    const dialog = await screen.findByRole("dialog");
    const createButton = within(dialog).getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();

    await user.type(within(dialog).getByLabelText("Name *"), "Period 1");
    expect(createButton).toBeDisabled();

    await user.type(within(dialog).getByLabelText("Period Number *"), "1");
    expect(createButton).toBeDisabled();

    await user.click(within(dialog).getByLabelText(/Day of Week/));
    await user.click(await screen.findByRole("option", { name: "Monday" }));
    expect(createButton).toBeDisabled();

    const startTime = within(dialog).getByLabelText("Start Time *");
    const endTime = within(dialog).getByLabelText("End Time *");
    await user.type(startTime, "08:00");
    expect(createButton).toBeDisabled();
    await user.type(endTime, "08:40");

    expect(createButton).not.toBeDisabled();
    expect(timetableService.createPeriodSlot).not.toHaveBeenCalled();
  });

  it("submits the create dialog with subject/teacher left blank as null", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(timetableService.createPeriodSlot).mockResolvedValue({
      data: { message: "Period slot created.", data: { ...sampleSlot } },
    } as never);

    const { onReload } = renderSection();
    await pickClassAndSection(user);

    await user.click(await screen.findByRole("button", { name: "Add First Period Slot" }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Name *"), "Period 1");
    await user.type(within(dialog).getByLabelText("Period Number *"), "1");
    await user.click(within(dialog).getByLabelText(/Day of Week/));
    await user.click(await screen.findByRole("option", { name: "Monday" }));
    await user.type(within(dialog).getByLabelText("Start Time *"), "08:00");
    await user.type(within(dialog).getByLabelText("End Time *"), "08:40");

    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(timetableService.createPeriodSlot).toHaveBeenCalledWith({
      name: "Period 1",
      periodNumber: 1,
      dayOfWeek: "MONDAY",
      startTime: "08:00",
      endTime: "08:40",
      subjectId: null,
      staffProfileId: null,
      classId: "class-1",
      sectionId: "section-1",
    });
    expect(onReload).toHaveBeenCalled();
  });

  it("asks for confirmation before deleting a slot, then calls the service", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({
      data: { data: [sampleSlot] },
    } as never);
    vi.mocked(timetableService.deletePeriodSlot).mockResolvedValue({
      data: { message: "Moved to recycle bin.", data: null },
    } as never);

    const { onReload } = renderSection();
    await pickClassAndSection(user);

    const cell = await screen.findByTestId("slot-cell-1-MONDAY");
    await user.click(within(cell).getByRole("button", { name: /delete period one/i }));

    const confirmDialog = await screen.findByRole("dialog");
    expect(timetableService.deletePeriodSlot).not.toHaveBeenCalled();

    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

    expect(timetableService.deletePeriodSlot).toHaveBeenCalledWith("slot-1");
    expect(onReload).toHaveBeenCalled();
  });

  it("hides add/delete affordances when canManage is false", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({
      data: { data: [sampleSlot] },
    } as never);

    renderSection(false);
    await pickClassAndSection(user);

    const occupiedCell = await screen.findByTestId("slot-cell-1-MONDAY");
    expect(within(occupiedCell).queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();

    const emptyCell = screen.getByTestId("empty-cell-1-TUESDAY");
    expect(within(emptyCell).queryByRole("button")).not.toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /add period slot/i })).not.toBeInTheDocument();
  });
});
