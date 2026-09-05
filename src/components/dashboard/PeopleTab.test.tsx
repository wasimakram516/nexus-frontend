import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { academicsService } from "@/services/academics.service";
import { authService } from "@/services/auth.service";
import { peopleService } from "@/services/people.service";
import PeopleTab, { PersonRecord } from "./PeopleTab";

vi.mock("@/services/people.service", () => ({
  peopleService: {
    createStudent: vi.fn(),
    getStudents: vi.fn(),
    getStudent: vi.fn(),
    updateStudent: vi.fn(),
    deleteStudent: vi.fn(),
    getNextRegNo: vi.fn(),
    createStudentEnrollment: vi.fn(),
    getStudentEnrollments: vi.fn(),
    getStudentEnrollment: vi.fn(),
    updateStudentEnrollment: vi.fn(),
    deleteStudentEnrollment: vi.fn(),
    withdrawStudentEnrollment: vi.fn(),
    previewPromotion: vi.fn(),
    commitPromotion: vi.fn(),
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

vi.mock("@/services/academics.service", () => ({
  academicsService: {
    getAcademicYears: vi.fn(),
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

const studentCampuses = [
  { id: "campus-1", name: "Main Campus" },
  { id: "campus-2", name: "North Campus" },
];

const studentUsers = [
  {
    id: "user-1",
    name: "Sara Ahmed",
    email: "sara@school.edu",
    role: "STUDENT",
    status: "ACTIVE",
    institutionId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function renderStudentsTab(opts: { rows?: PersonRecord[]; onReload?: () => void } = {}) {
  const onReload = opts.onReload ?? vi.fn();
  return {
    onReload,
    ...render(
      <MessageProvider>
        <ConfirmProvider>
          <PeopleTab
            kind="students"
            rows={opts.rows ?? []}
            loading={false}
            users={studentUsers}
            campuses={studentCampuses}
            classes={[]}
            sections={[]}
            students={opts.rows ?? []}
            guardians={[]}
            onReload={onReload}
            canManage
          />
        </ConfirmProvider>
      </MessageProvider>
    ),
  };
}

/** Opens the student create dialog and advances to the profile step with a new account. */
async function fillStudentAccountStepAndContinue(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Add Student" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText(/Full Name/), "Ali Khan");
  await user.type(within(dialog).getByLabelText(/Email Address/), "ali@school.edu");
  await user.type(within(dialog).getByLabelText(/Password/), "StrongPass123");
  await user.click(within(dialog).getByRole("button", { name: "Continue" }));
  return dialog;
}

describe("PeopleTab (students)", () => {
  beforeEach(() => {
    vi.mocked(peopleService.getNextRegNo).mockReset();
    vi.mocked(peopleService.withdrawStudentEnrollment).mockReset();
    vi.mocked(academicsService.getAcademicYears).mockReset().mockResolvedValue({
      data: { data: [] },
    } as never);
    vi.mocked(authService.register).mockReset();
  });

  it("pre-fills the suggested registration number once a campus is picked on create", async () => {
    const user = userEvent.setup();
    vi.mocked(peopleService.getNextRegNo).mockResolvedValue({
      data: { data: { suggestedRegNo: "STD-0099" } },
    } as never);

    renderStudentsTab();
    const dialog = await fillStudentAccountStepAndContinue(user);

    await user.click(within(dialog).getByLabelText(/Campus/));
    await user.click(await screen.findByRole("option", { name: "Main Campus" }));

    await waitFor(
      () => {
        expect(peopleService.getNextRegNo).toHaveBeenCalledWith("campus-1");
      },
      { timeout: 5000 }
    );
    expect(await within(dialog).findByDisplayValue("STD-0099", {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it("disables the Class/Section selects when editing an existing student", async () => {
    const user = userEvent.setup();
    const row: PersonRecord = {
      id: "student-1",
      userId: "user-1",
      campusId: "campus-1",
      regNo: "STD-0001",
      currentEnrollment: {
        id: "enr-1",
        academicYearId: "year-1",
        classId: "class-1",
        className: "Grade 5",
        sectionId: "sec-1",
        sectionName: "A",
        status: "ACTIVE",
      },
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    renderStudentsTab({ rows: [row] });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByLabelText(/Class/)).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).getByLabelText(/Section/)).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).getAllByText("Use Transfer Class/Section to change this.").length).toBeGreaterThan(0);
  });

  it("shows the outstanding-dues amount on a 409 and resubmits with acknowledgement", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    const row: PersonRecord = {
      id: "student-1",
      userId: "user-1",
      campusId: "campus-1",
      regNo: "STD-0001",
      currentEnrollment: {
        id: "enr-1",
        academicYearId: "year-1",
        classId: "class-1",
        className: "Grade 5",
        sectionId: "sec-1",
        sectionName: "A",
        status: "ACTIVE",
      },
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    vi.mocked(peopleService.withdrawStudentEnrollment)
      .mockRejectedValueOnce({
        response: { status: 409, data: { error: { details: { outstandingAmount: 5000 } } } },
      })
      .mockResolvedValueOnce({ data: { message: "Student withdrawn.", data: {} } } as never);

    renderStudentsTab({ rows: [row], onReload });

    await user.click(screen.getByRole("button", { name: "Withdraw Student" }));
    const dialog = await screen.findByRole("dialog");
    // Left Date is pre-filled with today's date — clear it first so typing
    // a fixed date doesn't collide with the native date-input's segments.
    await user.clear(within(dialog).getByLabelText(/Left Date/));
    await user.type(within(dialog).getByLabelText(/Left Date/), "2026-06-30");
    await user.type(within(dialog).getByLabelText(/Left Reason/), "Relocating");

    await user.click(within(dialog).getByRole("button", { name: "Withdraw Student" }));
    expect(await within(dialog).findByText(/PKR 5,000/, {}, { timeout: 5000 })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Withdraw Anyway" }));

    await waitFor(() => expect(onReload).toHaveBeenCalled(), { timeout: 5000 });
    expect(peopleService.withdrawStudentEnrollment).toHaveBeenNthCalledWith(2, "enr-1", {
      leftDate: "2026-06-30",
      leftReason: "Relocating",
      acknowledgeOutstandingDues: true,
    });
  });
});
