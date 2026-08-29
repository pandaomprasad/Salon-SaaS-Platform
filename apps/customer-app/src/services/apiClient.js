// src/services/apiClient.js
import { Platform } from "react-native";
import Constants from "expo-constants";

// Dynamically determine API base URL
const getBaseUrl = () => {
  // If explicitly requested to use local dev server
  if (process.env.EXPO_PUBLIC_USE_LOCAL_API === "true" && typeof __DEV__ !== "undefined" && __DEV__) {
    try {
      const hostUri =
        Constants.expoConfig?.hostUri ||
        Constants.manifest2?.extra?.expoGo?.developer?.manifest?.debuggerHost ||
        Constants.manifest?.debuggerHost;

      if (hostUri) {
        const ip = hostUri.split(":")[0];
        if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
          return `http://${ip}:6969/api/v1`;
        }
      }
    } catch (e) {}

    if (process.env.EXPO_PUBLIC_DEV_API_URL) {
      return process.env.EXPO_PUBLIC_DEV_API_URL;
    }
  }

  // Default: Live Railway API Backend URL
  return process.env.EXPO_PUBLIC_API_URL || "https://optimistic-ambition-production-32e7.up.railway.app/api/v1";
};

export const API_BASE_URL = getBaseUrl();
console.log("API Base URL active:", API_BASE_URL);

let userToken = null;
let tokenRefreshHandler = null;
let unauthorizedHandler = null;
let isRefreshing = false;

export const setAuthToken = (token) => {
  userToken = token;
};

export const setRefreshTokenHandler = (handler) => {
  tokenRefreshHandler = handler;
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const getAuthToken = () => userToken;

const CLIENT_GET_CACHE = new Map();
const IN_FLIGHT_GET_REQUESTS = new Map();

export const clearClientCache = () => {
  CLIENT_GET_CACHE.clear();
  IN_FLIGHT_GET_REQUESTS.clear();
};

async function executeRequest(endpoint, options = {}, retries = 1, isAuthRetry = false) {
  const url = `${API_BASE_URL}${endpoint}`;
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const startTimeISO = new Date().toISOString();

  const headers = {
    "Content-Type": "application/json",
    "bypass-tunnel-reminder": "true",
    "ngrok-skip-browser-warning": "true",
    ...(options.headers || {}),
  };

  if (userToken) {
    headers["Authorization"] = `Bearer ${userToken}`;
  }

  const method = options.method || "GET";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

  try {
    const fetchOptions = {
      method,
      headers,
      signal: options.signal || controller.signal,
    };
    if (options.body) fetchOptions.body = options.body;

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const duration = ((typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime).toFixed(2);
    console.log(
      `⏱️ [API CLIENT TIME] ${method} ${endpoint} | Status: ${response.status} | Duration: ${duration}ms | Started: ${startTimeISO}`
    );

    const rawText = await response.text();

    let data = {};
    if (rawText && rawText.trim()) {
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        const cleanMessage = rawText.replace(/<[^>]*>/g, "").trim().slice(0, 120);
        const err = new Error(
          response.ok
            ? "Invalid response format from server."
            : `Server error (${response.status}): ${cleanMessage || "Unable to reach server."}`
        );
        err.status = response.status;
        throw err;
      }
    }

    if (!response.ok) {
      const msg = data?.message || data?.error || `Request failed with status ${response.status}`;
      const err = new Error(msg);
      err.data = data;
      err.status = response.status;
      err.conflictAppointment = data?.conflictAppointment || null;

      // Handle 401 Unauthorized or Token Expiry automatically via Refresh Token
      if (
        (response.status === 401 || msg.toLowerCase().includes("token expired")) &&
        !isAuthRetry &&
        endpoint !== "/auth/refresh" &&
        endpoint !== "/auth/login"
      ) {
        if (tokenRefreshHandler && !isRefreshing) {
          isRefreshing = true;
          try {
            console.log("[ApiClient] 401 received. Attempting silent token refresh...");
            const newToken = await tokenRefreshHandler();
            isRefreshing = false;

            if (newToken) {
              userToken = newToken;
              return executeRequest(endpoint, options, retries, true);
            }
          } catch (refreshErr) {
            isRefreshing = false;
            console.warn("[ApiClient] Silent token refresh failed:", refreshErr.message);
          }
        }

        if (unauthorizedHandler) {
          unauthorizedHandler();
        }
      }

      throw err;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry once on network-level failures (timeout / no connection),
    // but never on HTTP errors like 400/401/404
    if (
      retries > 0 &&
      (error.name === "AbortError" ||
        error.message === "Network request failed" ||
        error.message === "Network request timed out")
    ) {
      console.warn(`API Error [${method} ${endpoint}]: ${error.message} — retrying once…`);
      return executeRequest(endpoint, options, retries - 1);
    }

    if (error.name === "AbortError") {
      const timeoutErr = new Error("Network request timed out. Please check your connection.");
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    const isAuthMessage =
      error.message &&
      (error.message.toLowerCase().includes("token expired") ||
        error.message.toLowerCase().includes("no token provided"));
    if (!isAuthMessage) {
      console.warn(`API Error [${method} ${endpoint}]:`, error.message);
    }
    throw error;
  }
}

async function request(endpoint, options = {}, retries = 1, isAuthRetry = false) {
  const method = options.method || "GET";

  // Invalidate client GET memory cache on data mutations
  if (method !== "GET") {
    CLIENT_GET_CACHE.clear();
    return executeRequest(endpoint, options, retries, isAuthRetry);
  }

  const cacheKey = `${userToken ? "auth" : "anon"}:${endpoint}`;

  // 1. Return fresh client memory cached data (unless bypassCache is requested)
  if (!options.bypassCache) {
    const cached = CLIENT_GET_CACHE.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      console.log(`⚡ [API CLIENT CACHE HIT] GET ${endpoint} (0ms)`);
      return cached.data;
    }
  }

  // 2. Reuse pending in-flight Promise for identical concurrent GET requests
  if (IN_FLIGHT_GET_REQUESTS.has(cacheKey)) {
    console.log(`🔄 [API CLIENT DEDUPLICATED] GET ${endpoint}`);
    return IN_FLIGHT_GET_REQUESTS.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const result = await executeRequest(endpoint, options, retries, isAuthRetry);
      if (result) {
        const ttlMs = options.ttlMs || 30000; // 30s client memory cache
        CLIENT_GET_CACHE.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + ttlMs,
        });
      }
      return result;
    } finally {
      IN_FLIGHT_GET_REQUESTS.delete(cacheKey);
    }
  })();

  IN_FLIGHT_GET_REQUESTS.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: "DELETE" }),
  clearCache: clearClientCache,
};

export function paiseToINR(paise) {
  if (!paise && paise !== 0) return "₹0.00";
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * "YYYY-MM-DD" in the device's LOCAL timezone.
 * (ISO string dates shift before ~5:30 AM IST and break slot lookups.)
 */
export function toLocalDateStr(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
