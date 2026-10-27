import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { authService } from "@/services/auth.service";
import ForgotPasswordPage from "./page";

vi.mock("@/services/auth.service", () => ({ authService: { forgotPassword: vi.fn() } }));

const renderIt = () =>
  render(
    <MessageProvider>
      <ForgotPasswordPage />
    </MessageProvider>
  );

describe("ForgotPasswordPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("will not send until something is typed", () => {
    renderIt();

    expect(screen.getByRole("button", { name: "Send reset link" })).toBeDisabled();
  });

  it("asks for a link with what was typed, and says the same thing whatever the account", async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({ data: { message: "ok", data: null } } as never);
    const user = userEvent.setup();
    renderIt();

    await user.type(screen.getByLabelText(/email.*registration.*phone/i), "  ayesha@school.test ");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(authService.forgotPassword).toHaveBeenCalledWith("ayesha@school.test");
    expect(await screen.findByText(/If an account matches, a link to choose a new password has been sent/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send reset link" })).not.toBeInTheDocument();
  });

  it("shows why the request failed, such as being asked too often, and lets the person try again", async () => {
    vi.mocked(authService.forgotPassword).mockRejectedValue({
      response: { status: 429, data: { message: "Too many requests. Try again in a minute." } },
    });
    const user = userEvent.setup();
    renderIt();

    await user.type(screen.getByLabelText(/email.*registration.*phone/i), "a@b.co");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Too many requests. Try again in a minute.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeEnabled();
  });

  it("links back to sign in", () => {
    renderIt();

    expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveAttribute("href", "/login");
  });
});
