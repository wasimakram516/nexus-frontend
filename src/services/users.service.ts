import apiClient from "@/lib/axios";

export const usersService = {
  getMe: () => apiClient.get("/users/me"),

  updateMe: (payload: Record<string, unknown>) => apiClient.put("/users/me", payload),

  getAll: (params?: Record<string, unknown>) => apiClient.get("/users", { params }),

  updateUser: (userId: string, payload: Record<string, unknown>) =>
    apiClient.put(`/users/${userId}`, payload),

  deleteUser: (userId: string) => apiClient.delete(`/users/${userId}`),
};
