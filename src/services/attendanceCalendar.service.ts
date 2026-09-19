import apiClient from "@/lib/axios";

export const WORKING_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export type WorkingDay = typeof WORKING_DAYS[number];
export interface WorkingCalendar { workingDays: WorkingDay[] }
export interface ClosureDate { id: string; date: string; label: string; campusId: string | null }

/** Uses the existing platform mirror only when an institution is explicitly selected. */
function path(institutionId?: string): string {
  return institutionId ? `/platform/institutions/${institutionId}/attendance-calendar` : "/attendance-calendar";
}

export const attendanceCalendarService = {
  getWorkingDays: (institutionId?: string) => apiClient.get<{ data: WorkingCalendar | null }>(`${path(institutionId)}/working-days`),
  saveWorkingDays: (workingDays: WorkingDay[], institutionId?: string) => apiClient.put(`${path(institutionId)}/working-days`, { workingDays }),
  getClosures: (institutionId?: string) => apiClient.get<{ data: ClosureDate[] }>(`${path(institutionId)}/closures`),
  createClosure: (payload: Record<string, unknown>, institutionId?: string) => apiClient.post(`${path(institutionId)}/closures`, payload),
  updateClosure: (id: string, payload: Record<string, unknown>, institutionId?: string) => apiClient.patch(`${path(institutionId)}/closures/${id}`, payload),
  deleteClosure: (id: string, institutionId?: string) => apiClient.delete(`${path(institutionId)}/closures/${id}`, { data: { reason: "Removed from attendance calendar" } }),
};
