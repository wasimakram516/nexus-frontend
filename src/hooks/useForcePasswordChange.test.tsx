import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { useForcePasswordChange } from "./useForcePasswordChange";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

function Screen() {
  useForcePasswordChange();
  return null;
}

const signIn = (mustChangePassword: boolean | undefined) => {
  sessionStorage.setItem(
    "nexus-user",
    JSON.stringify({ id: "u1", email: "a@b.co", name: "A", role: "STAFF", institutionId: "i1", sessionId: "s1", mustChangePassword })
  );
  sessionStorage.setItem("nexus-token", "t");
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("useForcePasswordChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("sends a person whose account was set up for them to choose their own password", async () => {
    signIn(true);
    render(<AuthProvider><Screen /></AuthProvider>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/change-password"));
  });

  it("leaves everyone else alone", async () => {
    signIn(false);
    render(<AuthProvider><Screen /></AuthProvider>);

    await settle();
    expect(replace).not.toHaveBeenCalled();
  });

  it("does nothing when nobody is signed in", async () => {
    render(<AuthProvider><Screen /></AuthProvider>);

    await settle();
    expect(replace).not.toHaveBeenCalled();
  });
});
