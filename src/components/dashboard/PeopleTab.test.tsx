import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { authService } from "@/services/auth.service";
import { peopleService } from "@/services/people.service";
import PeopleTab from "./PeopleTab";

vi.mock("@/services/people.service", () => ({
  peopleService: {
    createStudent: vi.fn(),
    getStudents: vi.fn(),
    getStudent: vi.fn(),
    updateStudent: vi.fn(),
    deleteStudent: vi.fn(),
    createGuardian: vi.fn(),
    getGuardians: vi.fn(),
    getGuardian: vi.fn(),
    updateGuardian: vi.fn(),
    deleteGuardian: vi.fn(),
    createStaffProfile: vi.fn(),
    getStaffProfiles: vi.fn(),
    getStaffProfile: vi.fn(),
    updateStaffProfile: vi.fn(),
    deleteStaffProfile: vi.fn(),
    linkGuardianToStudent: vi.fn(),
    unlinkGuardian: vi.fn(),
    recordStudentPromotion: vi.fn(),
    assignTeacherToSubject: vi.fn(),
    getTeacherSubjects: vi.fn(),
    removeTeacherSubject: vi.fn(),
    createContact: vi.fn(),
  },
}));

vi.mock("@/services/auth.service", () => ({
  authService: {
    register: vi.fn(),
  },
}));

const campuses = [{ id: "campus-1", name: "Main Campus" }];

function renderStaffTab(onReload = vi.fn()) {
  return {
    onReload,
    ...render(
      <MessageProvider>
        <ConfirmProvider>
          <PeopleTab
            kind="staff"
            rows={[]}
            loading={false}
            users={[]}
            campuses={campuses}
            classes={[]}
            sections={[]}
            students={[]}
            guardians={[]}
            onReload={onReload}
            canManage
          />
        </ConfirmProvider>
      </MessageProvider>
    ),
  };
}

/** Opens the create dialog and advances past the account step with a new account. */
async function fillAccountStepAndContinue(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Add Staff Member" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText(/Full Name/), "Jane Doe");
  await user.type(within(dialog).getByLabelText(/Email Address/), "jane@school.edu");
  await user.type(within(dialog).getByLabelText(/Password/), "StrongPass123");
  await user.click(within(dialog).getByRole("button", { name: "Continue" }));
  return dialog;
}

describe("PeopleTab (staff)", () => {
  beforeEach(() => {
    vi.mocked(peopleService.createStaffProfile).mockReset();
    vi.mocked(authService.register).mockReset();
  });

  it("blocks staff creation until employmentType, designation, and joiningDate are filled in", async () => {
    const user = userEvent.setup();
    renderStaffTab();

    const dialog = await fillAccountStepAndContinue(user);

    // Campus is auto-selected (only one campus), but employment fields are empty.
    await user.click(within(dialog).getByRole("button", { name: "Create Staff Member" }));

    expect(peopleService.createStaffProfile).not.toHaveBeenCalled();
    expect(authService.register).not.toHaveBeenCalled();
    expect(within(dialog).getByText("Designation is required.")).toBeInTheDocument();
  });

  it("submits employmentType, designation, and joiningDate once filled in", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.register).mockResolvedValue({
      data: { data: { id: "user-1" } },
    } as never);
    vi.mocked(peopleService.createStaffProfile).mockResolvedValue({
      data: { message: "Staff Member created.", data: { id: "staff-1" } },
    } as never);

    const { onReload } = renderStaffTab();
    const dialog = await fillAccountStepAndContinue(user);

    await user.click(within(dialog).getByLabelText(/Gender/));
    await user.click(await screen.findByRole("option", { name: "MALE" }));

    await user.type(within(dialog).getByLabelText(/Designation/), "Front Desk Officer");

    await user.click(within(dialog).getByLabelText(/Employment Type/));
    await user.click(await screen.findByRole("option", { name: "TEACHING" }));

    await user.type(within(dialog).getByLabelText(/Joining Date/), "2026-01-15");

    await user.click(within(dialog).getByRole("button", { name: "Create Staff Member" }));

    expect(authService.register).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Jane Doe", email: "jane@school.edu", role: "STAFF" })
    );
    expect(peopleService.createStaffProfile).toHaveBeenCalledWith({
      userId: "user-1",
      campusId: "campus-1",
      gender: "MALE",
      employmentType: "TEACHING",
      designation: "Front Desk Officer",
      joiningDate: "2026-01-15",
    });
    expect(onReload).toHaveBeenCalled();
  });
});
