import apiClient from "@/lib/axios";

/** The file name the server suggested, or the fallback when it sent none. */
export function filenameFromDisposition(header: string | undefined, fallback: string): string {
  const match = header?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1].trim()) : fallback;
}

/**
 * When a download fails the server's JSON error arrives as a file-like blob;
 * read the message out of it so the person is told what went wrong.
 */
async function messageFromBlob(error: unknown): Promise<Error> {
  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as { message?: string };
      if (parsed.message) {
        return Object.assign(new Error(parsed.message), { response: { data: parsed, status: (error as { response?: { status?: number } }).response?.status } });
      }
    } catch {
      // Not JSON; fall through to the original error.
    }
  }
  return error as Error;
}

/**
 * Downloads a file from the API and hands it to the browser as a save.
 *
 * @param {string} path - The API path of the file.
 * @param {Record<string, unknown>} [params] - Query parameters.
 * @param {string} [fallbackName] - The name to save as when the server suggests none.
 * @returns {Promise<void>} Resolves when the save has been started.
 * @throws {Error} With the server's message when the download is refused.
 */
export async function downloadFile(path: string, params?: Record<string, unknown>, fallbackName = "document.pdf"): Promise<void> {
  let response;
  try {
    response = await apiClient.get(path, { params, responseType: "blob" });
  } catch (error) {
    throw await messageFromBlob(error);
  }
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filenameFromDisposition(response.headers?.["content-disposition"] as string | undefined, fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
