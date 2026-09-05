import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MessageProvider } from "@/contexts/MessageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { academicsService } from "@/services/academics.service";
import AcademicYearSelector from "./AcademicYearSelector";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: vi.fn(),
}));

vi.mock("@/services/academics.service", () => ({
  academicsService: { getCurrentAcademicYear: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function mockRuntime(academicsEnabled: boolean) {
  vi.mocked(useRuntimeConfig).mockReturnValue({
    isModuleEnabled: (key: string) => (key === "ACADEMICS" ? academicsEnabled : false),
  } as never);
}

function mockUser(role: string | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: role ? { id: "u1", email: "u@test.com", name: "U", role, institutionId: "inst-1", sessionId: "s1" } : null,
  } as never);
}

function renderSelector() {
  return render(
    <MessageProvider>
      <AcademicYearSelector />
    </MessageProvider>
  );
}

describe("AcademicYearSelector", () => {
  beforeEach(() => {
    vi.mocked(academicsService.getCurrentAcademicYear).mockReset();
  });

  it("renders nothing when the ACADEMICS module is disabled", () => {
    mockRuntime(false);
    mockUser("ADMIN");

    const { container } = renderSelector();

    expect(container).toBeEmptyDOMElement();
    expect(academicsService.getCurrentAcademicYear).not.toHaveBeenCalled();
  });

  it("renders the current academic year chip on success", async () => {
    mockRuntime(true);
    mockUser("STAFF");
    vi.mocked(academicsService.getCurrentAcademicYear).mockResolvedValue({
      data: {
        message: "ok",
        data: {
          academicYear: { id: "year-1", name: "2026-27", startDate: "2026-08-01", endDate: "2027-06-30" },
          effectiveStartDate: "2026-08-01",
          effectiveEndDate: "2027-06-30",
          isOverridden: false,
        },
      },
    } as never);

    renderSelector();

    expect(await screen.findByText("2026-27")).toBeInTheDocument();
  });

  it("renders the admin-only setup nudge on 404 for an ADMIN user", async () => {
    mockRuntime(true);
    mockUser("ADMIN");
    vi.mocked(academicsService.getCurrentAcademicYear).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404, data: { message: "No current academic year set." } },
    });

    renderSelector();

    expect(await screen.findByText(/set up academic year/i)).toBeInTheDocument();
  });

  it("renders nothing on 404 for a non-admin user", async () => {
    mockRuntime(true);
    mockUser("STAFF");
    vi.mocked(academicsService.getCurrentAcademicYear).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404, data: { message: "No current academic year set." } },
    });

    const { container } = renderSelector();

    await waitFor(() => expect(academicsService.getCurrentAcademicYear).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/set up academic year/i)).not.toBeInTheDocument();
  });
});
