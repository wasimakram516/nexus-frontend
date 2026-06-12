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
    // roles — don't nag the user about data they were never meant to see.
    if (!(silent && error.response?.status === 403)) {
      showMessage(message, "error");
    }
    return { data: null, success: false };
  }
}
