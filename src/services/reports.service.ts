import apiClient from "@/lib/axios";
import { downloadFile } from "@/lib/downloadFile";

/**
 * Reports for administrators. Every report is a table; the same address gives
 * it as JSON for the screen, or as a CSV or PDF download.
 */
export const reportsService = {
  /** The report as a table, for showing on screen. */
  get: (path: string, params: Record<string, unknown>) => apiClient.get(`/reports/${path}`, { params }),
  /** The report as a file; the server names it. */
  download: (path: string, params: Record<string, unknown>, format: "csv" | "pdf") =>
    downloadFile(`/reports/${path}`, { ...params, format }, `report.${format}`),
};
