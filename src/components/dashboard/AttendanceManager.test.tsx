import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { attendanceService } from "@/services/attendance.service";
import { academicsService } from "@/services/academics.service";
import { campusesService } from "@/services/campuses.service";
import { peopleService } from "@/services/people.service";
import { timetableService } from "@/services/timetable.service";
import { fetchAllUsers } from "@/lib/users";
import AttendanceManager from "./AttendanceManager";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/contexts/RuntimeConfigContext", () => ({
  useOptionalRuntimeConfig: vi.fn(),
}));

vi.mock("@/lib/users", () => ({
  fetchAllUsers: vi.fn(),
}));

vi.mock("@/services/attendance.service", () => ({
  attendanceService: {
    checkIn: vi.fn(),
    checkOut: vi.fn(),
    markLeave: vi.fn(),
    autoAbsent: vi.fn(),
    bulkMark: vi.fn(),
    getAll: vi.fn(),
    getPeriodRoster: vi.fn(),
    getSummary: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/services/academics.service", () => ({
  academicsService: {
    getClasses: vi.fn(),
    getSections: vi.fn(),
  },
}));

vi.mock("@/services/campuses.service", () => ({
  campusesService: {
    getAll: vi.fn(),
    getCampusUsers: vi.fn(),
  },
}));

vi.mock("@/services/people.service", () => ({
  peopleService: {
    getStudents: vi.fn(),
    getStaffProfiles: vi.fn(),
  },
}));

vi.mock("@/services/timetable.service", () => ({
  timetableService: {
    getSectionWeek: vi.fn(),
  },
}));

const campus = { id: "campus-1", name: "Main Campus", institutionId: "inst-1" };
const classItem = { id: "class-1", name: "Class 1" };
const sectionItem = { id: "section-1", name: "Section A", classId: "class-1" };
const student = {
  id: "stu-1",
  userId: "user-1",
  campusId: "campus-1",
  regNo: "R001",
  classId: "class-1",
  sectionId: "section-1",
};
const studentUser = {
  id: "user-1",
  name: "Alice Student",
  email: "alice@test.com",
  role: "STUDENT",
  status: "ACTIVE",
  institutionId: "inst-1",
  createdAt: "2026-01-01T00:00:00.000Z",
};

/** A Monday — fixed so period-day filtering in tests isn't sensitive to the day the suite runs on. */
const MONDAY_DATE = "2026-09-07";

const mondayPeriodSlot = {
  id: "slot-1",
  campusId: "campus-1",
  classId: "class-1",
  sectionId: "section-1",
  subjectId: null,
  staffProfileId: null,
  name: "Period 1",
  periodNumber: 1,
  dayOfWeek: "MONDAY" as const,
  startTime: "08:00",
  endTime: "08:40",
  createdAt: "2026-08-01T00:00:00.000Z",
};

function mockRuntime(mode: "DAILY" | "PERIOD" | null) {
  if (mode === null) {
    // canManage falls back to true when there's no runtime config in scope (matches NoticesManager's convention).
    vi.mocked(useOptionalRuntimeConfig).mockReturnValue(null as never);
    return;
  }
  vi.mocked(useOptionalRuntimeConfig).mockReturnValue({
    config: { settings: { attendance: { mode } } },
    canManageModule: () => true,
  } as never);
}

function mockDefaults() {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: "admin-1", email: "admin@test.com", name: "Admin", role: "ADMIN", institutionId: "inst-1", sessionId: "s1" },
  } as never);
  vi.mocked(campusesService.getAll).mockResolvedValue({ data: { data: { items: [campus] } } } as never);
  vi.mocked(campusesService.getCampusUsers).mockResolvedValue({ data: { data: [] } } as never);
  vi.mocked(peopleService.getStudents).mockResolvedValue({ data: { data: [student] } } as never);
  vi.mocked(peopleService.getStaffProfiles).mockResolvedValue({ data: { data: [] } } as never);
  vi.mocked(academicsService.getClasses).mockResolvedValue({ data: { data: [classItem] } } as never);
  vi.mocked(academicsService.getSections).mockResolvedValue({ data: { data: [sectionItem] } } as never);
  vi.mocked(fetchAllUsers).mockResolvedValue([studentUser]);
  vi.mocked(attendanceService.getAll).mockResolvedValue({ data: { data: [] } } as never);
  vi.mocked(attendanceService.getPeriodRoster).mockResolvedValue({ data: { data: [] } } as never);
  vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [] } } as never);
}

function renderManager() {
  return render(
    <MessageProvider>
      <ConfirmProvider>
        <AttendanceManager />
      </ConfirmProvider>
    </MessageProvider>
  );
}

/** Navigates from the hub into the Daily Register and waits for the class filter to be ready. */
async function openDailyRegister(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByText("Daily Register"));
  await screen.findByLabelText("Class");
}

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: string, optionName: string | RegExp) {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole("option", { name: optionName }));
}

