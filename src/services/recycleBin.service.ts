import apiClient from "@/lib/axios";

export const recycleBinService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/recycle-bin", { params }),

  restore: (entity: string, recordId: string) =>
    apiClient.post(`/recycle-bin/${entity}/${recordId}/restore`),

  permanentDelete: (entity: string, recordId: string) =>
    apiClient.delete(`/recycle-bin/${entity}/${recordId}/permanent`),
};
