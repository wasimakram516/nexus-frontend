import axios from "axios";
import env from "@/config/env";

const BASE_URL = env.apiBaseUrl;
const API_VERSION = env.apiVersion;

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/${API_VERSION}`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("nexus-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${BASE_URL}/api/${API_VERSION}/auth/refresh`,
            {},
            { withCredentials: true }
          )
          .then((res) => {
            const token = res.data?.data?.accessToken as string;
            sessionStorage.setItem("nexus-token", token);
            return token;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        sessionStorage.removeItem("nexus-token");
        sessionStorage.removeItem("nexus-user");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
