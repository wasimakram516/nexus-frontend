import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { platformService } from "@/services/platform.service";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import AttendanceCalendarSettings from "./AttendanceCalendarSettings";
import { attendanceCalendarService as calendar } from "@/services/attendanceCalendar.service";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/contexts/RuntimeConfigContext", () => ({ useOptionalRuntimeConfig: vi.fn() }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: vi.fn() }) }));
vi.mock("@/services/platform.service", () => ({ platformService: { getInstitution: vi.fn().mockResolvedValue({ data: { data: { timezone: "Asia/Karachi" } } }), updateInstitution: vi.fn() } }));
vi.mock("@/services/attendanceCalendar.service", async (original) => ({
  ...await original<typeof import("@/services/attendanceCalendar.service")>(),
  attendanceCalendarService: { getWorkingDays: vi.fn(), saveWorkingDays: vi.fn(), getClosures: vi.fn(), createClosure: vi.fn(), updateClosure: vi.fn(), deleteClosure: vi.fn() },
}));

describe("AttendanceCalendarSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { role: "ADMIN" } } as never);
    vi.mocked(useOptionalRuntimeConfig).mockReturnValue(null);
    vi.mocked(calendar.getWorkingDays).mockResolvedValue({ data: { data: null } } as never);
    vi.mocked(calendar.getClosures).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(calendar.saveWorkingDays).mockResolvedValue({ data: { data: {} } } as never);
  });
  it("makes unconfigured calendars visible and requires an explicit working-day selection", async () => {
    render(<AttendanceCalendarSettings campuses={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Attendance calendar settings" }));
    expect(await screen.findByText(/Automatic absences are paused/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save working days" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("MONDAY"));
    fireEvent.click(screen.getByRole("button", { name: "Save working days" }));
    await waitFor(() => expect(calendar.saveWorkingDays).toHaveBeenCalledWith(["MONDAY"], undefined));
    await waitFor(() => expect(screen.queryByText(/Automatic absences are paused/)).not.toBeInTheDocument());
  });
  it("loads platform settings for the selected institution and retries a failed load", async () => {
    vi.mocked(calendar.getWorkingDays).mockRejectedValueOnce(new Error("Offline"));
    render(<AttendanceCalendarSettings institutionId="institution-1" campuses={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Attendance calendar settings" }));
    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
    expect(await screen.findByLabelText("Institution timezone")).toHaveValue("Asia/Karachi");
    expect(calendar.getWorkingDays).toHaveBeenLastCalledWith("institution-1");
    expect(calendar.getClosures).toHaveBeenLastCalledWith("institution-1");
  });
  it("shows the applicable timezone for each campus, marking overrides", async () => {
    render(<AttendanceCalendarSettings campuses={[
      { id: "c1", name: "Main", timezone: null, institution: { timezone: "Asia/Karachi" } },
      { id: "c2", name: "Dubai", timezone: "Asia/Dubai", institution: { timezone: "Asia/Karachi" } },
    ]} />);
    fireEvent.click(screen.getByRole("button", { name: "Attendance calendar settings" }));
    const list = await screen.findByTestId("applicable-timezones");
    expect(within(list).getByText("Main: Asia/Karachi")).toBeInTheDocument();
    expect(within(list).getByText("Dubai: Asia/Dubai (campus override)")).toBeInTheDocument();
  });
  it("hides settings from a user without calendar read permission", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: "STAFF" } } as never);
    render(<AttendanceCalendarSettings campuses={[]} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(calendar.getWorkingDays).not.toHaveBeenCalled();
  });
  it("saves the institution timezone through the platform API", async () => {
    vi.mocked(platformService.updateInstitution).mockResolvedValue({ data: { data: {} } } as never);
    render(<AttendanceCalendarSettings institutionId="institution-1" campuses={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Attendance calendar settings" }));
    fireEvent.change(await screen.findByLabelText("Institution timezone"), { target: { value: "America/New_York" } });
    fireEvent.click(screen.getByRole("button", { name: "Save timezone" }));
    await waitFor(() => expect(platformService.updateInstitution).toHaveBeenCalledWith("institution-1", { timezone: "America/New_York" }));
  });
  it("allows read-only calendar access without exposing mutation controls", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { role: "STAFF" } } as never);
    vi.mocked(useOptionalRuntimeConfig).mockReturnValue({ can: (_resource: string, action: string) => action === "read" } as never);
    render(<AttendanceCalendarSettings campuses={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Attendance calendar settings" }));
    expect(await screen.findByLabelText("MONDAY")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save working days" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Closure date" })).not.toBeInTheDocument();
  });
  it("edits a closure and clears its campus scope, then deletes it after confirmation", async () => {
    const closure = { id: "closure-1", date: "2026-12-25", label: "Holiday", campusId: "campus-1" };
    vi.mocked(calendar.getClosures).mockResolvedValue({ data: { data: [closure] } } as never);
    vi.mocked(calendar.updateClosure).mockResolvedValue({ data: { data: {} } } as never);
    vi.mocked(calendar.deleteClosure).mockResolvedValue({ data: { data: {} } } as never);
    render(<AttendanceCalendarSettings campuses={[{ id: "campus-1", name: "North" }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Attendance calendar settings" }));
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText(/Closure label/), { target: { value: "All campuses holiday" } });
    fireEvent.mouseDown(screen.getByLabelText("Campus"));
    fireEvent.click(screen.getByRole("option", { name: "All campuses" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(calendar.updateClosure).toHaveBeenCalledWith("closure-1", { date: "2026-12-25", label: "All campuses holiday", campusId: null }, undefined));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(calendar.deleteClosure).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(calendar.deleteClosure).toHaveBeenCalledWith("closure-1", undefined));
  });
  it("creates an institution closure while retaining unsaved working-day selections", async () => {
    vi.mocked(calendar.createClosure).mockResolvedValue({ data: { data: {} } } as never);
    render(<AttendanceCalendarSettings campuses={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Attendance calendar settings" }));
    fireEvent.click(await screen.findByLabelText("MONDAY"));
    fireEvent.click(screen.getAllByRole("button", { name: "Add Closure date" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Closure date/), { target: { value: "2026-12-25" } });
    fireEvent.change(within(dialog).getByLabelText(/Closure label/), { target: { value: "Holiday" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() => expect(calendar.createClosure).toHaveBeenCalledWith({ date: "2026-12-25", label: "Holiday" }, undefined));
    await waitFor(() => expect(screen.getByLabelText("MONDAY")).toBeChecked());
  });
});
