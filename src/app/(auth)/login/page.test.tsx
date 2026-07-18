import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "@/contexts/AuthContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { authService } from "@/services/auth.service";
import LoginPage from "./page";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/services/auth.service", () => ({
  authService: { login: vi.fn() },
}));

function renderLoginPage() {
  return render(
    <MessageProvider>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MessageProvider>
  );
}

describe("LoginPage (form pattern)", () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(authService.login).mockReset();
  });

  it("submits credentials and redirects a non-admin user to the dashboard", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue({
      data: {
        message: "Welcome back!",
        data: {
          accessToken: "token-123",
          user: {
            id: "u1",
            email: "teacher@school.edu",
            name: "Jane Teacher",
            role: "STAFF",
            institutionId: "inst-1",
            sessionId: "sess-1",
          },
        },
      },
    } as never);

    renderLoginPage();

    await user.type(screen.getByLabelText(/email.*registration.*phone/i), "teacher@school.edu");
    await user.type(screen.getByLabelText(/^password/i), "hunter2");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith({
      identifier: "teacher@school.edu",
      password: "hunter2",
    }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(sessionStorage.getItem("nexus-token")).toBe("token-123");
  });

  it("logs a student in with their registration number and redirects to the dashboard", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue({
      data: {
        data: {
          accessToken: "token-456",
          user: {
            id: "u3",
            email: "",
            name: "Sam Student",
            role: "STUDENT",
            institutionId: "inst-1",
            sessionId: "sess-3",
          },
        },
      },
    } as never);

    renderLoginPage();

    await user.type(screen.getByLabelText(/email.*registration.*phone/i), "GRW-2026-0142");
    await user.type(screen.getByLabelText(/^password/i), "hunter2");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith({
      identifier: "GRW-2026-0142",
      password: "hunter2",
    }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("redirects a SUPERADMIN to the platform panel instead of the dashboard", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue({
      data: {
        data: {
          accessToken: "token-999",
          user: {
            id: "u2",
            email: "root@nexus.dev",
            name: "Root",
            role: "SUPERADMIN",
            institutionId: null,
            sessionId: "sess-2",
          },
        },
      },
    } as never);

    renderLoginPage();

    await user.type(screen.getByLabelText(/email.*registration.*phone/i), "root@nexus.dev");
    await user.type(screen.getByLabelText(/^password/i), "hunter2");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/platform"));
  });

  it("does not redirect when the credentials are rejected", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockRejectedValue({
      response: { status: 401, data: { message: "Invalid credentials" } },
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email.*registration.*phone/i), "teacher@school.edu");
    await user.type(screen.getByLabelText(/^password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(authService.login).toHaveBeenCalled());
    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
