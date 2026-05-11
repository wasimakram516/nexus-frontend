import apiClient from "@/lib/axios";

export const campusesService = {
  create: (payload: Record<string, unknown>) => apiClient.post("/campuses", payload),

  getAll: (params?: Record<string, unknown>) => apiClient.get("/campuses", { params }),

  update: (campusId: string, payload: Record<string, unknown>) =>
    apiClient.put(`/campuses/${campusId}`, payload),

  delete: (campusId: string, reason?: string) =>
    apiClient.post(`/campuses/${campusId}/delete`, { reason: reason ?? null }),

  assignUser: (payload: Record<string, unknown>) =>
    apiClient.post("/campuses/assign-user", payload),

  getCampusUsers: (campusId: string) => apiClient.get(`/campuses/${campusId}/users`),

  removeUser: (payload: Record<string, unknown>) =>
    apiClient.post("/campuses/remove-user", payload),
};
