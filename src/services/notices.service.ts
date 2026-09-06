import apiClient from "@/lib/axios";

/**
 * Institution-scoped Notice CRUD. When `institutionId` is passed (superadmin
 * platform console managing another institution), calls route through the
 * `/platform/institutions/:id/notices` mirror; otherwise the caller is an
 * institution ADMIN/STAFF acting on their own institution via `/notices`.
 */
export const noticesService = {
  createNotice: (payload: Record<string, unknown>, institutionId?: string) =>
    institutionId
      ? apiClient.post(`/platform/institutions/${institutionId}/notices`, payload)
      : apiClient.post("/notices", payload),

  getNotices: (params?: Record<string, unknown>, institutionId?: string) =>
    institutionId
      ? apiClient.get(`/platform/institutions/${institutionId}/notices`, { params })
      : apiClient.get("/notices", { params }),

  getNotice: (noticeId: string, institutionId?: string) =>
    institutionId
      ? apiClient.get(`/platform/institutions/${institutionId}/notices/${noticeId}`)
      : apiClient.get(`/notices/${noticeId}`),

  updateNotice: (
    noticeId: string,
    payload: Record<string, unknown>,
    institutionId?: string,
  ) =>
    institutionId
      ? apiClient.patch(
          `/platform/institutions/${institutionId}/notices/${noticeId}`,
          payload,
        )
      : apiClient.patch(`/notices/${noticeId}`, payload),

  deleteNotice: (noticeId: string, institutionId?: string) =>
    institutionId
      ? apiClient.delete(`/platform/institutions/${institutionId}/notices/${noticeId}`)
      : apiClient.delete(`/notices/${noticeId}`),

  // Self-service, no permission gate — resolved server-side against the
  // caller's institution/campus/class/section/role and the publish window.
  // Paginated, unlike getNotices() above (see § 7.3 of the M3 design doc:
  // deliberate, since this one is user-facing on every dashboard load). No
  // superadmin mirror: a personal notice feed only ever makes sense for the
  // caller's own institution.
  getNoticesForMe: (params?: Record<string, unknown>) =>
    apiClient.get("/notices/for-me", { params }),
};
