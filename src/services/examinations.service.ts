import apiClient from "@/lib/axios";

/**
 * Examinations API. `institutionId` is only passed by the platform console
 * (a superadmin managing another institution): grading scales and exam terms
 * then go through the `/platform/institutions/:id/...` mirror. Exams carry
 * their own campus through the class, so they use the ordinary routes for
 * both audiences.
 */
export const examinationsService = {
  // Grading scales
  getGradingScales: (institutionId?: string) =>
    institutionId
      ? apiClient.get(`/platform/institutions/${institutionId}/grading-scales`)
      : apiClient.get("/examinations/grading-scales"),
  createGradingScale: (payload: Record<string, unknown>, institutionId?: string) =>
    institutionId
      ? apiClient.post(`/platform/institutions/${institutionId}/grading-scales`, payload)
      : apiClient.post("/examinations/grading-scales", payload),
  updateGradingScale: (id: string, payload: Record<string, unknown>, institutionId?: string) =>
    institutionId
      ? apiClient.patch(`/platform/institutions/${institutionId}/grading-scales/${id}`, payload)
      : apiClient.patch(`/examinations/grading-scales/${id}`, payload),
  setCurrentGradingScale: (id: string, institutionId?: string) =>
    institutionId
      ? apiClient.patch(`/platform/institutions/${institutionId}/grading-scales/${id}/set-current`)
      : apiClient.patch(`/examinations/grading-scales/${id}/set-current`),
  deleteGradingScale: (id: string, institutionId?: string) =>
    institutionId
      ? apiClient.delete(`/platform/institutions/${institutionId}/grading-scales/${id}`)
      : apiClient.delete(`/examinations/grading-scales/${id}`),

  // Exam terms
  getExamTerms: (params?: { academicYearId?: string }, institutionId?: string) =>
    institutionId
      ? apiClient.get(`/platform/institutions/${institutionId}/exam-terms`, { params })
      : apiClient.get("/examinations/exam-terms", { params }),
  createExamTerm: (payload: Record<string, unknown>, institutionId?: string) =>
    institutionId
      ? apiClient.post(`/platform/institutions/${institutionId}/exam-terms`, payload)
      : apiClient.post("/examinations/exam-terms", payload),
  updateExamTerm: (id: string, payload: Record<string, unknown>, institutionId?: string) =>
    institutionId
      ? apiClient.patch(`/platform/institutions/${institutionId}/exam-terms/${id}`, payload)
      : apiClient.patch(`/examinations/exam-terms/${id}`, payload),
  deleteExamTerm: (id: string, institutionId?: string) =>
    institutionId
      ? apiClient.delete(`/platform/institutions/${institutionId}/exam-terms/${id}`)
      : apiClient.delete(`/examinations/exam-terms/${id}`),

  // Exams
  getExams: (params?: Record<string, unknown>) =>
    apiClient.get("/examinations/exams", { params }),
  getExam: (id: string) => apiClient.get(`/examinations/exams/${id}`),
  createExam: (payload: Record<string, unknown>) =>
    apiClient.post("/examinations/exams", payload),
  updateExam: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/examinations/exams/${id}`, payload),
  deleteExam: (id: string) => apiClient.delete(`/examinations/exams/${id}`),
  publishExam: (id: string) => apiClient.post(`/examinations/exams/${id}/publish`),
  unlockExam: (id: string) => apiClient.post(`/examinations/exams/${id}/unlock`),
  relockExam: (id: string) => apiClient.post(`/examinations/exams/${id}/relock`),
  createRetakeExam: (id: string, payload: Record<string, unknown>) =>
    apiClient.post(`/examinations/exams/${id}/retakes`, payload),
  getRetakeExams: (id: string) => apiClient.get(`/examinations/exams/${id}/retakes`),

  // Exam papers (the subjects sat within one exam)
  getExamSubjects: (params?: { examId?: string }) =>
    apiClient.get("/examinations/exam-subjects", { params }),
  createExamSubject: (payload: Record<string, unknown>) =>
    apiClient.post("/examinations/exam-subjects", payload),
  updateExamSubject: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/examinations/exam-subjects/${id}`, payload),
  deleteExamSubject: (id: string) => apiClient.delete(`/examinations/exam-subjects/${id}`),

  // Marks entry
  getExamResults: (examSubjectId: string, sectionId: string) =>
    apiClient.get(`/examinations/exam-subjects/${examSubjectId}/results`, { params: { sectionId } }),
  saveExamResults: (examSubjectId: string, payload: Record<string, unknown>) =>
    apiClient.post(`/examinations/exam-subjects/${examSubjectId}/results/bulk`, payload),
  getFailingStudents: (examSubjectId: string, sectionId: string) =>
    apiClient.get(`/examinations/exam-subjects/${examSubjectId}/failing-students`, { params: { sectionId } }),

  // Results, printables and self-service
  getClassResultSummary: (examId: string, sectionId?: string) =>
    apiClient.get(`/examinations/exams/${examId}/class-result-summary`, { params: { sectionId } }),
  getStudentResultSummary: (examId: string, studentId: string) =>
    apiClient.get(`/examinations/exams/${examId}/students/${studentId}/result-summary`),
  getDatesheet: (examId: string) => apiClient.get(`/examinations/exams/${examId}/datesheet`),
  getAdmitCard: (examId: string, studentId: string) =>
    apiClient.get(`/examinations/exams/${examId}/students/${studentId}/admit-card`),
  getAdmitCards: (examId: string, sectionId?: string) =>
    apiClient.get(`/examinations/exams/${examId}/admit-cards`, { params: { sectionId } }),
  getReportCard: (studentId: string, academicYearId: string) =>
    apiClient.get(`/examinations/students/${studentId}/academic-years/${academicYearId}/report-card`),
  getReportCards: (academicYearId: string, classId: string, sectionId?: string) =>
    apiClient.get(`/examinations/academic-years/${academicYearId}/report-cards`, { params: { classId, sectionId } }),
  getExamsForMe: (academicYearId?: string) =>
    apiClient.get("/examinations/exams/for-me", { params: { academicYearId } }),
};
