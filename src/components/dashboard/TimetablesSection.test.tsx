import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { shiftWeek, todayString, type WeekEntry } from "@/lib/timetableDocuments";
import { timetableService } from "@/services/timetable.service";
import TimetablesSection from "./TimetablesSection";

vi.mock("@/services/timetable.service", () => ({
  timetableService: {
    getCampusSchedule: vi.fn(),
    getClassSchedule: vi.fn(),
    getTeacherSchedule: vi.fn(),
    downloadCampusPdf: vi.fn(),
    downloadClassPdf: vi.fn(),
    downloadTeacherPdf: vi.fn(),
  },
}));

const entry = (id: string, overrides: Partial<WeekEntry> = {}): WeekEntry => ({
  id,
  dayOfWeek: "MONDAY",
  periodNumber: 1,
  name: "Period 1",
  startTime: "08:00",
  endTime: "08:40",
  room: null,
  sectionId: "sec-a",
  className: "Grade 5",
  sectionName: "A",
  subjectName: "Maths",
  staffProfileId: "t1",
  teacherName: "Teacher One",
  date: "2026-11-02",
  effectiveTeacherName: "Teacher One",
  isCovered: false,
  coverSubstituteName: null,
  coverReason: null,
  isCoverDuty: false,
  ...overrides,
});

const sectionA = { kind: "SECTION" as const, id: "sec-a", title: "Grade 5, section A", subtitle: null, entries: [entry("a1"), entry("a2", { dayOfWeek: "TUESDAY", date: "2026-11-03", subjectName: "Science", staffProfileId: "t2", effectiveTeacherName: "Teacher Two" })] };
const sectionB = { kind: "SECTION" as const, id: "sec-b", title: "Grade 5, section B", subtitle: null, entries: [entry("b1", { sectionName: "B", subjectName: "English", staffProfileId: "t2", effectiveTeacherName: "Teacher Two" })] };

const week = { from: "2026-11-02", to: "2026-11-08" };
const groupsReply = (groups: unknown[]) => ({ data: { data: { week, groups } } });

const campuses = [{ id: "campus-1", name: "Main" }, { id: "campus-2", name: "North" }];
const levels = [{ id: "level-1", name: "Primary", campusId: "campus-1" }, { id: "level-2", name: "Primary N", campusId: "campus-2" }];
const classes = [{ id: "class-1", name: "Grade 5", levelId: "level-1" }, { id: "class-2", name: "Grade 6 North", levelId: "level-2" }];
const teachers = [{ id: "t1", campusId: "campus-1" }, { id: "t2", campusId: "campus-1" }, { id: "t3", campusId: "campus-2" }];
const teacherName = (id: string) => ({ t1: "Teacher One", t2: "Teacher Two", t3: "Teacher Three" })[id] ?? "—";

const renderIt = () =>
  render(
    <MessageProvider>
      <TimetablesSection campuses={campuses} levels={levels} classes={classes} teachers={teachers} teacherName={teacherName} />
    </MessageProvider>
  );

