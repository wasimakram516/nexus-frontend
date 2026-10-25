import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { timetableService } from "@/services/timetable.service";
import SubstitutionsPanel from "./SubstitutionsPanel";

vi.mock("@/services/timetable.service", () => ({
  timetableService: {
    getSubstitutions: vi.fn(),
    createSubstitution: vi.fn(),
    cancelSubstitution: vi.fn(),
  },
}));

const weekSlots = [
  { id: "slot-1", name: "Period 1", dayOfWeek: "MONDAY" as const, startTime: "08:00", endTime: "08:40", staffProfileId: "t1" },
];
const teachers = [{ id: "t1" }, { id: "t2" }];
const teacherName = (id: string) => (id === "t1" ? "Teacher One" : "Teacher Two");

const arranged = {
  id: "sub-1",
  date: "2026-11-02",
  reason: "Sick leave",
  substituteName: "Teacher Two",
  originalName: "Teacher One",
  periodName: "Period 1",
  subjectName: "Maths",
  dayOfWeek: "MONDAY",
  startTime: "08:00",
  endTime: "08:40",
};

const renderPanel = (canManage = true) =>
  render(
    <MessageProvider>
      <SubstitutionsPanel campusId="campus-1" sectionId="sec-1" weekSlots={weekSlots} teachers={teachers} teacherName={teacherName} canManage={canManage} />
    </MessageProvider>
  );

describe("SubstitutionsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(timetableService.getSubstitutions).mockResolvedValue({ data: { data: [] } } as never);
  });

  it("lists the next four weeks of cover for the section", async () => {
    vi.mocked(timetableService.getSubstitutions).mockResolvedValue({ data: { data: [arranged] } } as never);

    renderPanel();

    expect(await screen.findByText("Sick leave")).toBeInTheDocument();
    expect(screen.getByText("Teacher Two")).toBeInTheDocument();
    expect(screen.getByText("Monday 2 Nov 2026")).toBeInTheDocument();
    expect(timetableService.getSubstitutions).toHaveBeenCalledWith(expect.objectContaining({ campusId: "campus-1", sectionId: "sec-1" }));
  });

  it("says so when none is arranged", async () => {
    renderPanel();

    expect(await screen.findByText("No cover is arranged for this section.")).toBeInTheDocument();
  });

  it("arranges cover for a period on a date, with someone other than its teacher", async () => {
    vi.mocked(timetableService.createSubstitution).mockResolvedValue({ data: { message: "ok", data: {} } } as never);
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("No cover is arranged for this section.");

    await user.click(screen.getByRole("button", { name: "Arrange Cover" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByLabelText("Period *"));
    await user.click(await screen.findByRole("option", { name: /Monday · Period 1/ }));
    await user.type(within(dialog).getByLabelText("Date *"), "2026-11-09");
    await user.click(within(dialog).getByLabelText("Covered by *"));
    expect(screen.queryByRole("option", { name: "Teacher One" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("option", { name: "Teacher Two" }));
    await user.type(within(dialog).getByLabelText("Reason"), "Training");
    await user.click(within(dialog).getByRole("button", { name: "Arrange" }));

    expect(timetableService.createSubstitution).toHaveBeenCalledWith({
      periodSlotId: "slot-1",
      date: "2026-11-09",
      substituteStaffProfileId: "t2",
      reason: "Training",
    });
  });

  it("refuses a date that is not the period's weekday before asking the server", async () => {
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("No cover is arranged for this section.");

    await user.click(screen.getByRole("button", { name: "Arrange Cover" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByLabelText("Period *"));
    await user.click(await screen.findByRole("option", { name: /Monday · Period 1/ }));
    await user.type(within(dialog).getByLabelText("Date *"), "2026-11-10");
    await user.click(within(dialog).getByLabelText("Covered by *"));
    await user.click(await screen.findByRole("option", { name: "Teacher Two" }));

    expect(within(dialog).getByText("That date is not a Monday.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Arrange" })).toBeDisabled();
    expect(timetableService.createSubstitution).not.toHaveBeenCalled();
  });

  it("cancels cover after confirmation", async () => {
    vi.mocked(timetableService.getSubstitutions).mockResolvedValue({ data: { data: [arranged] } } as never);
    vi.mocked(timetableService.cancelSubstitution).mockResolvedValue({ data: { message: "ok", data: {} } } as never);
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Cancel cover on 2 Nov 2026" }));
    const dialog = await screen.findByRole("dialog");
    expect(timetableService.cancelSubstitution).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Cancel Cover" }));

    expect(timetableService.cancelSubstitution).toHaveBeenCalledWith("sub-1");
  });

  it("only lists cover for someone who cannot manage the timetable", async () => {
    vi.mocked(timetableService.getSubstitutions).mockResolvedValue({ data: { data: [arranged] } } as never);

    renderPanel(false);

    await screen.findByText("Sick leave");
    expect(screen.queryByRole("button", { name: "Arrange Cover" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancel cover/i })).not.toBeInTheDocument();
  });
});
