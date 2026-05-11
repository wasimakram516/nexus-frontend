import apiClient from "@/lib/axios";
import env from "@/config/env";

export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  folder: string;
  bytes: number;
}

export interface UploadOptions {
  subfolder?: "images" | "videos" | "documents" | "misc";
  onProgress?: (percent: number) => void;
}

export async function uploadFile(file: File, options?: UploadOptions): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const params = options?.subfolder ? `?subfolder=${options.subfolder}` : "";

  const res = await apiClient.post<{ data: UploadResult }>(
    `/upload${params}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && options?.onProgress) {
          options.onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }
  );

  return res.data.data;
}
