import apiClient from "@/lib/axios";

export const customFieldsService = {
  createDefinition: (payload: Record<string, unknown>) =>
    apiClient.post("/custom-fields/definitions", payload),
  getDefinitions: (params?: Record<string, unknown>) =>
    apiClient.get("/custom-fields/definitions", { params }),
  updateDefinition: (definitionId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/custom-fields/definitions/${definitionId}`, payload),

  upsertValue: (payload: Record<string, unknown>) =>
    apiClient.post("/custom-fields/values", payload),
  getValues: (params?: Record<string, unknown>) =>
    apiClient.get("/custom-fields/values", { params }),
};
