import apiClient from "@/lib/axios";

export const financeService = {
  // Salaries
  createSalary: (payload: Record<string, unknown>) =>
    apiClient.post("/finance/salaries", payload),
  getSalaries: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/salaries", { params }),
  getSalary: (id: string) => apiClient.get(`/finance/salaries/${id}`),
  updateSalary: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/finance/salaries/${id}`, payload),
  deleteSalary: (id: string) => apiClient.delete(`/finance/salaries/${id}`),

  // Salary Deduction Rules
  createDeductionRule: (payload: Record<string, unknown>) =>
    apiClient.post("/finance/salary-deduction-rules", payload),
  getDeductionRules: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/salary-deduction-rules", { params }),
  getDeductionRule: (id: string) =>
    apiClient.get(`/finance/salary-deduction-rules/${id}`),
  deleteDeductionRule: (id: string) =>
    apiClient.delete(`/finance/salary-deduction-rules/${id}`),

  // Salary Adjustments
  createAdjustment: (payload: Record<string, unknown>) =>
    apiClient.post("/finance/salary-adjustments", payload),
  getAdjustments: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/salary-adjustments", { params }),
  getAdjustment: (id: string) => apiClient.get(`/finance/salary-adjustments/${id}`),
  deleteAdjustment: (id: string) =>
    apiClient.delete(`/finance/salary-adjustments/${id}`),

  // Salary Payments
  createSalaryPayment: (payload: Record<string, unknown>) =>
    apiClient.post("/finance/salary-payments", payload),
  getSalaryPayments: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/salary-payments", { params }),
  getSalaryPayment: (id: string) => apiClient.get(`/finance/salary-payments/${id}`),
  deleteSalaryPayment: (id: string) =>
    apiClient.delete(`/finance/salary-payments/${id}`),

  // Bank Accounts
  createBankAccount: (payload: Record<string, unknown>) =>
    apiClient.post("/finance/bank-accounts", payload),
  getBankAccounts: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/bank-accounts", { params }),
  getBankAccount: (id: string) => apiClient.get(`/finance/bank-accounts/${id}`),
  updateBankAccount: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/finance/bank-accounts/${id}`, payload),
  deleteBankAccount: (id: string) => apiClient.delete(`/finance/bank-accounts/${id}`),

  // Fee Structures
  createFeeStructure: (payload: Record<string, unknown>) =>
    apiClient.post("/finance/fee-structures", payload),
  getFeeStructures: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/fee-structures", { params }),
  getFeeStructure: (id: string) => apiClient.get(`/finance/fee-structures/${id}`),
  updateFeeStructure: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/finance/fee-structures/${id}`, payload),
  deleteFeeStructure: (id: string) =>
    apiClient.delete(`/finance/fee-structures/${id}`),

  // Student Discounts
  createDiscount: (payload: Record<string, unknown>) =>
    apiClient.post("/finance/student-discounts", payload),
  getDiscounts: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/student-discounts", { params }),
  getDiscount: (id: string) => apiClient.get(`/finance/student-discounts/${id}`),
  deleteDiscount: (id: string) => apiClient.delete(`/finance/student-discounts/${id}`),

  // Student Fine Rules
  createFineRule: (payload: Record<string, unknown>) =>
    apiClient.post("/finance/student-fine-rules", payload),
  getFineRules: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/student-fine-rules", { params }),
  getFineRule: (id: string) => apiClient.get(`/finance/student-fine-rules/${id}`),
  deleteFineRule: (id: string) =>
    apiClient.delete(`/finance/student-fine-rules/${id}`),

  // Student Fines
  createFine: (payload: Record<string, unknown>) =>
    apiClient.post("/finance/student-fines", payload),
  getFines: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/student-fines", { params }),
  getFine: (id: string) => apiClient.get(`/finance/student-fines/${id}`),
  deleteFine: (id: string) => apiClient.delete(`/finance/student-fines/${id}`),

  // Fee Vouchers
  createVoucher: (payload: Record<string, unknown>) =>
    apiClient.post("/finance/fee-vouchers", payload),
  getVouchers: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/fee-vouchers", { params }),
  getVoucher: (id: string) => apiClient.get(`/finance/fee-vouchers/${id}`),
  updateVoucher: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/finance/fee-vouchers/${id}`, payload),
  deleteVoucher: (id: string) => apiClient.delete(`/finance/fee-vouchers/${id}`),

  // Fee Payments
  createFeePayment: (payload: Record<string, unknown>) =>
    apiClient.post("/finance/fee-payments", payload),
  getFeePayments: (params?: Record<string, unknown>) =>
    apiClient.get("/finance/fee-payments", { params }),
  getFeePayment: (id: string) => apiClient.get(`/finance/fee-payments/${id}`),
  deleteFeePayment: (id: string) => apiClient.delete(`/finance/fee-payments/${id}`),
};
