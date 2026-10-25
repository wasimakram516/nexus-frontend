import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { customFieldsService } from "@/services/customFields.service";
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
    swapPeriodSlots: vi.fn(),
    getClashes: vi.fn(),
    getRooms: vi.fn(),
    getSubstitutions: vi.fn(),
    createSubstitution: vi.fn(),
    cancelSubstitution: vi.fn(),
    getSectionSchedule: vi.fn(),
    getTeacherSchedule: vi.fn(),
    downloadSectionPdf: vi.fn(),
  },
}));

vi.mock("@/services/customFields.service", () => ({
  customFieldsService: { getFormDefinitions: vi.fn() },
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
    vi.mocked(timetableService.swapPeriodSlots).mockReset();
    vi.mocked(timetableService.getClashes).mockReset();
    vi.mocked(timetableService.getRooms).mockReset();
    vi.mocked(timetableService.getSubstitutions).mockReset();
    vi.mocked(timetableService.createSubstitution).mockReset();
    vi.mocked(timetableService.cancelSubstitution).mockReset();
    vi.mocked(timetableService.getClashes).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(timetableService.getRooms).mockResolvedValue({ data: { data: ["Lab 1"] } } as never);
    vi.mocked(timetableService.getSubstitutions).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(customFieldsService.getFormDefinitions).mockReset();
    vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({ data: { data: [] } } as never);
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
    expect(within(mondayPeriod1).getByText("8:00 AM - 8:40 AM")).toBeInTheDocument();
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
      room: null,
      classId: "class-1",
      sectionId: "section-1",
      customFields: {},
    });
    expect(onReload).toHaveBeenCalled();
  });

  it("loads period_slot custom field definitions when the dialog opens, and blocks save until a required one is filled", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({
      data: { data: [{ id: "field-1", fieldKey: "room", label: "Room", inputType: "TEXT", isRequired: true }] },
    } as never);

    renderSection();
    await pickClassAndSection(user);

    await user.click(await screen.findByRole("button", { name: "Add First Period Slot" }));
    const dialog = await screen.findByRole("dialog");

    expect(customFieldsService.getFormDefinitions).toHaveBeenCalledWith({
      entityType: "period_slot",
      institutionId: undefined,
      action: "create",
    });

    await user.type(within(dialog).getByLabelText("Name *"), "Period 1");
    await user.type(within(dialog).getByLabelText("Period Number *"), "1");
    await user.click(within(dialog).getByLabelText(/Day of Week/));
    await user.click(await screen.findByRole("option", { name: "Monday" }));
    await user.type(within(dialog).getByLabelText("Start Time *"), "08:00");
    await user.type(within(dialog).getByLabelText("End Time *"), "08:40");

    const createButton = within(dialog).getByRole("button", { name: "Create" });
    // Every base field is filled but the required custom field (Room) is not.
    expect(createButton).toBeDisabled();

    await user.type(within(dialog).getByLabelText("Room *"), "Lab 2");
    expect(createButton).not.toBeDisabled();

    vi.mocked(timetableService.createPeriodSlot).mockResolvedValue({
      data: { message: "Period slot created.", data: { ...sampleSlot } },
    } as never);
    await user.click(createButton);

    expect(timetableService.createPeriodSlot).toHaveBeenCalledWith(
      expect.objectContaining({ customFields: { room: "Lab 2" } })
    );
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

  it("moves a period to an empty cell when it is dropped there", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [sampleSlot] } } as never);
    vi.mocked(timetableService.updatePeriodSlot).mockResolvedValue({ data: { message: "ok", data: {} } } as never);
    const { onReload } = renderSection();
    await pickClassAndSection(user);

    const source = (await screen.findByTestId("slot-cell-1-MONDAY")).querySelector("[draggable=true]") as HTMLElement;
    fireEvent.dragStart(source);
    fireEvent.drop(screen.getByTestId("empty-cell-1-TUESDAY"));

    await waitFor(() =>
      expect(timetableService.updatePeriodSlot).toHaveBeenCalledWith("slot-1", { periodNumber: 1, dayOfWeek: "TUESDAY" })
    );
    expect(timetableService.swapPeriodSlots).not.toHaveBeenCalled();
    await waitFor(() => expect(onReload).toHaveBeenCalled());
  });

  it("swaps two periods when one is dropped on the other", async () => {
    const user = userEvent.setup();
    const other = { ...secondSlot, periodNumber: 1, dayOfWeek: "TUESDAY" as const };
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [sampleSlot, other] } } as never);
    vi.mocked(timetableService.swapPeriodSlots).mockResolvedValue({ data: { message: "ok", data: {} } } as never);
    renderSection();
    await pickClassAndSection(user);

    const source = (await screen.findByTestId("slot-cell-1-MONDAY")).querySelector("[draggable=true]") as HTMLElement;
    fireEvent.dragStart(source);
    fireEvent.drop(screen.getByTestId("slot-cell-1-TUESDAY"));

    await waitFor(() => expect(timetableService.swapPeriodSlots).toHaveBeenCalledWith("slot-1", "slot-2"));
    expect(timetableService.updatePeriodSlot).not.toHaveBeenCalled();
  });

  it("shows the server's reason when a drop would clash, and changes nothing", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [sampleSlot] } } as never);
    vi.mocked(timetableService.updatePeriodSlot).mockRejectedValue({
      response: { status: 409, data: { message: "Jane Teacher is already teaching Class 2 B at that time." } },
    });
    const { onReload } = renderSection();
    await pickClassAndSection(user);

    const source = (await screen.findByTestId("slot-cell-1-MONDAY")).querySelector("[draggable=true]") as HTMLElement;
    fireEvent.dragStart(source);
    fireEvent.drop(screen.getByTestId("empty-cell-1-TUESDAY"));

    expect(await screen.findByText("Jane Teacher is already teaching Class 2 B at that time.")).toBeInTheDocument();
    expect(onReload).not.toHaveBeenCalled();
  });

  it("shows a dropped period in its new cell straight away, before the server has answered", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [sampleSlot] } } as never);
    vi.mocked(timetableService.updatePeriodSlot).mockReturnValue(new Promise(() => {}) as never);
    renderSection();
    await pickClassAndSection(user);

    const source = (await screen.findByTestId("slot-cell-1-MONDAY")).querySelector("[draggable=true]") as HTMLElement;
    fireEvent.dragStart(source);
    fireEvent.drop(screen.getByTestId("empty-cell-1-TUESDAY"));

    expect(within(await screen.findByTestId("slot-cell-1-TUESDAY")).getByText("Period One")).toBeInTheDocument();
    expect(screen.getByTestId("empty-cell-1-MONDAY")).toBeInTheDocument();
  });

  it("puts a dropped period back when the server refuses it", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [sampleSlot] } } as never);
    vi.mocked(timetableService.updatePeriodSlot).mockRejectedValue({
      response: { status: 409, data: { message: "Room Lab 1 is already in use then." } },
    });
    renderSection();
    await pickClassAndSection(user);

    const source = (await screen.findByTestId("slot-cell-1-MONDAY")).querySelector("[draggable=true]") as HTMLElement;
    fireEvent.dragStart(source);
    fireEvent.drop(screen.getByTestId("empty-cell-1-TUESDAY"));

    expect(await screen.findByText("Room Lab 1 is already in use then.")).toBeInTheDocument();
    expect(await screen.findByTestId("slot-cell-1-MONDAY")).toBeInTheDocument();
    expect(screen.getByTestId("empty-cell-1-TUESDAY")).toBeInTheDocument();
  });

  it("does nothing when a period is dropped back on its own cell", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [sampleSlot] } } as never);
    renderSection();
    await pickClassAndSection(user);

    const cell = await screen.findByTestId("slot-cell-1-MONDAY");
    fireEvent.dragStart(cell.querySelector("[draggable=true]") as HTMLElement);
    fireEvent.drop(cell);

    expect(timetableService.updatePeriodSlot).not.toHaveBeenCalled();
    expect(timetableService.swapPeriodSlots).not.toHaveBeenCalled();
  });

  it("does not let a period be dragged without permission to manage", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [sampleSlot] } } as never);
    renderSection(false);
    await pickClassAndSection(user);

    const cell = await screen.findByTestId("slot-cell-1-MONDAY");

    expect(cell.querySelector("[draggable=true]")).toBeNull();
  });

  it("flags a clashing period and lists the clash", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [sampleSlot] } } as never);
    const side = (id: string, section: string) => ({
      id,
      className: "Class 1",
      sectionName: section,
      teacherName: "Jane Teacher",
      room: null,
      dayOfWeek: "MONDAY",
      startTime: "08:00",
      endTime: "08:40",
    });
    vi.mocked(timetableService.getClashes).mockResolvedValue({
      data: { data: [{ kind: "TEACHER", first: side("slot-1", "A"), second: side("other", "B") }] },
    } as never);
    renderSection();
    await pickClassAndSection(user);

    const cell = await screen.findByTestId("slot-cell-1-MONDAY");

    expect(await within(cell).findByText("Clash")).toBeInTheDocument();
    expect(screen.getByText("1 clash on this campus.")).toBeInTheDocument();
    expect(screen.getByText(/Teacher clash: Class 1 A and Class 1 B/)).toBeInTheDocument();
  });

  it("sends the room typed on a period, and offers rooms already used", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(timetableService.createPeriodSlot).mockResolvedValue({ data: { message: "ok", data: {} } } as never);
    renderSection();
    await pickClassAndSection(user);

    await user.click(await screen.findByRole("button", { name: "Add First Period Slot" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Name *"), "Period 1");
    await user.type(within(dialog).getByLabelText("Period Number *"), "1");
    await user.click(within(dialog).getByLabelText(/Day of Week/));
    await user.click(await screen.findByRole("option", { name: "Monday" }));
    await user.type(within(dialog).getByLabelText("Start Time *"), "08:00");
    await user.type(within(dialog).getByLabelText("End Time *"), "08:40");
    await user.click(within(dialog).getByLabelText("Room"));
    expect(await screen.findByRole("option", { name: "Lab 1" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Lab 1" }));
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(timetableService.createPeriodSlot).toHaveBeenCalledWith(expect.objectContaining({ room: "Lab 1" }));
  });

  it("opens a printable week for the section", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [sampleSlot] } } as never);
    vi.mocked(timetableService.getSectionSchedule).mockResolvedValue({
      data: {
        data: {
          week: { from: "2026-11-02", to: "2026-11-08" },
          group: { kind: "SECTION", id: "section-1", title: "Class 1, section A", subtitle: null, entries: [] },
        },
      },
    } as never);
    renderSection();
    await pickClassAndSection(user);

    await user.click(await screen.findByRole("button", { name: /print \/ pdf/i }));

    expect(await screen.findByText("Class 1, section A")).toBeInTheDocument();
    expect(screen.getByText("Week of 2 Nov 2026 to 8 Nov 2026")).toBeInTheDocument();
    expect(timetableService.getSectionSchedule).toHaveBeenCalledWith("section-1");
  });

  it("prints a teacher's week instead when one is chosen", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [sampleSlot] } } as never);
    const reply = (title: string, kind: string) => ({
      data: { data: { week: { from: "2026-11-02", to: "2026-11-08" }, group: { kind, id: "g", title, subtitle: null, entries: [] } } },
    });
    vi.mocked(timetableService.getSectionSchedule).mockResolvedValue(reply("Class 1, section A", "SECTION") as never);
    vi.mocked(timetableService.getTeacherSchedule).mockResolvedValue(reply("Jane Teacher", "TEACHER") as never);
    renderSection();
    await pickClassAndSection(user);

    await user.click(await screen.findByRole("button", { name: /print \/ pdf/i }));
    await screen.findByText("Class 1, section A");
    await user.click(screen.getByLabelText("Timetable of"));
    await user.click(await screen.findByRole("option", { name: "Jane Teacher" }));

    expect(await screen.findByText("Week of 2 Nov 2026 to 8 Nov 2026")).toBeInTheDocument();
    expect(timetableService.getTeacherSchedule).toHaveBeenCalledWith("teacher-1");
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
