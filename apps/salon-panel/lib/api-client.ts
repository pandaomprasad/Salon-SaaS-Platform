// ============================================================
// lib/api-client.ts
// Core Axios instance — JWT auth, auto token refresh, error parsing
// ============================================================

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

// ──────────────────────────────────────────
// Config
// ──────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969/api/v1";

// ──────────────────────────────────────────
// Token helpers
// Your login page already stores: localStorage.setItem("token", token)
// We extend this to also handle the refresh token.
// ──────────────────────────────────────────

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token"); // matches your existing key
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  },

  clearTokens: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  },
};

// ──────────────────────────────────────────
// Axios instance
// ──────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ──────────────────────────────────────────
// REQUEST interceptor — attach Bearer token
// ──────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ──────────────────────────────────────────
// RESPONSE interceptor — silent refresh on 401
// ──────────────────────────────────────────

let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only refresh on 401, and never retry the refresh call itself
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/refresh")) {
      tokenStorage.clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    }

    // Queue other requests while a refresh is in-flight
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers)
          originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const newAccess = data.data.accessToken;
      const newRefresh = data.data.refreshToken || refreshToken;

      tokenStorage.setTokens(newAccess, newRefresh);
      processQueue(null, newAccess);

      if (originalRequest.headers)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      tokenStorage.clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ──────────────────────────────────────────
// Error parser
// ──────────────────────────────────────────

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
    message: error instanceof Error ? error.message : "Network error",
    status: 0,
  };
}

export default apiClient;