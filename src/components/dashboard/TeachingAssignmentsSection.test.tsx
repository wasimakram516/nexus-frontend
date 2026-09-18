import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { customFieldsService } from "@/services/customFields.service";
import { peopleService } from "@/services/people.service";
import TeachingAssignmentsSection from "./TeachingAssignmentsSection";

vi.mock("@/services/people.service", () => ({
  peopleService: {
    assignTeacherToSubject: vi.fn(),
    removeTeacherSubject: vi.fn(),
  },
}));

vi.mock("@/services/customFields.service", () => ({ customFieldsService: { getFormDefinitions: vi.fn() } }));

const campuses = [{ id: "campus-1", name: "Main Campus" }];
const levels = [{ id: "level-1", name: "Level 1", campusId: "campus-1" }];
const classes = [{ id: "class-1", name: "Class 1", levelId: "level-1" }];
const sections = [{ id: "section-1", name: "Section A", classId: "class-1" }];
const subjects = [{ id: "subject-1", name: "Math", classId: "class-1" }];
const teachers = [{ id: "teacher-1", userId: "user-1", campusId: "campus-1" }];
const teacherName = (id: string) => (id === "teacher-1" ? "Jane Teacher" : "—");

function renderSection(onReload = vi.fn()) {
  return {
    onReload,
    ...render(
      <MessageProvider>
        <ConfirmProvider>
          <TeachingAssignmentsSection
            assignments={[]}
            loading={false}
            teachers={teachers}
            teacherName={teacherName}
            campuses={campuses}
            levels={levels}
            classes={classes}
            sections={sections}
            subjects={subjects}
            canManage
            onReload={onReload}
            institutionId="institution-1"
          />
        </ConfirmProvider>
      </MessageProvider>
    ),
  };
}

describe("TeachingAssignmentsSection", () => {
  beforeEach(() => {
    vi.mocked(peopleService.assignTeacherToSubject).mockReset();
    vi.mocked(customFieldsService.getFormDefinitions).mockReset().mockResolvedValue({ data: { data: [] } } as never);
  });

  it("sends staffProfileId (not teacherId) in the assignment payload", async () => {
    const user = userEvent.setup();
    vi.mocked(peopleService.assignTeacherToSubject).mockResolvedValue({
      data: { message: "Teacher assigned.", data: { id: "assignment-1" } },
    } as never);

    const { onReload } = renderSection();

    await user.click(screen.getByRole("button", { name: "Assign Teacher" }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByLabelText(/Class/));
    await user.click(await screen.findByRole("option", { name: "Class 1" }));

    await user.click(within(dialog).getByLabelText(/Section/));
    await user.click(await screen.findByRole("option", { name: "Section A" }));

    await user.click(within(dialog).getByLabelText(/Subject/));
    await user.click(await screen.findByRole("option", { name: "Math" }));

    await user.click(within(dialog).getByLabelText(/Teacher/));
    await user.click(await screen.findByRole("option", { name: "Jane Teacher" }));

    await user.click(within(dialog).getByRole("button", { name: "Assign" }));

    expect(peopleService.assignTeacherToSubject).toHaveBeenCalledWith({
      staffProfileId: "teacher-1",
      classId: "class-1",
      subjectId: "subject-1",
      sectionId: "section-1",
      campusId: "campus-1",
      customFields: {},
    });
    expect(peopleService.assignTeacherToSubject).not.toHaveBeenCalledWith(
      expect.objectContaining({ teacherId: expect.anything() })
    );
    expect(onReload).toHaveBeenCalled();
  });

  it("blocks assignment until a required custom field is filled, then submits it", async () => {
    vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({
      data: { data: [{ id: "assignment-cf", fieldKey: "LOAD_NOTE", label: "Load note", inputType: "TEXT", isRequired: true }] },
    } as never);
    vi.mocked(peopleService.assignTeacherToSubject).mockResolvedValue({
      data: { message: "Teacher assigned.", data: { id: "assignment-1" } },
    } as never);
    const user = userEvent.setup();

    const { onReload } = renderSection();

    await user.click(screen.getByRole("button", { name: "Assign Teacher" }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByLabelText(/Class/));
    await user.click(await screen.findByRole("option", { name: "Class 1" }));
    await user.click(within(dialog).getByLabelText(/Section/));
    await user.click(await screen.findByRole("option", { name: "Section A" }));
    await user.click(within(dialog).getByLabelText(/Subject/));
    await user.click(await screen.findByRole("option", { name: "Math" }));
    await user.click(within(dialog).getByLabelText(/Teacher/));
    await user.click(await screen.findByRole("option", { name: "Jane Teacher" }));

    expect(within(dialog).getByRole("button", { name: "Assign" })).toBeDisabled();

    await user.type(await within(dialog).findByLabelText(/^Load note/), "Half-day allocation");
    await user.click(within(dialog).getByRole("button", { name: "Assign" }));

    await waitFor(() =>
      expect(peopleService.assignTeacherToSubject).toHaveBeenCalledWith(
        expect.objectContaining({ customFields: { LOAD_NOTE: "Half-day allocation" } })
      )
    );
    expect(onReload).toHaveBeenCalled();
    expect(customFieldsService.getFormDefinitions).toHaveBeenCalledWith({
      entityType: "teacher_subject",
      institutionId: "institution-1",
      action: "create",
    });
  });
});
