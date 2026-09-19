import apiClient from "@/lib/axios";

export interface ContactInquiryPayload {
  name: string;
  email: string;
  organisation?: string;
  inquiryType: string;
  message: string;
  /** Honeypot. Real users never fill this in. */
  website?: string;
}

/** Public contact form submission (unauthenticated). */
export const contactService = {
  submitInquiry: (payload: ContactInquiryPayload) =>
    apiClient.post("/contact/inquiries", payload),
};

/** Superadmin inbox for contact inquiries. */
export const contactInquiriesService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get("/platform/contact-inquiries", { params }),

  updateStatus: (id: string, status: "NEW" | "READ" | "ARCHIVED") =>
    apiClient.patch(`/platform/contact-inquiries/${id}/status`, { status }),

  remove: (id: string) => apiClient.delete(`/platform/contact-inquiries/${id}`),
};
