import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/contexts/AuthContext";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { platformService } from "@/services/platform.service";
import BrandingPage from "./page";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/contexts/RuntimeConfigContext", () => ({ useRuntimeConfig: vi.fn() }));
vi.mock("@/services/platform.service", () => ({ platformService: { updateMyBranding: vi.fn() } }));
vi.mock("@/components/platform/InstitutionBrandingTab", () => ({
  default: ({ institutionId, save, onSaved }: { institutionId: string; save: (payload: Record<string, unknown>) => unknown; onSaved: () => void }) => (
    <div>
      <span>editor for {institutionId}</span>
      <button
        onClick={async () => {
          await save({ theme: "dark" });
          onSaved();
        }}
      >
        save branding
      </button>
    </div>
  ),
}));

const refresh = vi.fn();
const setup = (role: string, config: unknown = { institutionId: "inst-1" }, isLoading = false) => {
  vi.mocked(useAuth).mockReturnValue({ user: { role } } as never);
  vi.mocked(useRuntimeConfig).mockReturnValue({ config, isLoading, refresh } as never);
};

describe("BrandingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(platformService.updateMyBranding).mockResolvedValue({ data: { data: {} } } as never);
  });

  it("gives a school's administrator the editor for their own school, saving through their own route and then reloading", async () => {
    setup("ADMIN");
    const user = userEvent.setup();
    render(<BrandingPage />);

    expect(screen.getByText("editor for inst-1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "save branding" }));

    expect(platformService.updateMyBranding).toHaveBeenCalledWith({ theme: "dark" });
    expect(refresh).toHaveBeenCalled();
  });

  it.each(["STAFF", "STUDENT", "GUARDIAN"])("tells %s that only an administrator can change it", (role) => {
    setup(role);
    render(<BrandingPage />);

    expect(screen.getByText("Only a school administrator can change the branding")).toBeInTheDocument();
    expect(screen.queryByText(/editor for/)).not.toBeInTheDocument();
  });

  it("waits for the school's settings, and does not show the editor without them", () => {
    setup("ADMIN", null);
    render(<BrandingPage />);

    expect(screen.queryByText(/editor for/)).not.toBeInTheDocument();

    setup("ADMIN", null, true);
    render(<BrandingPage />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
