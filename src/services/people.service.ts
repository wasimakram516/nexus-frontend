import apiClient from "@/lib/axios";

export const peopleService = {
  // Students
  createStudent: (payload: Record<string, unknown>) =>
    apiClient.post("/people/students", payload),
  getStudents: (params?: Record<string, unknown>) =>
    apiClient.get("/people/students", { params }),
  getStudent: (studentId: string) => apiClient.get(`/people/students/${studentId}`),
  updateStudent: (studentId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/people/students/${studentId}`, payload),
  deleteStudent: (studentId: string) => apiClient.delete(`/people/students/${studentId}`),
  // Advisory only — still fully validated for uniqueness on actual create.
  getNextRegNo: (campusId?: string) =>
    apiClient.get("/people/students/next-reg-no", { params: { campusId } }),

  // Student Enrollments — StudentEnrollment is the source of truth for a
  // student's class/section per academic year (M2 Phase 3). Class/section
  // changes for an existing student go through these instead of
  // updateStudent, which no longer accepts classId/sectionId.
  createStudentEnrollment: (payload: Record<string, unknown>) =>
    apiClient.post("/people/student-enrollments", payload),
  getStudentEnrollments: (params?: Record<string, unknown>) =>
    apiClient.get("/people/student-enrollments", { params }),
  getStudentEnrollment: (enrollmentId: string) =>
    apiClient.get(`/people/student-enrollments/${enrollmentId}`),
  updateStudentEnrollment: (enrollmentId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/people/student-enrollments/${enrollmentId}`, payload),
  deleteStudentEnrollment: (enrollmentId: string) =>
    apiClient.delete(`/people/student-enrollments/${enrollmentId}`),
  withdrawStudentEnrollment: (enrollmentId: string, payload: Record<string, unknown>) =>
    apiClient.post(`/people/student-enrollments/${enrollmentId}/withdraw`, payload),

  // Bulk Promotions — preview never writes, commit executes; re-running a
  // partially-failed commit is safe (already-processed students are skipped).
  previewPromotion: (payload: Record<string, unknown>) =>
    apiClient.post("/people/promotions/preview", payload),
  commitPromotion: (payload: Record<string, unknown>) =>
    apiClient.post("/people/promotions/commit", payload),

  // Guardians
  createGuardian: (payload: Record<string, unknown>) =>
    apiClient.post("/people/guardians", payload),
  getGuardians: (params?: Record<string, unknown>) =>
    apiClient.get("/people/guardians", { params }),
  getGuardian: (guardianId: string) => apiClient.get(`/people/guardians/${guardianId}`),
  updateGuardian: (guardianId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/people/guardians/${guardianId}`, payload),
  deleteGuardian: (guardianId: string) =>
    apiClient.delete(`/people/guardians/${guardianId}`),

  // Staff Profiles
  createStaffProfile: (payload: Record<string, unknown>) =>
    apiClient.post("/people/staff-profiles", payload),
  getStaffProfiles: (params?: Record<string, unknown>) =>
    apiClient.get("/people/staff-profiles", { params }),
  getStaffProfile: (staffProfileId: string) =>
    apiClient.get(`/people/staff-profiles/${staffProfileId}`),
  updateStaffProfile: (staffProfileId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/people/staff-profiles/${staffProfileId}`, payload),
  deleteStaffProfile: (staffProfileId: string) =>
    apiClient.delete(`/people/staff-profiles/${staffProfileId}`),

  // Relations
  linkGuardianToStudent: (payload: Record<string, unknown>) =>
    apiClient.post("/people/student-guardians", payload),
  unlinkGuardian: (linkId: string) =>
    apiClient.delete(`/people/student-guardians/${linkId}`),
  recordStudentPromotion: (payload: Record<string, unknown>) =>
    apiClient.post("/people/student-history", payload),
  assignTeacherToSubject: (payload: Record<string, unknown>) =>
    apiClient.post("/people/teacher-subjects", payload),
  getTeacherSubjects: (params?: Record<string, unknown>) =>
    apiClient.get("/people/teacher-subjects", { params }),
  removeTeacherSubject: (assignmentId: string) =>
    apiClient.delete(`/people/teacher-subjects/${assignmentId}`),
  createContact: (payload: Record<string, unknown>) =>
    apiClient.post("/people/contacts", payload),
};
