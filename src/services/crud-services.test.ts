import { beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/lib/axios", () => ({ default: http }));

import { academicsService } from "./academics.service";
import { attendanceService } from "./attendance.service";
import { attendanceCalendarService } from "./attendanceCalendar.service";
import { auditLogsService } from "./auditLogs.service";
import { authService } from "./auth.service";
import { campusesService } from "./campuses.service";
import { customFieldsService } from "./customFields.service";
import { financeService } from "./finance.service";
import { noticesService } from "./notices.service";
import { peopleService } from "./people.service";
import { platformService } from "./platform.service";
import { recycleBinService } from "./recycleBin.service";
import { rolesService } from "./roles.service";
import { timetableService } from "./timetable.service";
import { usersService } from "./users.service";

type Method = "get" | "post" | "put" | "patch" | "delete";
const METHODS: Method[] = ["get", "post", "put", "patch", "delete"];
/** [label, invoke, method, url, extra args the http client must receive after the url] */
type Row = [string, () => unknown, Method, string, unknown[]];

const body = { a: 1 };
const params = { page: 2 };

/**
 * Runs each row: the service must use exactly one HTTP verb, on the exact URL,
 * with the exact payload/config.
 * @param rows - Table of expectations.
 */
function runTable(rows: Row[]): void {
  it.each(rows)("%s", (_label, invoke, method, url, rest) => {
    invoke();
    expect(http[method]).toHaveBeenCalledTimes(1);
    expect(http[method]).toHaveBeenCalledWith(url, ...rest);
    METHODS.filter((m) => m !== method).forEach((m) => expect(http[m]).not.toHaveBeenCalled());
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("academicsService", () => {
  const s = academicsService;
  runTable([
    ["createLevel", () => s.createLevel(body), "post", "/academics/levels", [body]],
    ["getLevels", () => s.getLevels(params), "get", "/academics/levels", [{ params }]],
    ["getLevel", () => s.getLevel("l1"), "get", "/academics/levels/l1", []],
    ["updateLevel", () => s.updateLevel("l1", body), "patch", "/academics/levels/l1", [body]],
    ["deleteLevel", () => s.deleteLevel("l1"), "delete", "/academics/levels/l1", []],
    ["createClass", () => s.createClass(body), "post", "/academics/classes", [body]],
    ["getClasses", () => s.getClasses(params), "get", "/academics/classes", [{ params }]],
    ["getClass", () => s.getClass("c1"), "get", "/academics/classes/c1", []],
    ["updateClass", () => s.updateClass("c1", body), "patch", "/academics/classes/c1", [body]],
    ["deleteClass", () => s.deleteClass("c1"), "delete", "/academics/classes/c1", []],
    ["createSection", () => s.createSection(body), "post", "/academics/sections", [body]],
    ["getSections", () => s.getSections(params), "get", "/academics/sections", [{ params }]],
    ["getSection", () => s.getSection("s1"), "get", "/academics/sections/s1", []],
    ["updateSection", () => s.updateSection("s1", body), "patch", "/academics/sections/s1", [body]],
    ["deleteSection", () => s.deleteSection("s1"), "delete", "/academics/sections/s1", []],
    ["createSubject", () => s.createSubject(body), "post", "/academics/subjects", [body]],
    ["getSubjects", () => s.getSubjects(params), "get", "/academics/subjects", [{ params }]],
    ["getSubject", () => s.getSubject("u1"), "get", "/academics/subjects/u1", []],
    ["updateSubject", () => s.updateSubject("u1", body), "patch", "/academics/subjects/u1", [body]],
    ["deleteSubject", () => s.deleteSubject("u1"), "delete", "/academics/subjects/u1", []],
    ["createAcademicYear own", () => s.createAcademicYear(body), "post", "/academics/academic-years", [body]],
    ["createAcademicYear platform", () => s.createAcademicYear(body, "i1"), "post", "/platform/institutions/i1/academic-years", [body]],
    ["getAcademicYears own", () => s.getAcademicYears(), "get", "/academics/academic-years", []],
    ["getAcademicYears platform", () => s.getAcademicYears("i1"), "get", "/platform/institutions/i1/academic-years", []],
    ["getAcademicYear own", () => s.getAcademicYear("y1"), "get", "/academics/academic-years/y1", []],
    ["getAcademicYear platform", () => s.getAcademicYear("y1", "i1"), "get", "/platform/institutions/i1/academic-years/y1", []],
    ["updateAcademicYear own", () => s.updateAcademicYear("y1", body), "patch", "/academics/academic-years/y1", [body]],
    ["updateAcademicYear platform", () => s.updateAcademicYear("y1", body, "i1"), "patch", "/platform/institutions/i1/academic-years/y1", [body]],
    ["setCurrentAcademicYear own", () => s.setCurrentAcademicYear("y1"), "patch", "/academics/academic-years/y1/set-current", []],
    ["setCurrentAcademicYear platform", () => s.setCurrentAcademicYear("y1", "i1"), "patch", "/platform/institutions/i1/academic-years/y1/set-current", []],
    ["deleteAcademicYear own", () => s.deleteAcademicYear("y1"), "delete", "/academics/academic-years/y1", []],
    ["deleteAcademicYear platform", () => s.deleteAcademicYear("y1", "i1"), "delete", "/platform/institutions/i1/academic-years/y1", []],
    ["getCurrentAcademicYear own", () => s.getCurrentAcademicYear({ campusId: "c" }), "get", "/academics/academic-years/current", [{ params: { campusId: "c" } }]],
    ["getCurrentAcademicYear platform", () => s.getCurrentAcademicYear({ campusId: "c" }, "i1"), "get", "/platform/institutions/i1/academic-years/current", [{ params: { campusId: "c" } }]],
  ]);
});

describe("attendanceService", () => {
  const s = attendanceService;
  const bulk = { campusId: "c", date: "2026-01-01", periodId: "p", entries: [{ userId: "u", status: "PRESENT" }] };
  runTable([
    ["getContext", () => s.getContext("u1"), "get", "/attendance/context", [{ params: { userId: "u1" } }]],
    ["checkIn", () => s.checkIn(body), "post", "/attendance/check-in", [body]],
    ["checkOut", () => s.checkOut(body), "post", "/attendance/check-out", [body]],
    ["markLeave", () => s.markLeave(body), "post", "/attendance/leave", [body]],
    ["autoAbsent", () => s.autoAbsent(body), "post", "/attendance/auto-absent", [body]],
    ["bulkMark", () => s.bulkMark(bulk), "post", "/attendance/bulk-mark", [bulk]],
    ["getAll", () => s.getAll(params), "get", "/attendance", [{ params }]],
    ["getPeriodRoster", () => s.getPeriodRoster("p1", "2026-01-02"), "get", "/attendance/period-roster", [{ params: { periodId: "p1", date: "2026-01-02" } }]],
    ["getSummary", () => s.getSummary(params), "get", "/attendance/summary", [{ params }]],
    ["getById", () => s.getById("a1"), "get", "/attendance/a1", []],
    ["update", () => s.update("a1", body), "patch", "/attendance/a1", [body]],
  ]);
});

describe("attendanceCalendarService", () => {
  const s = attendanceCalendarService;
  runTable([
    ["getWorkingDays own", () => s.getWorkingDays(), "get", "/attendance-calendar/working-days", []],
    ["getWorkingDays platform", () => s.getWorkingDays("i1"), "get", "/platform/institutions/i1/attendance-calendar/working-days", []],
    ["saveWorkingDays", () => s.saveWorkingDays(["MONDAY"], "i1"), "put", "/platform/institutions/i1/attendance-calendar/working-days", [{ workingDays: ["MONDAY"] }]],
    ["getClosures", () => s.getClosures(), "get", "/attendance-calendar/closures", []],
    ["createClosure", () => s.createClosure(body), "post", "/attendance-calendar/closures", [body]],
    ["updateClosure", () => s.updateClosure("x", body, "i1"), "patch", "/platform/institutions/i1/attendance-calendar/closures/x", [body]],
    ["deleteClosure sends a removal reason", () => s.deleteClosure("x"), "delete", "/attendance-calendar/closures/x", [{ data: { reason: "Removed from attendance calendar" } }]],
  ]);
});

describe("auditLogs / auth / campuses / customFields / recycleBin / users", () => {
  runTable([
    ["auditLogs.getAll", () => auditLogsService.getAll(params), "get", "/audit-logs", [{ params }]],
    ["auth.login", () => authService.login({ identifier: "a", password: "b" }), "post", "/auth/login", [{ identifier: "a", password: "b" }]],
    ["auth.register", () => authService.register({ name: "n", email: "e", password: "p", role: "ADMIN" }), "post", "/auth/register", [{ name: "n", email: "e", password: "p", role: "ADMIN" }]],
    ["auth.signupTrial", () => authService.signupTrial({ institutionName: "i", name: "n", email: "e", password: "p" }), "post", "/platform/signup", [{ institutionName: "i", name: "n", email: "e", password: "p" }]],
    ["auth.logout", () => authService.logout(), "post", "/auth/logout", []],
    ["auth.refresh", () => authService.refresh(), "post", "/auth/refresh", []],
    ["auth.getSessions", () => authService.getSessions(), "get", "/auth/sessions", []],
    ["auth.revokeSession", () => authService.revokeSession("s1"), "post", "/auth/sessions/revoke", [{ sessionId: "s1" }]],
    ["campuses.create", () => campusesService.create(body), "post", "/campuses", [body]],
    ["campuses.getAll", () => campusesService.getAll(params), "get", "/campuses", [{ params }]],
    ["campuses.update", () => campusesService.update("c1", body), "put", "/campuses/c1", [body]],
    ["campuses.delete with reason", () => campusesService.delete("c1", "closed"), "post", "/campuses/c1/delete", [{ reason: "closed" }]],
    ["campuses.delete defaults reason to null", () => campusesService.delete("c1"), "post", "/campuses/c1/delete", [{ reason: null }]],
    ["campuses.assignUser", () => campusesService.assignUser(body), "post", "/campuses/assign-user", [body]],
    ["campuses.getCampusUsers", () => campusesService.getCampusUsers("c1"), "get", "/campuses/c1/users", []],
    ["campuses.removeUser", () => campusesService.removeUser(body), "post", "/campuses/remove-user", [body]],
    ["customFields.getEntities", () => customFieldsService.getEntities(), "get", "/custom-fields/entities", []],
    ["customFields.getFormDefinitions", () => customFieldsService.getFormDefinitions({ entityType: "STUDENT", action: "create" }), "get", "/custom-fields/form-definitions", [{ params: { entityType: "STUDENT", action: "create" } }]],
    ["customFields.createDefinition", () => customFieldsService.createDefinition(body), "post", "/custom-fields/definitions", [body]],
    ["customFields.getDefinitions", () => customFieldsService.getDefinitions(params), "get", "/custom-fields/definitions", [{ params }]],
    ["customFields.updateDefinition", () => customFieldsService.updateDefinition("d1", body), "patch", "/custom-fields/definitions/d1", [body]],
    ["customFields.upsertValue", () => customFieldsService.upsertValue(body), "post", "/custom-fields/values", [body]],
    ["customFields.getValues", () => customFieldsService.getValues(params), "get", "/custom-fields/values", [{ params }]],
    ["recycleBin.getAll", () => recycleBinService.getAll(params), "get", "/recycle-bin", [{ params }]],
    ["recycleBin.restore", () => recycleBinService.restore("students", "r1"), "post", "/recycle-bin/students/r1/restore", []],
    ["recycleBin.permanentDelete", () => recycleBinService.permanentDelete("students", "r1"), "delete", "/recycle-bin/students/r1/permanent", []],
    ["users.getMe", () => usersService.getMe(), "get", "/users/me", []],
    ["users.updateMe", () => usersService.updateMe(body), "put", "/users/me", [body]],
    ["users.getAll", () => usersService.getAll(params), "get", "/users", [{ params }]],
    ["users.resolve joins ids", () => usersService.resolve(["a", "b"]), "get", "/users/resolve", [{ params: { ids: "a,b" } }]],
    ["users.updateUser", () => usersService.updateUser("u1", body), "put", "/users/u1", [body]],
    ["users.deleteUser", () => usersService.deleteUser("u1"), "delete", "/users/u1", []],
  ]);
});

describe("financeService", () => {
  const s = financeService;
  type Fn = (...args: unknown[]) => unknown;
  const svc = s as unknown as Record<string, Fn>;
  /** [label, base path, create, list, get, update (optional), delete] */
  const groups: Array<[string, string, string, string, string, string | undefined, string]> = [
    ["Salary", "/finance/salaries", "createSalary", "getSalaries", "getSalary", "updateSalary", "deleteSalary"],
    ["BankAccount", "/finance/bank-accounts", "createBankAccount", "getBankAccounts", "getBankAccount", "updateBankAccount", "deleteBankAccount"],
    ["FeeStructure", "/finance/fee-structures", "createFeeStructure", "getFeeStructures", "getFeeStructure", "updateFeeStructure", "deleteFeeStructure"],
    ["Voucher", "/finance/fee-vouchers", "createVoucher", "getVouchers", "getVoucher", "updateVoucher", "deleteVoucher"],
    ["DeductionRule", "/finance/salary-deduction-rules", "createDeductionRule", "getDeductionRules", "getDeductionRule", undefined, "deleteDeductionRule"],
    ["Adjustment", "/finance/salary-adjustments", "createAdjustment", "getAdjustments", "getAdjustment", undefined, "deleteAdjustment"],
    ["SalaryPayment", "/finance/salary-payments", "createSalaryPayment", "getSalaryPayments", "getSalaryPayment", undefined, "deleteSalaryPayment"],
    ["Discount", "/finance/student-discounts", "createDiscount", "getDiscounts", "getDiscount", undefined, "deleteDiscount"],
    ["FineRule", "/finance/student-fine-rules", "createFineRule", "getFineRules", "getFineRule", undefined, "deleteFineRule"],
    ["Fine", "/finance/student-fines", "createFine", "getFines", "getFine", undefined, "deleteFine"],
    ["FeePayment", "/finance/fee-payments", "createFeePayment", "getFeePayments", "getFeePayment", undefined, "deleteFeePayment"],
  ];
  const rows: Row[] = groups.flatMap(([label, base, create, list, one, update, del]) => {
    const r: Row[] = [
      [`${label} create`, () => svc[create](body), "post", base, [body]],
      [`${label} list`, () => svc[list](params), "get", base, [{ params }]],
      [`${label} get`, () => svc[one]("x1"), "get", `${base}/x1`, []],
      [`${label} delete`, () => svc[del]("x1"), "delete", `${base}/x1`, []],
    ];
    if (update) r.push([`${label} update`, () => svc[update]("x1", body), "patch", `${base}/x1`, [body]]);
    return r;
  });
  runTable([
    ...rows,
    ["previewSalaryPayment", () => s.previewSalaryPayment({ staffProfileId: "s", month: 1, year: 2026 } as never), "get", "/finance/salary-payments/preview", [{ params: { staffProfileId: "s", month: 1, year: 2026 } }]],
  ]);
});

describe("noticesService", () => {
  const s = noticesService;
  runTable([
    ["create own", () => s.createNotice(body), "post", "/notices", [body]],
    ["create platform", () => s.createNotice(body, "i1"), "post", "/platform/institutions/i1/notices", [body]],
    ["list own", () => s.getNotices(params), "get", "/notices", [{ params }]],
    ["list platform", () => s.getNotices(params, "i1"), "get", "/platform/institutions/i1/notices", [{ params }]],
    ["get own", () => s.getNotice("n1"), "get", "/notices/n1", []],
    ["get platform", () => s.getNotice("n1", "i1"), "get", "/platform/institutions/i1/notices/n1", []],
    ["update own", () => s.updateNotice("n1", body), "patch", "/notices/n1", [body]],
    ["update platform", () => s.updateNotice("n1", body, "i1"), "patch", "/platform/institutions/i1/notices/n1", [body]],
    ["delete own", () => s.deleteNotice("n1"), "delete", "/notices/n1", []],
    ["delete platform", () => s.deleteNotice("n1", "i1"), "delete", "/platform/institutions/i1/notices/n1", []],
    ["for-me", () => s.getNoticesForMe(params), "get", "/notices/for-me", [{ params }]],
  ]);
});

describe("peopleService", () => {
  const s = peopleService;
  runTable([
    ["createStudent", () => s.createStudent(body), "post", "/people/students", [body]],
    ["getStudents", () => s.getStudents(params), "get", "/people/students", [{ params }]],
    ["getStudent", () => s.getStudent("s1"), "get", "/people/students/s1", []],
    ["updateStudent", () => s.updateStudent("s1", body), "patch", "/people/students/s1", [body]],
    ["deleteStudent", () => s.deleteStudent("s1"), "delete", "/people/students/s1", []],
    ["getNextRegNo", () => s.getNextRegNo("c1"), "get", "/people/students/next-reg-no", [{ params: { campusId: "c1" } }]],
    ["createStudentEnrollment", () => s.createStudentEnrollment(body), "post", "/people/student-enrollments", [body]],
    ["getStudentEnrollments", () => s.getStudentEnrollments(params), "get", "/people/student-enrollments", [{ params }]],
    ["getStudentEnrollment", () => s.getStudentEnrollment("e1"), "get", "/people/student-enrollments/e1", []],
    ["updateStudentEnrollment", () => s.updateStudentEnrollment("e1", body), "patch", "/people/student-enrollments/e1", [body]],
    ["deleteStudentEnrollment", () => s.deleteStudentEnrollment("e1"), "delete", "/people/student-enrollments/e1", []],
    ["withdrawStudentEnrollment", () => s.withdrawStudentEnrollment("e1", body), "post", "/people/student-enrollments/e1/withdraw", [body]],
    ["previewPromotion", () => s.previewPromotion(body), "post", "/people/promotions/preview", [body]],
    ["commitPromotion", () => s.commitPromotion(body), "post", "/people/promotions/commit", [body]],
    ["createGuardian", () => s.createGuardian(body), "post", "/people/guardians", [body]],
    ["getGuardians", () => s.getGuardians(params), "get", "/people/guardians", [{ params }]],
    ["getGuardian", () => s.getGuardian("g1"), "get", "/people/guardians/g1", []],
    ["updateGuardian", () => s.updateGuardian("g1", body), "patch", "/people/guardians/g1", [body]],
    ["deleteGuardian", () => s.deleteGuardian("g1"), "delete", "/people/guardians/g1", []],
    ["createStaffProfile", () => s.createStaffProfile(body), "post", "/people/staff-profiles", [body]],
    ["getStaffProfiles", () => s.getStaffProfiles(params), "get", "/people/staff-profiles", [{ params }]],
    ["getStaffProfile", () => s.getStaffProfile("p1"), "get", "/people/staff-profiles/p1", []],
    ["updateStaffProfile", () => s.updateStaffProfile("p1", body), "patch", "/people/staff-profiles/p1", [body]],
    ["deleteStaffProfile", () => s.deleteStaffProfile("p1"), "delete", "/people/staff-profiles/p1", []],
    ["linkGuardianToStudent", () => s.linkGuardianToStudent(body), "post", "/people/student-guardians", [body]],
    ["unlinkGuardian", () => s.unlinkGuardian("l1"), "delete", "/people/student-guardians/l1", []],
    ["recordStudentPromotion", () => s.recordStudentPromotion(body), "post", "/people/student-history", [body]],
    ["assignTeacherToSubject", () => s.assignTeacherToSubject(body), "post", "/people/teacher-subjects", [body]],
    ["getTeacherSubjects", () => s.getTeacherSubjects(params), "get", "/people/teacher-subjects", [{ params }]],
    ["removeTeacherSubject", () => s.removeTeacherSubject("t1"), "delete", "/people/teacher-subjects/t1", []],
    ["createContact", () => s.createContact(body), "post", "/people/contacts", [body]],
  ]);
});

describe("platformService", () => {
  const s = platformService;
  runTable([
    ["getMyRuntimeConfig", () => s.getMyRuntimeConfig(), "get", "/platform/me/runtime-config", []],
    ["getPlans", () => s.getPlans(), "get", "/platform/plans", []],
    ["createPlan", () => s.createPlan(body), "post", "/platform/plans", [body]],
    ["updatePlan", () => s.updatePlan("p1", body), "patch", "/platform/plans/p1", [body]],
    ["createInstitution", () => s.createInstitution(body), "post", "/platform/institutions", [body]],
    ["getInstitutions", () => s.getInstitutions(params), "get", "/platform/institutions", [{ params }]],
    ["getInstitution", () => s.getInstitution("i1"), "get", "/platform/institutions/i1", []],
    ["getRuntimeConfig", () => s.getRuntimeConfig("i1"), "get", "/platform/institutions/i1/runtime-config", []],
    ["updateInstitution", () => s.updateInstitution("i1", body), "patch", "/platform/institutions/i1", [body]],
    ["updateBranding", () => s.updateBranding("i1", body), "put", "/platform/institutions/i1/branding", [body]],
    ["updateSettings", () => s.updateSettings("i1", body), "put", "/platform/institutions/i1/settings", [body]],
    ["updateEntitlements", () => s.updateEntitlements("i1", body), "put", "/platform/institutions/i1/entitlements", [body]],
    ["updateSubscription", () => s.updateSubscription("i1", body), "put", "/platform/institutions/i1/subscription", [body]],
  ]);
});

describe("rolesService", () => {
  const s = rolesService;
  const role = { name: "R", permissions: {} };
  runTable([
    ["catalog", () => s.getCatalog(), "get", "/roles/catalog", []],
    ["module catalog", () => s.getModuleCatalog(), "get", "/roles/module-catalog", []],
    ["list own", () => s.list(), "get", "/roles", []],
    ["list platform", () => s.list("i1"), "get", "/platform/institutions/i1/roles", []],
    ["get own", () => s.get("r1"), "get", "/roles/r1", []],
    ["get platform", () => s.get("r1", "i1"), "get", "/platform/institutions/i1/roles/r1", []],
    ["create own", () => s.create(role), "post", "/roles", [role]],
    ["create platform", () => s.create(role, "i1"), "post", "/platform/institutions/i1/roles", [role]],
    ["update own", () => s.update("r1", { name: "X" }), "patch", "/roles/r1", [{ name: "X" }]],
    ["update platform", () => s.update("r1", { name: "X" }, "i1"), "patch", "/platform/institutions/i1/roles/r1", [{ name: "X" }]],
    ["remove own", () => s.remove("r1"), "delete", "/roles/r1", []],
    ["remove platform", () => s.remove("r1", "i1"), "delete", "/platform/institutions/i1/roles/r1", []],
  ]);
});

describe("timetableService", () => {
  const s = timetableService;
  runTable([
    ["create", () => s.createPeriodSlot(body), "post", "/timetable/period-slots", [body]],
    ["list", () => s.getPeriodSlots(params), "get", "/timetable/period-slots", [{ params }]],
    ["get", () => s.getPeriodSlot("p1"), "get", "/timetable/period-slots/p1", []],
    ["update", () => s.updatePeriodSlot("p1", body), "patch", "/timetable/period-slots/p1", [body]],
    ["delete", () => s.deletePeriodSlot("p1"), "delete", "/timetable/period-slots/p1", []],
    ["section week", () => s.getSectionWeek("s1"), "get", "/timetable/period-slots/section/s1/week", []],
  ]);
});
