import apiClient from "@/lib/axios";

export const attendanceService = {
  checkIn: (payload: Record<string, unknown>) =>
    apiClient.post("/attendance/check-in", payload),

  checkOut: (payload: Record<string, unknown>) =>
    apiClient.post("/attendance/check-out", payload),

  markLeave: (payload: Record<string, unknown>) =>
    apiClient.post("/attendance/leave", payload),

  autoAbsent: (payload: Record<string, unknown>) =>
    apiClient.post("/attendance/auto-absent", payload),

  bulkMark: (payload: {
    campusId: string;
    date: string;
    entries: Array<{ userId: string; status: string; halfDay?: boolean; remarks?: string }>;
  }) => apiClient.post("/attendance/bulk-mark", payload),

  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/attendance", { params }),

  getSummary: (params?: Record<string, unknown>) =>
    apiClient.get("/attendance/summary", { params }),

  getById: (attendanceId: string) => apiClient.get(`/attendance/${attendanceId}`),

  update: (attendanceId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/attendance/${attendanceId}`, payload),
};
