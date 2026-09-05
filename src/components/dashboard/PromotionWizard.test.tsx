import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { academicsService } from "@/services/academics.service";
import { peopleService } from "@/services/people.service";
import type { PersonRecord } from "./PeopleTab";
import PromotionWizard from "./PromotionWizard";

vi.mock("@/services/academics.service", () => ({
  academicsService: {
    getAcademicYears: vi.fn(),
  },
}));

vi.mock("@/services/people.service", () => ({
  peopleService: {
    getStudentEnrollments: vi.fn(),
    previewPromotion: vi.fn(),
    commitPromotion: vi.fn(),
  },
}));

const campuses = [{ id: "campus-1", name: "Main Campus" }];
const classes = [
  { id: "class-1", name: "Grade 5" },
  { id: "class-2", name: "Grade 6" },
];
const sections = [
  { id: "sec-1", name: "A", classId: "class-1" },
  { id: "sec-2", name: "A", classId: "class-2" },
];
const students: PersonRecord[] = [
  { id: "student-1", userId: "user-1", campusId: "campus-1", regNo: "STD-0001", createdAt: "2026-01-01T00:00:00.000Z" },
];
const users = [
  {
    id: "user-1",
    name: "Ali Khan",
    email: "ali@school.edu",
    role: "STUDENT",
    status: "ACTIVE",
    institutionId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const academicYears = [
  {
    id: "year-1",
    name: "2025-26",
    startDate: "2025-08-01T00:00:00.000Z",
    endDate: "2026-06-30T00:00:00.000Z",
    isCurrent: true,
    campusOverrides: [],
    createdAt: "2025-07-01T00:00:00.000Z",
  },
  {
    id: "year-2",
    name: "2026-27",
    startDate: "2026-08-01T00:00:00.000Z",
    endDate: "2027-06-30T00:00:00.000Z",
    isCurrent: false,
    campusOverrides: [],
    createdAt: "2026-07-01T00:00:00.000Z",
  },
];

const enrollments = [
  { id: "enr-1", studentId: "student-1", academicYearId: "year-1", classId: "class-1", sectionId: "sec-1", status: "ACTIVE" },
];

function renderWizard(onComplete = vi.fn(), onClose = vi.fn()) {
  return {
    onComplete,
    onClose,
    ...render(
      <MessageProvider>
        <PromotionWizard
          open
          onClose={onClose}
          campuses={campuses}
          classes={classes}
          sections={sections}
          students={students}
          users={users}
          onComplete={onComplete}
        />
      </MessageProvider>
    ),
  };
}

describe("PromotionWizard", () => {
  beforeEach(() => {
    vi.mocked(academicsService.getAcademicYears).mockReset().mockResolvedValue({
      data: { data: academicYears },
    } as never);
    vi.mocked(peopleService.getStudentEnrollments).mockReset().mockResolvedValue({
      data: { data: enrollments },
    } as never);
    vi.mocked(peopleService.previewPromotion).mockReset();
    vi.mocked(peopleService.commitPromotion).mockReset();
  });

  it("blocks Next while the preview reports conflicts, then unblocks once a mapping resolves them", async () => {
    const user = userEvent.setup();
    vi.mocked(peopleService.previewPromotion)
      .mockResolvedValueOnce({
        data: {
          data: {
            totalStudents: 1,
            byOutcome: { promoted: 0, repeated: 0, left: 0 },
            perClassBreakdown: [],
            conflicts: [{ studentId: "student-1", studentName: "Ali Khan", classId: "class-1", className: "Grade 5" }],
          },
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          data: {
            totalStudents: 1,
            byOutcome: { promoted: 1, repeated: 0, left: 0 },
            perClassBreakdown: [{ classId: "class-2", className: "Grade 6", promoted: 1, repeated: 0, left: 0 }],
            conflicts: [],
          },
        },
      } as never);

    renderWizard();

    // Class mapping row only appears once the source year's enrollments load.
    await screen.findByText("Grade 5", {}, { timeout: 5000 });

    await user.click(screen.getByLabelText(/To Academic Year/));
    await user.click(await screen.findByRole("option", { name: "2026-27" }));

    await user.click(screen.getByRole("button", { name: "Preview" }));
    await screen.findByText(/class mapping or an exception/i, {}, { timeout: 5000 });
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await user.click(screen.getByLabelText("Promotes To"));
    await user.click(await screen.findByRole("option", { name: "Grade 6" }));

    // Changing the mapping invalidates the stale (conflicted) preview.
    expect(screen.queryByText(/class mapping or an exception/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Preview" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled(), { timeout: 5000 });

    expect(peopleService.previewPromotion).toHaveBeenCalledTimes(2);
  });

  it("commits with the previewed payload and reports the result on success", async () => {
    const user = userEvent.setup();
    vi.mocked(peopleService.previewPromotion).mockResolvedValue({
      data: {
        data: {
          totalStudents: 1,
          byOutcome: { promoted: 1, repeated: 0, left: 0 },
          perClassBreakdown: [{ classId: "class-2", className: "Grade 6", promoted: 1, repeated: 0, left: 0 }],
          conflicts: [],
        },
      },
    } as never);
    vi.mocked(peopleService.commitPromotion).mockResolvedValue({
      data: { data: { promoted: 1, repeated: 0, left: 0, skippedAlreadyProcessed: 0 } },
    } as never);

    const { onComplete } = renderWizard();

    await screen.findByText("Grade 5", {}, { timeout: 5000 });

    await user.click(screen.getByLabelText(/To Academic Year/));
    await user.click(await screen.findByRole("option", { name: "2026-27" }));

    await user.click(screen.getByLabelText("Promotes To"));
    await user.click(await screen.findByRole("option", { name: "Grade 6" }));

    await user.click(screen.getByRole("button", { name: "Preview" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled(), { timeout: 5000 });

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Confirm & Commit" }));

    await waitFor(
      () => {
        expect(peopleService.commitPromotion).toHaveBeenCalledWith({
          campusId: "campus-1",
          sourceAcademicYearId: "year-1",
          targetAcademicYearId: "year-2",
          classMappings: [{ fromClassId: "class-1", toClassId: "class-2" }],
        });
      },
      { timeout: 5000 }
    );

    const dialog = screen.getByRole("dialog");
    await within(dialog).findByText("Promotion committed.");
    await user.click(within(dialog).getByRole("button", { name: "Done" }));
    expect(onComplete).toHaveBeenCalled();
  });
});
