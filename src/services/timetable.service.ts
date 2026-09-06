import apiClient from "@/lib/axios";

/**
 * Timetable M1 — Period Slots (M3 design doc § 5.2, § 7.1). Section-scoped,
 * weekly-recurring schedule TEMPLATE rows — not the drag-drop builder UX
 * (clash detection, room allocation) which is a later milestone.
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
  // periodNumber server-side (M3 design doc § 7.1). Different segment count
  // than /timetable/period-slots/:id, so no route-collision risk.
  getSectionWeek: (sectionId: string) =>
    apiClient.get(`/timetable/period-slots/section/${sectionId}/week`),
};
