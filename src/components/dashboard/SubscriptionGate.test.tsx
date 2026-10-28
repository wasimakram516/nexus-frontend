import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useAuth } from "@/contexts/AuthContext";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import SubscriptionGate, { lockReason } from "./SubscriptionGate";

vi.mock("@/contexts/RuntimeConfigContext", () => ({ useRuntimeConfig: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));

const setup = (status: string | undefined, trialDaysLeft: number | null, role = "ADMIN", endsAt: string | null = "2026-10-20T00:00:00.000Z") => {
  vi.mocked(useRuntimeConfig).mockReturnValue({ config: status ? { subscription: { status, endsAt } } : null, trialDaysLeft } as never);
  vi.mocked(useAuth).mockReturnValue({ user: { role } } as never);
  render(
    <SubscriptionGate>
      <p>the workspace</p>
    </SubscriptionGate>
  );
};

describe("lockReason", () => {
  it("is null while the subscription is usable", () => {
    expect(lockReason("ACTIVE", null, null)).toBeNull();
    expect(lockReason("PAST_DUE", null, null)).toBeNull();
    expect(lockReason("TRIAL", 5, "2026-11-01T00:00:00.000Z")).toBeNull();
    expect(lockReason(undefined, null, null)).toBeNull();
  });

  it("is null for a trial with no end date, which never expires", () => {
    expect(lockReason("TRIAL", null, null)).toBeNull();
  });

  it("explains each way a workspace is closed", () => {
    expect(lockReason("SUSPENDED", null, null)?.title).toBe("This subscription is suspended");
    expect(lockReason("CANCELLED", null, null)?.title).toBe("This subscription has ended");
    expect(lockReason("TRIAL", 0, "2026-10-20T00:00:00.000Z")).toEqual({
      title: "The free trial has ended",
      detail: "The trial ended on 20 Oct 2026. Choose a plan to open the workspace again; nothing has been deleted.",
    });
    expect(lockReason("TRIAL", -3, null)?.detail).toContain("The trial ended.");
  });
});

describe("SubscriptionGate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the workspace for a school in good standing", () => {
    setup("ACTIVE", null);

    expect(screen.getByText("the workspace")).toBeInTheDocument();
    expect(screen.queryByText(/subscription/i)).not.toBeInTheDocument();
  });

  it("shows the workspace while the configuration is still loading", () => {
    setup(undefined, null);

    expect(screen.getByText("the workspace")).toBeInTheDocument();
  });

  it.each([
    ["SUSPENDED", null, "This subscription is suspended"],
    ["CANCELLED", null, "This subscription has ended"],
    ["TRIAL", -1, "The free trial has ended"],
  ])("closes the workspace for a %s subscription and says why", (status, days, title) => {
    setup(status, days);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.queryByText("the workspace")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact Nexus" })).toHaveAttribute("href", expect.stringContaining("mailto:nexus@wisemensoft.com"));
  });

  it("never locks out the platform administrator", () => {
    setup("SUSPENDED", null, "SUPERADMIN");

    expect(screen.getByText("the workspace")).toBeInTheDocument();
  });
});
