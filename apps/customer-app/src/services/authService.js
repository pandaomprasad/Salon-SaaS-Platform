// src/services/authService.js
import { apiClient, setAuthToken } from "./apiClient";

export const authService = {
  login: async (email, password) => {
    const res = await apiClient.post("/auth/login", { email, password });
    if (res.data?.accessToken) {
      setAuthToken(res.data.accessToken);
    }
    return res;
  },

  register: async (name, email, password, phone) => {
    const res = await apiClient.post("/auth/register", {
      name,
      email,
      password,
      phone,
      role: "customer",
    });
    if (res.data?.accessToken) {
      setAuthToken(res.data.accessToken);
    }
    return res;
  },

  getProfile: async () => {
    return await apiClient.get("/auth/me");
  },
};
