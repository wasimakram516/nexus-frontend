import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  showMessage: vi.fn(),
  setAuth: vi.fn(),
  signupTrial: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ setAuth: mocks.setAuth }) }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/auth.service", () => ({ authService: { signupTrial: mocks.signupTrial } }));
vi.mock("@/components/shared/NexusLogo", () => ({ default: () => <span>logo</span> }));

import SignupPage from "./page";

const fill = (over: Partial<Record<"inst" | "name" | "email" | "password", string>> = {}) => {
  const v = { inst: "Green School", name: "Ann Admin", email: "ann@green.io", password: "supersecret", ...over };
  fireEvent.change(screen.getByLabelText(/Institution Name/), { target: { value: v.inst } });
  fireEvent.change(screen.getByLabelText(/Your Full Name/), { target: { value: v.name } });
  fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: v.email } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: v.password } });
};

const submit = () => screen.getByRole("button", { name: "Start Free Trial" });

beforeEach(() => {
  vi.clearAllMocks();
  document.cookie = "isAuthenticated=; path=/; max-age=0";
});

describe("Signup page", () => {
  it("keeps submit disabled until every field is valid, including an 8 character password", () => {
    render(<SignupPage />);
    expect(submit()).toBeDisabled();
    fill({ password: "short" });
    expect(submit()).toBeDisabled();
    fill({ password: "longenough" });
    expect(submit()).toBeEnabled();
    fill({ inst: "" });
    expect(submit()).toBeDisabled();
  });

  it("toggles password visibility", () => {
    render(<SignupPage />);
    const password = screen.getByLabelText(/^Password/);
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByTestId("VisibilityIcon").closest("button")!);
    expect(password).toHaveAttribute("type", "text");
  });

  it("creates the trial, stores the session, sets the auth cookie and lands on the welcome dashboard", async () => {
    mocks.signupTrial.mockResolvedValue({
      data: {
        message: "created",
        data: {
          accessToken: "jwt", sessionId: "sess-1",
          user: { id: "u1", email: "ann@green.io", name: "Ann Admin", role: "ADMIN", status: "ACTIVE", institutionId: "inst-1" },
          institution: { id: "inst-1", name: "Green School", slug: "green-school", trialEndsAt: "2030-01-01" },
        },
      },
    });
    render(<SignupPage />);
    fill();
    fireEvent.click(submit());
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/dashboard?welcome=1"));
    expect(mocks.signupTrial).toHaveBeenCalledWith({ institutionName: "Green School", name: "Ann Admin", email: "ann@green.io", password: "supersecret" });
    expect(mocks.setAuth).toHaveBeenCalledWith(
      { id: "u1", email: "ann@green.io", name: "Ann Admin", role: "ADMIN", institutionId: "inst-1", sessionId: "sess-1" },
      "jwt",
    );
    expect(document.cookie).toContain("isAuthenticated=1");
    expect(mocks.showMessage).toHaveBeenCalledWith("Welcome to Nexus! Your trial is ready.", "success");
  });

  it("shows the server error and neither signs in nor redirects when signup fails", async () => {
    mocks.signupTrial.mockRejectedValue(Object.assign(new Error("x"), { response: { status: 409, data: { message: "Email already registered" } } }));
    render(<SignupPage />);
    fill();
    fireEvent.click(submit());
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("Email already registered", "error"));
    expect(mocks.setAuth).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(submit()).toBeEnabled();
    expect(document.cookie).not.toContain("isAuthenticated=1");
  });

  it("links to sign-in and the legal pages", () => {
    render(<SignupPage />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms-of-service");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy-policy");
  });
});
