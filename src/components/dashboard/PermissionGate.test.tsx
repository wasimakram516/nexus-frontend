import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import PermissionGate from "./PermissionGate";

vi.mock("@/contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: vi.fn(),
}));

describe("PermissionGate", () => {
  it("shows a loading spinner while runtime config is still loading", () => {
    vi.mocked(useRuntimeConfig).mockReturnValue({
      isLoading: true,
      can: vi.fn(),
    } as never);

    render(
      <PermissionGate feature="audit_logs" action="read">
        <div>Protected content</div>
      </PermissionGate>
    );

    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("shows a no-access card when the user lacks the grant", () => {
    vi.mocked(useRuntimeConfig).mockReturnValue({
      isLoading: false,
      can: vi.fn().mockReturnValue(false),
    } as never);

    render(
      <PermissionGate feature="audit_logs" action="read">
        <div>Protected content</div>
      </PermissionGate>
    );

    expect(screen.getByText(/no access/i)).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children when the user has the grant", () => {
    const can = vi.fn().mockReturnValue(true);
    vi.mocked(useRuntimeConfig).mockReturnValue({ isLoading: false, can } as never);

    render(
      <PermissionGate feature="audit_logs" action="read">
        <div>Protected content</div>
      </PermissionGate>
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(can).toHaveBeenCalledWith("audit_logs", "read");
  });
});
