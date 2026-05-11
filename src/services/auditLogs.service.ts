import apiClient from "@/lib/axios";

export const auditLogsService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/audit-logs", { params }),
};
