import { AxiosError } from "axios";

type ShowMessage = (message: string, severity: "success" | "error" | "warning" | "info") => void;

interface ApiHandlerOptions {
  showMessage: ShowMessage;
  successMessage?: string;
  silent?: boolean;
}

/** A long database error would not fit a notification; the full text is in the response and the server log. */
const MAX_SHOWN_CAUSE = 240;

interface ApiResponse<T> {
  data: T | null;
  success: boolean;
}

export async function apiHandler<T>(
  fn: () => Promise<{ data: { data: T; message?: string } }>,
  options: ApiHandlerOptions
): Promise<ApiResponse<T>> {
  const { showMessage, successMessage, silent = false } = options;

  try {
    const res = await fn();
    const message = successMessage ?? res.data?.message ?? "Operation successful";

    if (!silent) showMessage(message, "success");

    return { data: res.data?.data ?? null, success: true };
  } catch (err) {
    const error = err as AxiosError<{ message?: string; error?: { code?: string; details?: { cause?: unknown } } }>;
    const baseMessage =
      error.response?.data?.message ?? error.message ?? "Something went wrong";
    // The server sends the real cause of an unexpected error only to a
    // superadmin; show it so the problem is visible without opening the logs.
    const cause = error.response?.data?.error?.details?.cause;
    const message = typeof cause === "string" && cause ? `${baseMessage}: ${cause.slice(0, MAX_SHOWN_CAUSE)}` : baseMessage;

    // Silent background loads routinely hit permission 403s for restricted
    // roles, or 404s for a resource that legitimately doesn't exist yet
    // (e.g. no current academic year set) — don't nag the user about
    // conditions the caller already told us are expected, not failures.
    const expectedSilentStatus = error.response?.status === 403 || error.response?.status === 404;
    if (!(silent && expectedSilentStatus)) {
      showMessage(message, "error");
    }
    return { data: null, success: false };
  }
}
