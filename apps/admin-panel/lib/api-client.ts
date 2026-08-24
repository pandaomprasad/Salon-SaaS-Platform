import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969/api/v1";

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_token");
  },
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_refresh_token");
  },
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem("admin_token", access);
    localStorage.setItem("admin_refresh_token", refresh);
  },
  clearTokens: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
  },
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  (config as any)._startTime =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const token = tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    const startTime = (res.config as any)?._startTime;
    if (startTime) {
      const duration = (
        (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        startTime
      ).toFixed(2);
      console.log(
        `⏱️ [API CLIENT TIME] ${res.config.method?.toUpperCase()} ${res.config.url} | Status: ${res.status} | Duration: ${duration}ms`
      );
    }
    return res;
  },
  (error) => {
    const startTime = (error.config as any)?._startTime;
    if (startTime) {
      const duration = (
        (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        startTime
      ).toFixed(2);
      console.warn(
        `⏱️ [API CLIENT TIME ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${error.response?.status || "ERR"} | Duration: ${duration}ms`
      );
    }
    if (error.response?.status === 401) {
      tokenStorage.clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default apiClient;