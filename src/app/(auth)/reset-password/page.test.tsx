import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { authService } from "@/services/auth.service";
import ResetPasswordPage from "./page";

const mocks = vi.hoisted(() => ({ token: "abc123" as string | null }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.token ? `token=${mocks.token}` : ""),
}));
vi.mock("@/services/auth.service", () => ({ authService: { resetPassword: vi.fn() } }));

const renderIt = () =>
  render(
    <MessageProvider>
      <ResetPasswordPage />
    </MessageProvider>
  );

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.token = "abc123";
  });

  it("says the link is incomplete when it has no token", () => {
    mocks.token = null;
    renderIt();

    expect(screen.getByText("This link is incomplete")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ask for a new link" })).toHaveAttribute("href", "/forgot-password");
  });

  it("holds the button until the password is long enough and typed twice the same", async () => {
    const user = userEvent.setup();
    renderIt();
    const button = screen.getByRole("button", { name: "Change password" });

    await user.type(screen.getByLabelText(/^New password/), "short");
    expect(screen.getByText("Use at least 8 characters.")).toBeInTheDocument();
    expect(button).toBeDisabled();

    await user.clear(screen.getByLabelText(/^New password/));
    await user.type(screen.getByLabelText(/^New password/), "long-enough-1");
    await user.type(screen.getByLabelText(/^Confirm new password/), "different-1");
    expect(screen.getByText("The two passwords do not match.")).toBeInTheDocument();
    expect(button).toBeDisabled();

    await user.clear(screen.getByLabelText(/^Confirm new password/));
    await user.type(screen.getByLabelText(/^Confirm new password/), "long-enough-1");
    expect(button).toBeEnabled();
  });

  it("changes the password with the token from the link and offers sign in", async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({ data: { message: "ok", data: null } } as never);
    const user = userEvent.setup();
    renderIt();

    await user.type(screen.getByLabelText(/^New password/), "long-enough-1");
    await user.type(screen.getByLabelText(/^Confirm new password/), "long-enough-1");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(authService.resetPassword).toHaveBeenCalledWith("abc123", "long-enough-1");
    expect(await screen.findByText("Password changed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute("href", "/login");
  });

  it("shows the server's reason for a link that has expired, keeping the form", async () => {
    vi.mocked(authService.resetPassword).mockRejectedValue({
      response: { status: 400, data: { message: "This reset link is invalid or has expired. Ask for a new one." } },
    });
    const user = userEvent.setup();
    renderIt();

    await user.type(screen.getByLabelText(/^New password/), "long-enough-1");
    await user.type(screen.getByLabelText(/^Confirm new password/), "long-enough-1");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("This reset link is invalid or has expired. Ask for a new one.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change password" })).toBeEnabled();
  });
});
