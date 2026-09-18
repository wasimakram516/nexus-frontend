import { customFieldsService } from "@/services/customFields.service";
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

vi.mock("@/services/customFields.service", () => ({ customFieldsService: { getFormDefinitions: vi.fn() } }));

const campuses = [{ id: "campus-1", name: "Main Campus" }];

it("lets a read-only guardian viewer inspect saved custom fields with read permission", async () => {
  vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({ data: { data: [{ id: "field-1", fieldKey: "CF", label: "Custom field", inputType: "TEXTAREA", isRequired: false }] } } as never);
  const user = userEvent.setup();
  render(<MessageProvider><ConfirmProvider><PeopleTab kind="guardians" rows={[{ id: "guardian-1", userId: "user-1", campusId: "campus-1", relation: "FATHER", createdAt: "2026-01-01", customFields: { CF: "Saved note" } }]} loading={false} users={[]} campuses={campuses} classes={[]} sections={[]} students={[]} guardians={[]} onReload={vi.fn()} institutionId="institution-1" canManage={false} /></ConfirmProvider></MessageProvider>);
  await user.click(screen.getByRole("button", { name: /View additional information/ }));
  const input = await screen.findByLabelText("Custom field");
  expect(input).toHaveValue("Saved note");
  expect(input).toBeDisabled();
  expect(screen.queryByRole("button", { name: /Save Changes/i })).not.toBeInTheDocument();
  expect(customFieldsService.getFormDefinitions).toHaveBeenCalledWith({ entityType: "guardian", institutionId: "institution-1", action: "read" });
});

it("loads the guardian textarea, displays its saved value and submits changes", async () => {
  vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({ data: { data: [{ id: "field-1", fieldKey: "CF", label: "Custom field", inputType: "TEXTAREA", isRequired: false }] } } as never);
  vi.mocked(peopleService.updateGuardian).mockResolvedValue({ data: { data: {} } } as never);
  const user = userEvent.setup();
  render(<MessageProvider><ConfirmProvider><PeopleTab kind="guardians" rows={[{ id: "guardian-1", userId: "user-1", campusId: "campus-1", relation: "FATHER", createdAt: "2026-01-01", customFields: { CF: "Existing note" } }]} loading={false} users={[]} campuses={campuses} classes={[]} sections={[]} students={[]} guardians={[]} onReload={vi.fn()} institutionId="institution-1" canManage /></ConfirmProvider></MessageProvider>);
  const edit = screen.getByTestId("EditIcon").closest("button");
  if (!edit) throw new Error("Missing edit button");
  await user.click(edit);
  const input = await screen.findByLabelText("Custom field");
  expect(input).toHaveValue("Existing note");
  await user.clear(input);
  await user.type(input, "Updated note");
  await user.click(screen.getByRole("button", { name: /Save Changes/i }));
  await waitFor(() => expect(peopleService.updateGuardian).toHaveBeenCalledWith("guardian-1", expect.objectContaining({ customFields: { CF: "Updated note" } })));
  expect(customFieldsService.getFormDefinitions).toHaveBeenCalledWith({ entityType: "guardian", institutionId: "institution-1", action: "update" });
});

it("adds a contact for a student with its required additional fields", async () => {
  vi.mocked(customFieldsService.getFormDefinitions).mockImplementation(({ entityType }) => {
    const definitions =
      entityType === "contact"
        ? [{ id: "contact-cf", fieldKey: "NOTE", label: "Contact note", inputType: "TEXT", isRequired: true }]
        : [];
    return Promise.resolve({ data: { data: definitions } }) as never;
  });
  vi.mocked(peopleService.createContact).mockResolvedValue({ data: { message: "Contact added.", data: { id: "contact-1" } } } as never);
  const user = userEvent.setup();
  render(
    <MessageProvider>
      <ConfirmProvider>
        <PeopleTab
          kind="students"
          rows={[{ id: "student-1", userId: "user-1", campusId: "campus-1", createdAt: "2026-01-01" }]}
          loading={false}
          users={studentUsers}
          campuses={studentCampuses}
          classes={[]}
          sections={[]}
          students={[]}
          guardians={[]}
          onReload={vi.fn()}
          canManage
        />
      </ConfirmProvider>
    </MessageProvider>
  );

  await user.click(screen.getByRole("button", { name: "Add Contact" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText(/^Phone/), "0300-1234567");
  await user.type(await within(dialog).findByLabelText(/^Contact note/), "Emergency contact");
  await user.click(within(dialog).getByRole("button", { name: "Add Contact" }));

  await waitFor(() =>
    expect(peopleService.createContact).toHaveBeenCalledWith({
      personId: "student-1",
      personType: "STUDENT",
      phone1: "0300-1234567",
      customFields: { NOTE: "Emergency contact" },
    })
  );
  expect(customFieldsService.getFormDefinitions).toHaveBeenCalledWith(
    expect.objectContaining({ entityType: "contact", action: "create" })
  );
});

it("blocks and then records a manual class/section change with its required history fields", async () => {
  vi.mocked(customFieldsService.getFormDefinitions).mockImplementation(({ entityType }) => {
    const definitions =
      entityType === "student_history"
        ? [{ id: "history-cf", fieldKey: "REASON_CODE", label: "Reason code", inputType: "TEXT", isRequired: true }]
        : [];
    return Promise.resolve({ data: { data: definitions } }) as never;
  });
  vi.mocked(peopleService.recordStudentPromotion).mockResolvedValue({ data: { message: "Class/section change recorded.", data: { id: "history-1" } } } as never);
  const onReload = vi.fn();
  const user = userEvent.setup();
  const row: PersonRecord = {
    id: "student-1",
    userId: "user-1",
    campusId: "campus-1",
    regNo: "STD-0001",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  render(
    <MessageProvider>
      <ConfirmProvider>
        <PeopleTab
          kind="students"
          rows={[row]}
          loading={false}
          users={studentUsers}
          campuses={studentCampuses}
          classes={[]}
          sections={[]}
          students={[row]}
          guardians={[]}
          onReload={onReload}
          canManage
        />
      </ConfirmProvider>
    </MessageProvider>
  );

  await user.click(screen.getByRole("button", { name: "Change Class/Section" }));
  const dialog = await screen.findByRole("dialog");

  // Missing the required history custom field blocks the save (the button
  // is disabled rather than clicked, since MUI sets pointer-events: none).
  await within(dialog).findByLabelText(/^Reason code/);
  expect(within(dialog).getByRole("button", { name: "Save Change" })).toBeDisabled();
  expect(peopleService.recordStudentPromotion).not.toHaveBeenCalled();

  await user.type(within(dialog).getByLabelText(/^Reason code/), "TRANSFER");
  await user.click(within(dialog).getByRole("button", { name: "Save Change" }));

  await waitFor(() =>
    expect(peopleService.recordStudentPromotion).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: "student-1", customFields: { REASON_CODE: "TRANSFER" } })
    )
  );
  expect(onReload).toHaveBeenCalled();
});

