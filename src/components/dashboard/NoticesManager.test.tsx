import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { academicsService } from "@/services/academics.service";
import { campusesService } from "@/services/campuses.service";
import { noticesService } from "@/services/notices.service";
import NoticesManager, { Notice, summarizeNoticeAudience } from "./NoticesManager";

vi.mock("@/services/notices.service", () => ({
  noticesService: {
    createNotice: vi.fn(),
    getNotices: vi.fn(),
    getNotice: vi.fn(),
    updateNotice: vi.fn(),
    deleteNotice: vi.fn(),
    getNoticesForMe: vi.fn(),
  },
}));

vi.mock("@/services/campuses.service", () => ({
  campusesService: { getAll: vi.fn() },
}));

vi.mock("@/services/academics.service", () => ({
  academicsService: {
    getLevels: vi.fn(),
    getClasses: vi.fn(),
    getSections: vi.fn(),
  },
}));

vi.mock("@/contexts/RuntimeConfigContext", () => ({
  useOptionalRuntimeConfig: vi.fn(),
}));

const sampleNotice: Notice = {
  id: "notice-1",
  institutionId: "inst-1",
  campusId: null,
  classId: null,
  sectionId: null,
  targetRole: null,
  title: "Announcement",
  body: "This is a test notice body.",
  attachments: [],
  publishAt: "2026-09-01T00:00:00.000Z",
  expiresAt: null,
  createdAt: "2026-08-30T00:00:00.000Z",
  updatedAt: "2026-08-30T00:00:00.000Z",
};

/** Resolves every audience-picker lookup call with an empty list. */
function mockEmptyLookups() {
  vi.mocked(campusesService.getAll).mockResolvedValue({ data: { data: { items: [] } } } as never);
  vi.mocked(academicsService.getLevels).mockResolvedValue({ data: { data: [] } } as never);
  vi.mocked(academicsService.getClasses).mockResolvedValue({ data: { data: [] } } as never);
  vi.mocked(academicsService.getSections).mockResolvedValue({ data: { data: [] } } as never);
}

function renderManager() {
  return render(
    <MessageProvider>
      <NoticesManager />
    </MessageProvider>
  );
}

describe("NoticesManager", () => {
  beforeEach(() => {
    vi.mocked(noticesService.createNotice).mockReset();
    vi.mocked(noticesService.getNotices).mockReset();
    vi.mocked(noticesService.updateNotice).mockReset();
    vi.mocked(noticesService.deleteNotice).mockReset();
    vi.mocked(campusesService.getAll).mockReset();
    vi.mocked(academicsService.getLevels).mockReset();
    vi.mocked(academicsService.getClasses).mockReset();
    vi.mocked(academicsService.getSections).mockReset();
    // canManage falls back to true when there's no runtime config in scope.
    vi.mocked(useOptionalRuntimeConfig).mockReturnValue(null as never);
    mockEmptyLookups();
  });

  it("blocks notice creation until title and body are filled in", async () => {
    const user = userEvent.setup();
    vi.mocked(noticesService.getNotices).mockResolvedValue({ data: { data: [] } } as never);

    renderManager();

    await user.click(await screen.findByRole("button", { name: "Add First Notice" }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Create Notice" }));

    expect(noticesService.createNotice).not.toHaveBeenCalled();
    expect(within(dialog).getByText("Title is required.")).toBeInTheDocument();
    expect(within(dialog).getByText("Body is required.")).toBeInTheDocument();
  });

  it("submits the create dialog once title and body are filled in", async () => {
    const user = userEvent.setup();
    vi.mocked(noticesService.getNotices).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(noticesService.createNotice).mockResolvedValue({
      data: { message: "Notice created.", data: { ...sampleNotice } },
    } as never);

    renderManager();

    await user.click(await screen.findByRole("button", { name: "Add First Notice" }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Title *"), "Holiday Notice");
    await user.type(within(dialog).getByLabelText("Body *"), "School is closed on Friday.");
    await user.click(within(dialog).getByRole("button", { name: "Create Notice" }));

    expect(noticesService.createNotice).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Holiday Notice", body: "School is closed on Friday." }),
      undefined
    );
  });

  it("asks for confirmation before deleting a notice", async () => {
    const user = userEvent.setup();
    vi.mocked(noticesService.getNotices).mockResolvedValue({ data: { data: [sampleNotice] } } as never);
    vi.mocked(noticesService.deleteNotice).mockResolvedValue({
      data: { message: "Moved to recycle bin.", data: null },
    } as never);

    renderManager();

    const row = (await screen.findByText("Announcement")).closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /delete/i }));

    const confirmDialog = await screen.findByRole("dialog");
    expect(noticesService.deleteNotice).not.toHaveBeenCalled();

    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

    expect(noticesService.deleteNotice).toHaveBeenCalledWith("notice-1", undefined);
  });
});

describe("summarizeNoticeAudience", () => {
  const campusNames = { "campus-1": "Main Campus" };
  const classNames = { "class-1": "Grade 5" };
  const sectionNames = { "section-1": "A" };

  it("returns All when every scope field is unset", () => {
    expect(
      summarizeNoticeAudience(
        { campusId: null, classId: null, sectionId: null, targetRole: null },
        campusNames,
        classNames,
        sectionNames
      )
    ).toBe("All");
  });

  it("summarizes a campus-only scope", () => {
    expect(
      summarizeNoticeAudience(
        { campusId: "campus-1", classId: null, sectionId: null, targetRole: null },
        campusNames,
        classNames,
        sectionNames
      )
    ).toBe("Campus Main Campus");
  });

  it("summarizes a class + section scope", () => {
    expect(
      summarizeNoticeAudience(
        { campusId: null, classId: "class-1", sectionId: "section-1", targetRole: null },
        campusNames,
        classNames,
        sectionNames
      )
    ).toBe("Class Grade 5, Section A");
  });

  it("summarizes a role-only scope", () => {
    expect(
      summarizeNoticeAudience(
        { campusId: null, classId: null, sectionId: null, targetRole: "STAFF" },
        campusNames,
        classNames,
        sectionNames
      )
    ).toBe("Role: STAFF");
  });

  it("combines campus and role into one summary", () => {
    expect(
      summarizeNoticeAudience(
        { campusId: "campus-1", classId: null, sectionId: null, targetRole: "STAFF" },
        campusNames,
        classNames,
        sectionNames
      )
    ).toBe("Campus Main Campus, Role: STAFF");
  });

  it("falls back to Unknown for an id missing from the lookup map", () => {
    expect(
      summarizeNoticeAudience(
        { campusId: "campus-404", classId: null, sectionId: null, targetRole: null },
        campusNames,
        classNames,
        sectionNames
      )
    ).toBe("Campus Unknown");
  });
});
