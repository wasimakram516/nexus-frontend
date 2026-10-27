import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "@/contexts/AuthContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { authService } from "@/services/auth.service";
import ChangePasswordPage from "./page";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/services/auth.service", () => ({ authService: { changePassword: vi.fn() } }));

const signIn = (role: string, mustChangePassword: boolean) => {
  sessionStorage.setItem(
    "nexus-user",
    JSON.stringify({ id: "u1", email: "a@b.co", name: "A", role, institutionId: role === "SUPERADMIN" ? null : "i1", sessionId: "s1", mustChangePassword })
  );
  sessionStorage.setItem("nexus-token", "token-1");
};

const renderIt = () =>
  render(
    <MessageProvider>
      <AuthProvider>
        <ChangePasswordPage />
      </AuthProvider>
    </MessageProvider>
  );

const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>, current: string, next: string) => {
  await user.type(await screen.findByLabelText(/^Current password/), current);
  await user.type(screen.getByLabelText(/^New password/), next);
  await user.type(screen.getByLabelText(/^Confirm new password/), next);
  await user.click(screen.getByRole("button", { name: "Change password" }));
};

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("sends someone who is not signed in to sign in", async () => {
    renderIt();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("tells a person whose account was set up for them that this comes first", async () => {
    signIn("STUDENT", true);
    renderIt();

    expect(await screen.findByText("You need to do this before using Nexus.")).toBeInTheDocument();
  });

  it("changes the password, clears the must-change flag in the stored session and goes on to the dashboard", async () => {
    vi.mocked(authService.changePassword).mockResolvedValue({ data: { message: "ok", data: null } } as never);
    signIn("STUDENT", true);
    const user = userEvent.setup();
    renderIt();

    await fillAndSubmit(user, "given-pass-1", "my-own-pass-1");

    expect(authService.changePassword).toHaveBeenCalledWith("given-pass-1", "my-own-pass-1");
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(JSON.parse(sessionStorage.getItem("nexus-user") as string).mustChangePassword).toBe(false);
  });

  it("takes the superadmin back to the platform console", async () => {
    vi.mocked(authService.changePassword).mockResolvedValue({ data: { message: "ok", data: null } } as never);
    signIn("SUPERADMIN", false);
    const user = userEvent.setup();
    renderIt();

    await fillAndSubmit(user, "old-pass-1", "new-pass-123");

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/platform"));
  });

  it("stays and shows the reason when the current password is wrong", async () => {
    vi.mocked(authService.changePassword).mockRejectedValue({
      response: { status: 401, data: { message: "Your current password is not correct." } },
    });
    signIn("STAFF", false);
    const user = userEvent.setup();
    renderIt();

    await fillAndSubmit(user, "wrong", "new-pass-123");

    expect(await screen.findByText("Your current password is not correct.")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalledWith("/dashboard");
  });
});