it("corrects an existing student-guardian link's additional fields from Manage Students", async () => {
  vi.mocked(customFieldsService.getFormDefinitions).mockImplementation(({ entityType }) => {
    const definitions =
      entityType === "student_guardian"
        ? [{ id: "link-cf", fieldKey: "REL_NOTE", label: "Relationship note", inputType: "TEXT", isRequired: true }]
        : [];
    return Promise.resolve({ data: { data: definitions } }) as never;
  });
  vi.mocked(peopleService.linkGuardianToStudent).mockResolvedValue({ data: { message: "Guardian linked successfully", data: { id: "student-1:guardian-1" } } } as never);
  const onReload = vi.fn();
  const user = userEvent.setup();
  const guardianRow: PersonRecord = {
    id: "guardian-1",
    userId: "user-2",
    campusId: "campus-1",
    relation: "FATHER",
    createdAt: "2026-01-01",
    students: [{ id: "link-1", studentId: "student-1" }],
  };
  const studentRow: PersonRecord = {
    id: "student-1",
    userId: "user-1",
    campusId: "campus-1",
    regNo: "STD-0001",
    createdAt: "2026-01-01",
  };
  render(
    <MessageProvider>
      <ConfirmProvider>
        <PeopleTab
          kind="guardians"
          rows={[guardianRow]}
          loading={false}
          users={[...studentUsers, { id: "user-2", name: "Guardian Khan", email: "g@school.edu", role: "GUARDIAN", status: "ACTIVE", institutionId: null, createdAt: "2026-01-01T00:00:00.000Z" }]}
          campuses={studentCampuses}
          classes={[]}
          sections={[]}
          students={[studentRow]}
          guardians={[guardianRow]}
          onReload={onReload}
          canManage
        />
      </ConfirmProvider>
    </MessageProvider>
  );

  await user.click(screen.getByRole("button", { name: "Manage Students" }));
  const manageDialog = await screen.findByRole("dialog");
  await user.click(within(manageDialog).getByRole("button", { name: "Edit relationship additional fields" }));

  // A second (stacked) dialog now opens on top of Manage Students — MUI's
  // modal manager marks the one behind it aria-hidden, so the accessible
  // "dialog" role query resolves uniquely to the new top dialog.
  const editDialog = await screen.findByRole("dialog");
  expect(within(editDialog).getByText("Edit Relationship")).toBeInTheDocument();
  await user.type(await within(editDialog).findByLabelText(/^Relationship note/), "Pickup allowed");
  await user.click(within(editDialog).getByRole("button", { name: "Save Changes" }));

  await waitFor(() =>
    expect(peopleService.linkGuardianToStudent).toHaveBeenCalledWith({
      studentId: "student-1",
      guardianId: "guardian-1",
      customFields: { REL_NOTE: "Pickup allowed" },
    })
  );
  expect(onReload).toHaveBeenCalled();
});

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
    vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({ data: { data: [] } } as never);
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
      customFields: {},
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

