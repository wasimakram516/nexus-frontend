import apiClient from "@/lib/axios";

export interface LoginPayload {
  /** Email (staff/admin), registration number (student), or phone (guardian). */
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    institutionId: string | null;
    sessionId: string;
    /** True when someone else set the account up and its password must be replaced. */
    mustChangePassword?: boolean;
  };
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  institutionId?: string;
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId: string | null;
}

export interface SignupPayload {
  institutionName: string;
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  accessToken: string;
  sessionId: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    institutionId: string | null;
  };
  institution: {
    id: string;
    name: string;
    slug: string;
    trialEndsAt: string;
  };
}

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<{ data: LoginResponse }>("/auth/login", payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<{ data: RegisteredUser }>("/auth/register", payload),

  signupTrial: (payload: SignupPayload) =>
    apiClient.post<{ data: SignupResponse }>("/platform/signup", payload),

  logout: () => apiClient.post("/auth/logout"),

  /** Asks for a reset link; the answer is the same whether or not the account exists. */
  forgotPassword: (identifier: string) => apiClient.post("/auth/forgot-password", { identifier }),

  resetPassword: (token: string, password: string) => apiClient.post("/auth/reset-password", { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post("/auth/change-password", { currentPassword, newPassword }),

  refresh: () => apiClient.post<{ data: { accessToken: string } }>("/auth/refresh"),

  getSessions: () => apiClient.get("/auth/sessions"),

  revokeSession: (sessionId: string) =>
    apiClient.post("/auth/sessions/revoke", { sessionId }),

  /** Ends every sign-in, including the one making the request. */
  revokeAllSessions: () => apiClient.post("/auth/sessions/revoke", {}),
};
