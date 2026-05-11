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
};