/** Fills required student profile fields and advances to guardian linking. */
async function fillStudentProfileStepAndContinue(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
  await user.click(within(dialog).getByLabelText(/Campus/));
  await user.click(await screen.findByRole("option", { name: "Main Campus" }));
  await user.type(within(dialog).getByLabelText(/Registration No/), "STD-1001");
  await user.type(within(dialog).getByLabelText(/Date of Birth/), "2015-01-10");
  await user.click(within(dialog).getByLabelText(/Gender/));
  await user.click(await screen.findByRole("option", { name: "MALE" }));
  await user.click(within(dialog).getByRole("button", { name: "Continue" }));
}

describe("PeopleTab (students)", () => {
  beforeEach(() => {
    vi.mocked(customFieldsService.getFormDefinitions).mockResolvedValue({ data: { data: [] } } as never);
    vi.mocked(peopleService.getNextRegNo).mockReset();
    vi.mocked(peopleService.createStudent).mockReset();
    vi.mocked(peopleService.createGuardian).mockReset();
    vi.mocked(peopleService.linkGuardianToStudent).mockReset();
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

  it("sends custom fields when creating an inline guardian during student admission", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(customFieldsService.getFormDefinitions).mockImplementation(({ entityType }) => {
      const definitions =
        entityType === "guardian"
          ? [{ id: "guardian-cf", fieldKey: "CF", label: "Custom field", inputType: "TEXTAREA", isRequired: true }]
          : entityType === "student_guardian"
            ? [{ id: "link-cf", fieldKey: "REL_NOTE", label: "Relationship note", inputType: "TEXT", isRequired: true }]
            : [];
      return Promise.resolve({ data: { data: definitions } }) as never;
    });
    vi.mocked(authService.register)
      .mockResolvedValueOnce({ data: { data: { id: "student-user-1" } } } as never)
      .mockResolvedValueOnce({ data: { data: { id: "guardian-user-1" } } } as never);
    vi.mocked(peopleService.createStudent).mockResolvedValue({ data: { data: { id: "student-1" } } } as never);
    vi.mocked(peopleService.createGuardian).mockResolvedValue({ data: { data: { id: "guardian-1" } } } as never);
    vi.mocked(peopleService.linkGuardianToStudent).mockResolvedValue({ data: { data: { id: "link-1" } } } as never);

    renderStudentsTab();
    const dialog = await fillStudentAccountStepAndContinue(user);
    await fillStudentProfileStepAndContinue(user, dialog);

    await waitFor(() => expect(customFieldsService.getFormDefinitions).toHaveBeenCalledWith(expect.objectContaining({ entityType: "guardian" })));
    await waitFor(() => expect(customFieldsService.getFormDefinitions).toHaveBeenCalledWith(expect.objectContaining({ entityType: "student_guardian" })));
    await user.type(await within(dialog).findByLabelText(/Custom field/), "Guardian note");
    await user.type(await within(dialog).findByLabelText(/Relationship note/), "Pickup allowed");
    await user.type(within(dialog).getByLabelText("Name"), "Guardian Khan");
    await user.type(within(dialog).getByLabelText("Email"), "guardian@school.edu");
    await user.click(within(dialog).getByRole("button", { name: "Add" }));
    await user.click(within(dialog).getByRole("button", { name: /Create Student \+ 1 Guardian Link/ }));

    await waitFor(() => expect(peopleService.createGuardian).toHaveBeenCalled(), { timeout: 5000 });
    expect(peopleService.createGuardian).toHaveBeenCalledWith(expect.objectContaining({
      userId: "guardian-user-1",
      campusId: "campus-1",
      relation: "FATHER",
      customFields: { CF: "Guardian note" },
    }));
    expect(peopleService.linkGuardianToStudent).toHaveBeenCalledWith({
      studentId: "student-1",
      guardianId: "guardian-1",
      customFields: { REL_NOTE: "Pickup allowed" },
    });
  }, 30000);

  it("keeps student admission open when inline guardian linking fails after the student is created", async () => {
    const user = userEvent.setup({ delay: null });
    const onReload = vi.fn();
    vi.mocked(authService.register)
      .mockResolvedValueOnce({ data: { data: { id: "student-user-1" } } } as never)
      .mockResolvedValueOnce({ data: { data: { id: "guardian-user-1" } } } as never);
    vi.mocked(peopleService.createStudent).mockResolvedValue({ data: { data: { id: "student-1" } } } as never);
    vi.mocked(peopleService.createGuardian).mockResolvedValue({ data: { data: { id: "guardian-1" } } } as never);
    vi.mocked(peopleService.linkGuardianToStudent).mockRejectedValueOnce(new Error("Link failed"));

    renderStudentsTab({ onReload });
    const dialog = await fillStudentAccountStepAndContinue(user);
    await fillStudentProfileStepAndContinue(user, dialog);

    await user.type(within(dialog).getByLabelText("Name"), "Guardian Khan");
    await user.type(within(dialog).getByLabelText("Email"), "guardian@school.edu");
    await user.click(within(dialog).getByRole("button", { name: "Add" }));
    await user.click(within(dialog).getByRole("button", { name: /Create Student \+ 1 Guardian Link/ }));

    expect(await screen.findByText(/still need attention/, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(peopleService.createStudent).toHaveBeenCalledTimes(1);
    expect(onReload).toHaveBeenCalled();
  }, 30000);
});
