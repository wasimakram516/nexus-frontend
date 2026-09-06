import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MessageProvider } from "@/contexts/MessageContext";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { noticesService } from "@/services/notices.service";
import NoticeBell from "./NoticeBell";

vi.mock("@/contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: vi.fn(),
}));

vi.mock("@/services/notices.service", () => ({
  noticesService: { getNoticesForMe: vi.fn() },
}));

function mockRuntime(noticesEnabled: boolean) {
  vi.mocked(useRuntimeConfig).mockReturnValue({
    isModuleEnabled: (key: string) => (key === "NOTICES" ? noticesEnabled : false),
  } as never);
}

function renderBell() {
  return render(
    <MessageProvider>
      <NoticeBell />
    </MessageProvider>
  );
}

/** Builds a minimal, otherwise-unscoped notice for list fixtures. */
function buildNotice(id: string) {
  return {
    id,
    institutionId: "inst-1",
    campusId: null,
    classId: null,
    sectionId: null,
    targetRole: null,
    title: `Notice ${id}`,
    body: "Body text for this notice.",
    attachments: [],
    publishAt: "2026-09-01T00:00:00.000Z",
    expiresAt: null,
    createdAt: "2026-08-30T00:00:00.000Z",
    updatedAt: "2026-08-30T00:00:00.000Z",
  };
}

describe("NoticeBell", () => {
  beforeEach(() => {
    vi.mocked(noticesService.getNoticesForMe).mockReset();
  });

  it("renders nothing when the NOTICES module is disabled", () => {
    mockRuntime(false);

    const { container } = renderBell();

    expect(container).toBeEmptyDOMElement();
    expect(noticesService.getNoticesForMe).not.toHaveBeenCalled();
  });

  it("renders the count badge when notices exist", async () => {
    mockRuntime(true);
    vi.mocked(noticesService.getNoticesForMe).mockResolvedValue({
      data: { data: { items: [buildNotice("1"), buildNotice("2")], total: 2, page: 1, limit: 20 } },
    } as never);

    renderBell();

    expect(await screen.findByText("2")).toBeInTheDocument();
  });

  it("renders nothing (not a zero-badge) when there are no visible notices", async () => {
    mockRuntime(true);
    vi.mocked(noticesService.getNoticesForMe).mockResolvedValue({
      data: { data: { items: [], total: 0, page: 1, limit: 20 } },
    } as never);

    const { container } = renderBell();

    await waitFor(() => expect(noticesService.getNoticesForMe).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