describe("TimetablesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(timetableService.getCampusSchedule).mockResolvedValue(groupsReply([sectionA, sectionB]) as never);
  });

  it("starts on the first campus with every section's timetable for this week", async () => {
    renderIt();

    expect(await screen.findByText("Grade 5, section A")).toBeInTheDocument();
    expect(screen.getByText("Grade 5, section B")).toBeInTheDocument();
    expect(timetableService.getCampusSchedule).toHaveBeenCalledWith("campus-1", todayString());
    expect(screen.getByText("2 Nov 2026 to 8 Nov 2026")).toBeInTheDocument();
  });

  it("moves a week at a time", async () => {
    const user = userEvent.setup();
    renderIt();
    await screen.findByText("Grade 5, section A");

    await user.click(screen.getByRole("button", { name: "Next week" }));

    await waitFor(() => expect(timetableService.getCampusSchedule).toHaveBeenLastCalledWith("campus-1", shiftWeek(todayString(), 1)));
  });

  it("narrows to one day without asking the server again", async () => {
    const user = userEvent.setup();
    renderIt();
    await screen.findByText("Grade 5, section A");
    const calls = vi.mocked(timetableService.getCampusSchedule).mock.calls.length;

    await user.click(screen.getByLabelText("Day"));
    await user.click(await screen.findByRole("option", { name: "Tuesday" }));

    expect(screen.getAllByText("Tuesday").length).toBeGreaterThan(0);
    expect(screen.queryByText("Wednesday")).not.toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();
    expect(screen.queryByText("Maths")).not.toBeInTheDocument();
    expect(vi.mocked(timetableService.getCampusSchedule).mock.calls.length).toBe(calls);
  });

  it("keeps only one teacher's periods, and drops sections where they have none", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getCampusSchedule).mockResolvedValue(
      groupsReply([sectionA, { ...sectionB, entries: [entry("b9", { sectionName: "B", staffProfileId: "t2", subjectName: "English" })] }]) as never
    );
    renderIt();
    await screen.findByText("Grade 5, section A");

    await user.click(screen.getByLabelText("Only periods of"));
    await user.click(await screen.findByRole("option", { name: "Teacher One" }));

    expect(screen.getByText("Grade 5, section A")).toBeInTheDocument();
    expect(screen.queryByText("Grade 5, section B")).not.toBeInTheDocument();
    expect(screen.queryByText("Science")).not.toBeInTheDocument();
  });

  it("shows a class's sections once a class is picked, listing only the campus's classes", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getClassSchedule).mockResolvedValue(groupsReply([sectionA, sectionB]) as never);
    renderIt();
    await screen.findByText("Grade 5, section A");

    await user.click(screen.getByLabelText("View"));
    await user.click(await screen.findByRole("option", { name: "A class" }));
    expect(screen.getByText("Pick a class to see its sections.")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Class"));
    expect(screen.queryByRole("option", { name: "Grade 6 North" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("option", { name: "Grade 5" }));

    expect(await screen.findByText("Grade 5, section B")).toBeInTheDocument();
    expect(timetableService.getClassSchedule).toHaveBeenCalledWith("class-1", todayString());
  });

  it("shows a teacher's own week from the teacher view, and only that campus's teachers", async () => {
    const user = userEvent.setup();
    vi.mocked(timetableService.getTeacherSchedule).mockResolvedValue({
      data: { data: { week, group: { kind: "TEACHER", id: "t1", title: "Teacher One", subtitle: null, entries: [entry("x1")] } } },
    } as never);
    renderIt();
    await screen.findByText("Grade 5, section A");

    await user.click(screen.getByLabelText("View"));
    await user.click(await screen.findByRole("option", { name: "A teacher" }));
    expect(screen.getByText("Pick a teacher to see their week.")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Teacher"));
    expect(screen.queryByRole("option", { name: "Teacher Three" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("option", { name: "Teacher One" }));

    expect(await screen.findByRole("heading", { name: "Teacher One" })).toBeInTheDocument();
    expect(timetableService.getTeacherSchedule).toHaveBeenCalledWith("t1", todayString());
  });

  it("changing campus clears the class and teacher choices", async () => {
    const user = userEvent.setup();
    renderIt();
    await screen.findByText("Grade 5, section A");

    await user.click(screen.getByLabelText("Campus"));
    await user.click(await screen.findByRole("option", { name: "North" }));

    await waitFor(() => expect(timetableService.getCampusSchedule).toHaveBeenLastCalledWith("campus-2", todayString()));
  });

  it("downloads the PDF for the chosen view", async () => {
    vi.mocked(timetableService.downloadCampusPdf).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderIt();
    await screen.findByText("Grade 5, section A");

    await user.click(screen.getByRole("button", { name: /download pdf/i }));

    expect(timetableService.downloadCampusPdf).toHaveBeenCalledWith("campus-1", todayString());
  });

  it("shows why a download was refused", async () => {
    vi.mocked(timetableService.downloadCampusPdf).mockRejectedValue(new Error("There is no timetable to print yet."));
    const user = userEvent.setup();
    renderIt();
    await screen.findByText("Grade 5, section A");

    await user.click(screen.getByRole("button", { name: /download pdf/i }));

    expect(await screen.findByText("There is no timetable to print yet.")).toBeInTheDocument();
  });

  it("says when there are no periods, and cannot download them", async () => {
    vi.mocked(timetableService.getCampusSchedule).mockResolvedValue(groupsReply([]) as never);
    renderIt();

    expect(await screen.findByText("There are no periods to show.")).toBeInTheDocument();
    expect(within(document.body).getByRole("button", { name: /download pdf/i })).toBeDisabled();
  });
});
