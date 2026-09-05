import apiClient from "@/lib/axios";

export const academicsService = {
  // Levels
  createLevel: (payload: Record<string, unknown>) =>
    apiClient.post("/academics/levels", payload),
  getLevels: (params?: Record<string, unknown>) =>
    apiClient.get("/academics/levels", { params }),
  getLevel: (levelId: string) => apiClient.get(`/academics/levels/${levelId}`),
  updateLevel: (levelId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/academics/levels/${levelId}`, payload),
  deleteLevel: (levelId: string) => apiClient.delete(`/academics/levels/${levelId}`),

  // Classes
  createClass: (payload: Record<string, unknown>) =>
    apiClient.post("/academics/classes", payload),
  getClasses: (params?: Record<string, unknown>) =>
    apiClient.get("/academics/classes", { params }),
  getClass: (classId: string) => apiClient.get(`/academics/classes/${classId}`),
  updateClass: (classId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/academics/classes/${classId}`, payload),
  deleteClass: (classId: string) => apiClient.delete(`/academics/classes/${classId}`),

  // Sections
  createSection: (payload: Record<string, unknown>) =>
    apiClient.post("/academics/sections", payload),
  getSections: (params?: Record<string, unknown>) =>
    apiClient.get("/academics/sections", { params }),
  getSection: (sectionId: string) => apiClient.get(`/academics/sections/${sectionId}`),
  updateSection: (sectionId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/academics/sections/${sectionId}`, payload),
  deleteSection: (sectionId: string) =>
    apiClient.delete(`/academics/sections/${sectionId}`),

  // Subjects
  createSubject: (payload: Record<string, unknown>) =>
    apiClient.post("/academics/subjects", payload),
  getSubjects: (params?: Record<string, unknown>) =>
    apiClient.get("/academics/subjects", { params }),
  getSubject: (subjectId: string) => apiClient.get(`/academics/subjects/${subjectId}`),
  updateSubject: (subjectId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/academics/subjects/${subjectId}`, payload),
  deleteSubject: (subjectId: string) =>
    apiClient.delete(`/academics/subjects/${subjectId}`),

  // Academic Years — `institutionId` is optional and only passed by the
  // platform console (superadmin managing another institution's academic
  // years); when present, routes go through the `/platform/institutions/:id`
  // mirror instead, exactly like rolesService's institution-scoped/platform
  // branching.
  createAcademicYear: (payload: Record<string, unknown>, institutionId?: string) =>
    institutionId
      ? apiClient.post(`/platform/institutions/${institutionId}/academic-years`, payload)
      : apiClient.post("/academics/academic-years", payload),
  getAcademicYears: (institutionId?: string) =>
    institutionId
      ? apiClient.get(`/platform/institutions/${institutionId}/academic-years`)
      : apiClient.get("/academics/academic-years"),
  getAcademicYear: (academicYearId: string, institutionId?: string) =>
    institutionId
      ? apiClient.get(`/platform/institutions/${institutionId}/academic-years/${academicYearId}`)
      : apiClient.get(`/academics/academic-years/${academicYearId}`),
  updateAcademicYear: (academicYearId: string, payload: Record<string, unknown>, institutionId?: string) =>
    institutionId
      ? apiClient.patch(`/platform/institutions/${institutionId}/academic-years/${academicYearId}`, payload)
      : apiClient.patch(`/academics/academic-years/${academicYearId}`, payload),
  setCurrentAcademicYear: (academicYearId: string, institutionId?: string) =>
    institutionId
      ? apiClient.patch(`/platform/institutions/${institutionId}/academic-years/${academicYearId}/set-current`)
      : apiClient.patch(`/academics/academic-years/${academicYearId}/set-current`),
  deleteAcademicYear: (academicYearId: string, institutionId?: string) =>
    institutionId
      ? apiClient.delete(`/platform/institutions/${institutionId}/academic-years/${academicYearId}`)
      : apiClient.delete(`/academics/academic-years/${academicYearId}`),
  getCurrentAcademicYear: (params?: { campusId?: string }, institutionId?: string) =>
    institutionId
      ? apiClient.get(`/platform/institutions/${institutionId}/academic-years/current`, { params })
      : apiClient.get("/academics/academic-years/current", { params }),
};
