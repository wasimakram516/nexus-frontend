import apiClient from "@/lib/axios";

export const platformService = {
  // Institution self-service (any authenticated institution user)
  getMyRuntimeConfig: () => apiClient.get("/platform/me/runtime-config"),

  // Plans
  getPlans: () => apiClient.get("/platform/plans"),
  createPlan: (payload: Record<string, unknown>) =>
    apiClient.post("/platform/plans", payload),
  updatePlan: (planId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/platform/plans/${planId}`, payload),

  // Institutions
  createInstitution: (payload: Record<string, unknown>) =>
    apiClient.post("/platform/institutions", payload),
  getInstitutions: (params?: Record<string, unknown>) =>
    apiClient.get("/platform/institutions", { params }),
  getInstitution: (id: string) => apiClient.get(`/platform/institutions/${id}`),
  getRuntimeConfig: (id: string) =>
    apiClient.get(`/platform/institutions/${id}/runtime-config`),
  updateInstitution: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/platform/institutions/${id}`, payload),
  updateBranding: (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/platform/institutions/${id}/branding`, payload),
  updateSettings: (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/platform/institutions/${id}/settings`, payload),
  updateEntitlements: (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/platform/institutions/${id}/entitlements`, payload),
  updateSubscription: (id: string, payload: Record<string, unknown>) =>
    apiClient.put(`/platform/institutions/${id}/subscription`, payload),

  // Roles have moved to services/roles.service.ts (institution-scoped
  // /roles for ADMIN, /platform/institutions/:id/roles for superadmin).
};
