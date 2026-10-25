import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { timetableService } from "@/services/timetable.service";
import MyTimetableManager from "./MyTimetableManager";
import { shiftWeek, todayString } from "@/lib/timetableDocuments";

vi.mock("@/services/timetable.service", () => ({
  timetableService: { getMySchedule: vi.fn(), downloadMyPdf: vi.fn() },
}));

const entry = {
  id: "e1",
  dayOfWeek: "MONDAY",
  periodNumber: 1,
  name: "Period 1",
  startTime: "08:00",
  endTime: "08:40",
  room: null,
  sectionId: "sec-1",
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
};

const reply = (groups: unknown[]) => ({
  data: { data: { week: { from: "2026-11-02", to: "2026-11-08" }, groups } },
});

const renderIt = () =>
  render(
    <MessageProvider>
      <MyTimetableManager />
    </MessageProvider>
  );

describe("MyTimetableManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows each timetable the server returns, under its own title", async () => {
    vi.mocked(timetableService.getMySchedule).mockResolvedValue(
      reply([
        { kind: "STUDENT", id: "s1", title: "Ayesha", subtitle: "Grade 5 A", entries: [entry] },
        { kind: "STUDENT", id: "s2", title: "Bilal", subtitle: null, entries: [] },
      ]) as never
    );

    renderIt();

    expect(await screen.findByText("Ayesha")).toBeInTheDocument();
    expect(screen.getByText("Bilal")).toBeInTheDocument();
    expect(screen.getByText("Maths")).toBeInTheDocument();
    expect(screen.getByText("2 Nov 2026 to 8 Nov 2026")).toBeInTheDocument();
  });

  it("says so when there is no timetable", async () => {
    vi.mocked(timetableService.getMySchedule).mockResolvedValue(reply([]) as never);

    renderIt();

    expect(await screen.findByText("There is no timetable to show yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeDisabled();
  });

  it("moves a week at a time and asks for that week", async () => {
    vi.mocked(timetableService.getMySchedule).mockResolvedValue(reply([]) as never);
    const user = userEvent.setup();
    renderIt();
    await screen.findByText("There is no timetable to show yet.");

    await user.click(screen.getByRole("button", { name: "Next week" }));

    await waitFor(() => expect(timetableService.getMySchedule).toHaveBeenLastCalledWith(shiftWeek(todayString(), 1)));

    await user.click(screen.getByRole("button", { name: "Previous week" }));
    await user.click(screen.getByRole("button", { name: "Previous week" }));

    await waitFor(() => expect(timetableService.getMySchedule).toHaveBeenLastCalledWith(shiftWeek(todayString(), -1)));
  });

  it("downloads the PDF for the week shown", async () => {
    vi.mocked(timetableService.getMySchedule).mockResolvedValue(
      reply([{ kind: "TEACHER", id: "t1", title: "Teacher One", subtitle: null, entries: [entry] }]) as never
    );
    vi.mocked(timetableService.downloadMyPdf).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderIt();
    await screen.findByText("Teacher One");

    await user.click(screen.getByRole("button", { name: /download pdf/i }));

    expect(timetableService.downloadMyPdf).toHaveBeenCalledWith(todayString());
  });

  it("shows why a download was refused", async () => {
    vi.mocked(timetableService.getMySchedule).mockResolvedValue(
      reply([{ kind: "TEACHER", id: "t1", title: "Teacher One", subtitle: null, entries: [entry] }]) as never
    );
    vi.mocked(timetableService.downloadMyPdf).mockRejectedValue(new Error("There is no timetable to print yet."));
    const user = userEvent.setup();
    renderIt();
    await screen.findByText("Teacher One");

    await user.click(screen.getByRole("button", { name: /download pdf/i }));

    expect(await screen.findByText("There is no timetable to print yet.")).toBeInTheDocument();
  });
});
