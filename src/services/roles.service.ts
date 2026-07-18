import apiClient from "@/lib/axios";

export interface RolePayload {
  name: string;
  description?: string;
  permissions: Record<string, Partial<Record<"create" | "read" | "update" | "delete", boolean>>>;
}

/**
 * Institution-scoped Role CRUD. When `institutionId` is passed (superadmin
 * platform console managing another institution), calls route through the
 * `/platform/institutions/:id/roles` mirror; otherwise the caller is an
 * institution ADMIN acting on their own institution via `/roles`.
 */
export const rolesService = {
  /** Static feature x action reference list; reachable by ADMIN and SUPERADMIN
   *  (the institution-creation wizard renders outside institution runtime-config). */
  getCatalog: () => apiClient.get("/roles/catalog"),

  list: (institutionId?: string) =>
    institutionId
      ? apiClient.get(`/platform/institutions/${institutionId}/roles`)
      : apiClient.get("/roles"),

  get: (roleId: string, institutionId?: string) =>
    institutionId
      ? apiClient.get(`/platform/institutions/${institutionId}/roles/${roleId}`)
      : apiClient.get(`/roles/${roleId}`),

  create: (payload: RolePayload, institutionId?: string) =>
    institutionId
      ? apiClient.post(`/platform/institutions/${institutionId}/roles`, payload)
      : apiClient.post("/roles", payload),

  update: (roleId: string, payload: Partial<RolePayload>, institutionId?: string) =>
    institutionId
      ? apiClient.patch(`/platform/institutions/${institutionId}/roles/${roleId}`, payload)
      : apiClient.patch(`/roles/${roleId}`, payload),

  remove: (roleId: string, institutionId?: string) =>
    institutionId
      ? apiClient.delete(`/platform/institutions/${institutionId}/roles/${roleId}`)
      : apiClient.delete(`/roles/${roleId}`),
};
