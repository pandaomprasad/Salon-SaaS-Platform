// src/services/apiClient.js
import { Platform } from "react-native";
import Constants from "expo-constants";

// Dynamically determine the host machine IP address when running via Expo Go / Metro
const getBaseUrl = () => {
  // 1. In local dev mode (__DEV__), default to local server on port 6969
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    if (process.env.EXPO_PUBLIC_DEV_API_URL) {
      return process.env.EXPO_PUBLIC_DEV_API_URL;
    }

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
    } catch (e) {
      console.log("Could not extract hostUri from Constants", e);
    }

    if (Platform.OS === "android") {
      return "http://10.0.2.2:6969/api/v1";
    }

    return "http://localhost:6969/api/v1";
  }

  // 2. Production API URL
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return "http://localhost:6969/api/v1";
};

export const API_BASE_URL = getBaseUrl();
console.log("API Base URL active:", API_BASE_URL);

let userToken = null;
let unauthorizedHandler = null;

export const setAuthToken = (token) => {
  userToken = token;
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const getAuthToken = () => userToken;

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

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

  try {
    const fetchOptions = {
      method,
      headers,
    };
    if (options.body) fetchOptions.body = options.body;
    if (options.signal) fetchOptions.signal = options.signal;

    const response = await fetch(url, fetchOptions);
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

      // Handle 401 Unauthorized or Token Expiry automatically
      if ((response.status === 401 || msg.toLowerCase().includes("token expired")) && unauthorizedHandler) {
        unauthorizedHandler();
      }

      throw err;
    }

    return data;
  } catch (error) {
    console.warn(`API Error [${method} ${endpoint}]:`, error.message);
    throw error;
  }
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: "DELETE" }),
};

export function paiseToINR(paise) {
  if (!paise && paise !== 0) return "₹0.00";
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
