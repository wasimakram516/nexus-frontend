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