describe("AttendanceManager", () => {
  beforeEach(() => {
    vi.mocked(attendanceService.checkIn).mockReset();
    vi.mocked(attendanceService.checkOut).mockReset();
    vi.mocked(attendanceService.bulkMark).mockReset();
    vi.mocked(attendanceService.getAll).mockReset();
    vi.mocked(attendanceService.getPeriodRoster).mockReset();
    vi.mocked(attendanceService.update).mockReset();
    vi.mocked(campusesService.getAll).mockReset();
    vi.mocked(campusesService.getCampusUsers).mockReset();
    vi.mocked(peopleService.getStudents).mockReset();
    vi.mocked(peopleService.getStaffProfiles).mockReset();
    vi.mocked(academicsService.getClasses).mockReset();
    vi.mocked(academicsService.getSections).mockReset();
    vi.mocked(timetableService.getSectionWeek).mockReset();
    vi.mocked(fetchAllUsers).mockReset();
    mockDefaults();
  });

  it("DAILY mode: shows the existing register UI unchanged, with no Period control", async () => {
    mockRuntime("DAILY");
    const user = userEvent.setup();
    renderManager();

    await openDailyRegister(user);
    await screen.findByLabelText("Section");

    expect(screen.queryByLabelText("Period")).not.toBeInTheDocument();
    expect(timetableService.getSectionWeek).not.toHaveBeenCalled();
    // The DAILY-mode roster is populated locally (students + campus/class/section filters), not via getPeriodRoster.
    expect(attendanceService.getPeriodRoster).not.toHaveBeenCalled();
    await screen.findByText("Alice Student");
  });

  it("PERIOD mode: shows a Period control and withholds the roster until a period is chosen", async () => {
    mockRuntime("PERIOD");
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [mondayPeriodSlot] } } as never);
    const user = userEvent.setup();
    renderManager();

    await openDailyRegister(user);
    expect(await screen.findByLabelText("Period")).toBeInTheDocument();

    // No section chosen yet — no roster, no period-roster call.
    expect(screen.getByText(/select a class and section, then a period/i)).toBeInTheDocument();
    expect(attendanceService.getPeriodRoster).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Date"), { target: { value: MONDAY_DATE } });
    await selectOption(user, "Class", "Class 1");
    await selectOption(user, "Section", "Section A");

    await waitFor(() => expect(timetableService.getSectionWeek).toHaveBeenCalledWith("section-1"));

    // Section picked but no period yet — still withheld, and still no period-roster call.
    expect(screen.getByText(/select a period above/i)).toBeInTheDocument();
    expect(attendanceService.getPeriodRoster).not.toHaveBeenCalled();

    vi.mocked(attendanceService.getPeriodRoster).mockResolvedValue({
      data: { data: [{ userId: "user-1", studentId: "student-1", name: "Alice Student", regNo: "R001", status: null, halfDay: false, remarks: null }] },
    } as never);

    await selectOption(user, "Period", /Period 1/i);

    await waitFor(() =>
      expect(attendanceService.getPeriodRoster).toHaveBeenCalledWith("slot-1", MONDAY_DATE)
    );
    expect(await screen.findByText("Alice Student")).toBeInTheDocument();
  });

  it("PERIOD mode: the bulk-mark payload includes periodId", async () => {
    mockRuntime("PERIOD");
    vi.mocked(timetableService.getSectionWeek).mockResolvedValue({ data: { data: [mondayPeriodSlot] } } as never);
    vi.mocked(attendanceService.getPeriodRoster).mockResolvedValue({
      data: { data: [{ userId: "user-1", studentId: "student-1", name: "Alice Student", regNo: "R001", status: null, halfDay: false, remarks: null }] },
    } as never);
    vi.mocked(attendanceService.bulkMark).mockResolvedValue({
      data: { data: { marked: 1, skipped: [] }, message: "Marked." },
    } as never);
    const user = userEvent.setup();
    renderManager();

    await openDailyRegister(user);
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: MONDAY_DATE } });
    await selectOption(user, "Class", "Class 1");
    await selectOption(user, "Section", "Section A");
    await selectOption(user, "Period", /Period 1/i);
    await screen.findByText("Alice Student");

    await user.click(screen.getByRole("button", { name: "P" }));

    await waitFor(() =>
      expect(attendanceService.bulkMark).toHaveBeenCalledWith({
        campusId: "campus-1",
        date: MONDAY_DATE,
        periodId: "slot-1",
        entries: [{ userId: "user-1", status: "PRESENT" }],
      })
    );
  });

  it("DAILY mode: the bulk-mark payload omits periodId entirely", async () => {
    mockRuntime("DAILY");
    vi.mocked(attendanceService.bulkMark).mockResolvedValue({
      data: { data: { marked: 1, skipped: [] }, message: "Marked." },
    } as never);
    const user = userEvent.setup();
    renderManager();

    await openDailyRegister(user);
    await screen.findByText("Alice Student");

    await user.click(screen.getByRole("button", { name: "P" }));

    await waitFor(() => expect(attendanceService.bulkMark).toHaveBeenCalled());
    const payload = vi.mocked(attendanceService.bulkMark).mock.calls[0][0];
    expect(payload).not.toHaveProperty("periodId");
    expect(payload.entries).toEqual([{ userId: "user-1", status: "PRESENT" }]);
  });
});
