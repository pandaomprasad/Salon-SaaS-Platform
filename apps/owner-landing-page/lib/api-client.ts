import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  (config as any)._startTime =
    typeof performance !== "undefined" ? performance.now() : Date.now();
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
    return Promise.reject(error);
  },
);

export interface ParsedApiError {
  message: string;
  errors?: { field: string; message: string }[];
  status: number;
}

export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError(error) && error.response) {
    return {
      message: error.response.data?.message || "Something went wrong",
      errors: error.response.data?.errors,
      status: error.response.status,
    };
  }
  return {
    message: error instanceof Error ? error.message : "Network error. Please try again.",
    status: 0,
  };
}

export default apiClient;
