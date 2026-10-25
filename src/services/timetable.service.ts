import apiClient from "@/lib/axios";
import { downloadFile } from "@/lib/downloadFile";

/**
 * Timetable: the weekly period template for a section, clash and room checks,
 * dated substitutions (cover), the weekly views for a section, a teacher and
 * the signed-in person, and their PDF downloads.
 */
export const timetableService = {
  createPeriodSlot: (payload: Record<string, unknown>) =>
    apiClient.post("/timetable/period-slots", payload),
  getPeriodSlots: (params?: Record<string, unknown>) =>
    apiClient.get("/timetable/period-slots", { params }),
  getPeriodSlot: (periodSlotId: string) =>
    apiClient.get(`/timetable/period-slots/${periodSlotId}`),
  updatePeriodSlot: (periodSlotId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/timetable/period-slots/${periodSlotId}`, payload),
  deletePeriodSlot: (periodSlotId: string) =>
    apiClient.delete(`/timetable/period-slots/${periodSlotId}`),
  // Full weekly grid for one section, ordered by dayOfWeek then
  // periodNumber server-side. Different segment count than
  // /timetable/period-slots/:id, so no route-collision risk.
  getSectionWeek: (sectionId: string) =>
    apiClient.get(`/timetable/period-slots/section/${sectionId}/week`),

  // Exchange the day, period and times of two periods in one step.
  swapPeriodSlots: (firstId: string, secondId: string) =>
    apiClient.post("/timetable/period-slots/swap", { firstId, secondId }),
  // Existing teacher or room clashes on a campus.
  getClashes: (campusId: string) =>
    apiClient.get("/timetable/period-slots/clashes", { params: { campusId } }),
  // Rooms already used on a campus, for suggestions.
  getRooms: (campusId: string) =>
    apiClient.get("/timetable/period-slots/rooms", { params: { campusId } }),

  // Dated cover: a substitute takes one period on one date.
  createSubstitution: (payload: { periodSlotId: string; date: string; substituteStaffProfileId: string; reason?: string }) =>
    apiClient.post("/timetable/substitutions", payload),
  getSubstitutions: (params: { campusId: string; from: string; to: string; sectionId?: string; staffProfileId?: string }) =>
    apiClient.get("/timetable/substitutions", { params }),
  cancelSubstitution: (substitutionId: string, reason?: string) =>
    apiClient.delete(`/timetable/substitutions/${substitutionId}`, { data: { reason } }),

  // The week containing `date` (this week when omitted), cover applied.
  getSectionSchedule: (sectionId: string, date?: string) =>
    apiClient.get(`/timetable/section/${sectionId}/schedule`, { params: { date } }),
  getTeacherSchedule: (staffProfileId: string, date?: string) =>
    apiClient.get(`/timetable/teacher/${staffProfileId}/schedule`, { params: { date } }),
  getMySchedule: (date?: string) => apiClient.get("/timetable/for-me", { params: { date } }),

  downloadSectionPdf: (sectionId: string, date?: string) =>
    downloadFile(`/timetable/section/${sectionId}/pdf`, { date }, "timetable.pdf"),
  downloadTeacherPdf: (staffProfileId: string, date?: string) =>
    downloadFile(`/timetable/teacher/${staffProfileId}/pdf`, { date }, "timetable.pdf"),
  downloadMyPdf: (date?: string) => downloadFile("/timetable/for-me/pdf", { date }, "my-timetable.pdf"),
};
