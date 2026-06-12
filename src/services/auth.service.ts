import apiClient from "@/lib/axios";

export interface LoginPayload {
  email: string;
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

  refresh: () => apiClient.post<{ data: { accessToken: string } }>("/auth/refresh"),

  getSessions: () => apiClient.get("/auth/sessions"),

  revokeSession: (sessionId: string) =>
    apiClient.post("/auth/sessions/revoke", { sessionId }),
};
