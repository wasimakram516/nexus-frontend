import apiClient from "@/lib/axios";

/**
 * One enrolled student in a period slot's class/section, annotated with any
 * existing attendance record for that exact date+period (M3 Attendance
 * Dual-Mode track, design doc §5.3/§7.2). Matches the real backend response
 * (AttendanceService.getPeriodRoster) verbatim — flat fields, not a nested
 * `attendance` object, and no per-entry classId/sectionId (the whole roster
 * is already scoped to one period slot's class/section). `status` is null
 * when the student hasn't been marked yet for this date+period; `halfDay`
 * defaults to false and `remarks` to null in that case, same as a real
 * unmarked default would.
 */
export interface PeriodRosterStudent {
  userId: string;
  studentId: string;
  name: string;
  regNo: string | null;
  status: string | null;
  halfDay: boolean;
  remarks: string | null;
}

export const attendanceService = {
  checkIn: (payload: Record<string, unknown>) =>
    apiClient.post("/attendance/check-in", payload),

  checkOut: (payload: Record<string, unknown>) =>
    apiClient.post("/attendance/check-out", payload),

  markLeave: (payload: Record<string, unknown>) =>
    apiClient.post("/attendance/leave", payload),

  autoAbsent: (payload: Record<string, unknown>) =>
    apiClient.post("/attendance/auto-absent", payload),

  // periodId is top-level (one bulk-mark call always targets one period slot,
  // same as campusId/date), and must only be sent when the institution is in
  // PERIOD mode — DAILY-mode callers must omit it entirely (backend 400s
  // otherwise; see M3 design doc §5.3/§7.2).
  bulkMark: (payload: {
    campusId: string;
    date: string;
    periodId?: string;
    entries: Array<{ userId: string; status: string; halfDay?: boolean; remarks?: string }>;
  }) => apiClient.post("/attendance/bulk-mark", payload),

  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/attendance", { params }),

  /** Enrolled students for one period slot's class/section on one date, pre-annotated with that date+period's attendance. */
  getPeriodRoster: (periodId: string, date: string) =>
    apiClient.get("/attendance/period-roster", { params: { periodId, date } }),

  getSummary: (params?: Record<string, unknown>) =>
    apiClient.get("/attendance/summary", { params }),

  getById: (attendanceId: string) => apiClient.get(`/attendance/${attendanceId}`),

  update: (attendanceId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/attendance/${attendanceId}`, payload),
};
