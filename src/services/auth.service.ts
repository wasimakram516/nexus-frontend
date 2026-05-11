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

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<{ data: LoginResponse }>("/auth/login", payload),

  logout: () => apiClient.post("/auth/logout"),

  refresh: () => apiClient.post<{ data: { accessToken: string } }>("/auth/refresh"),

  getSessions: () => apiClient.get("/auth/sessions"),

  revokeSession: (sessionId: string) =>
    apiClient.post("/auth/sessions/revoke", { sessionId }),
};
