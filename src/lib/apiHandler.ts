import { AxiosError } from "axios";

type ShowMessage = (message: string, severity: "success" | "error" | "warning" | "info") => void;

interface ApiHandlerOptions {
  showMessage: ShowMessage;
  successMessage?: string;
  silent?: boolean;
}

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
    const error = err as AxiosError<{ message?: string; error?: { code?: string } }>;
    const message =
      error.response?.data?.message ?? error.message ?? "Something went wrong";

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
