// src/services/apiClient.js
import { Platform } from "react-native";
import Constants from "expo-constants";

// Dynamically determine the host machine IP address when running via Expo Go / Metro
const getBaseUrl = () => {
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

    const linkingUri = Constants.linkingUri;
    if (linkingUri && linkingUri.includes("://")) {
      const parts = linkingUri.split("://")[1];
      const ip = parts ? parts.split(":")[0] : null;
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
};

export const API_BASE_URL = getBaseUrl();

let userToken = null;

export const setAuthToken = (token) => {
  userToken = token;
};

export const getAuthToken = () => userToken;

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
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

    const data = await response.json();

    if (!response.ok) {
      const err = new Error(data.message || "An unexpected error occurred.");
      err.data = data;
      err.conflictAppointment = data.conflictAppointment || null;
      throw err;
    }

    return data;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error.message);
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
