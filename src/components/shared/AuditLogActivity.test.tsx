import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { auditLogsService } from "@/services/auditLogs.service";
import AuditLogActivity from "./AuditLogActivity";

vi.mock("@/services/auditLogs.service", () => ({
  auditLogsService: { getAll: vi.fn() },
}));

function renderActivity(showInstitutionColumn = false) {
  return render(
    <MessageProvider>
      <AuditLogActivity showInstitutionColumn={showInstitutionColumn} />
    </MessageProvider>
  );
}

const sampleResponse = (overrides: Partial<{ items: unknown[]; total: number }> = {}) => ({
  data: {
    message: "ok",
    data: {
      items: [
        {
          id: "log-1",
          action: "STUDENT_UPDATED",
          entity: "Student",
          entityId: "student-1",
          createdAt: "2026-07-18T10:00:00.000Z",
          before: { name: "Old" },
          after: { name: "New" },
          user: { name: "Admin User", email: "admin@nexus.test", role: "ADMIN" },
          institution: { name: "North Campus School", slug: "north-campus" },
        },
      ],
      total: 1,
      ...overrides,
    },
  },
});

describe("AuditLogActivity", () => {
  beforeEach(() => {
    vi.mocked(auditLogsService.getAll).mockReset();
    vi.mocked(auditLogsService.getAll).mockResolvedValue(sampleResponse() as never);
  });

  it("lists activity rows from the backend", async () => {
    renderActivity();

    await waitFor(() => {
      expect(screen.getByText("STUDENT UPDATED")).toBeInTheDocument();
    });
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("hides the institution column by default and shows it when requested", async () => {
    const { unmount } = renderActivity(false);
    await waitFor(() => expect(auditLogsService.getAll).toHaveBeenCalled());
    expect(screen.queryByText("North Campus School")).not.toBeInTheDocument();
    unmount();

    renderActivity(true);
    await waitFor(() => {
      expect(screen.getByText("North Campus School")).toBeInTheDocument();
    });
  });

  it("shows an empty state when there is no activity", async () => {
    vi.mocked(auditLogsService.getAll).mockResolvedValue(
      sampleResponse({ items: [], total: 0 }) as never,
    );

    renderActivity();

    await waitFor(() => {
      expect(screen.getByText(/no activity found/i)).toBeInTheDocument();
    });
  });

  it("re-fetches with the selected action filter", async () => {
    const user = userEvent.setup();
    renderActivity();
    await waitFor(() => expect(auditLogsService.getAll).toHaveBeenCalledTimes(1));

    await user.click(screen.getByLabelText(/^action$/i));
    await user.click(await screen.findByRole("option", { name: "Deleted" }));

    await waitFor(() => {
      expect(auditLogsService.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ action: "DELETED", page: 1 }),
      );
    });
  });

  it("opens the diff viewer when a row is clicked", async () => {
    const user = userEvent.setup();
    renderActivity();

    await waitFor(() => expect(screen.getByText("STUDENT UPDATED")).toBeInTheDocument());
    await user.click(screen.getByText("STUDENT UPDATED"));

    expect(await screen.findByText("Old")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
  });
});
