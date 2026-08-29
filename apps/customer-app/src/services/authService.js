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

  googleLogin: async (payload) => {
    const res = await apiClient.post("/auth/google", payload);
    if (res.data?.accessToken) {
      setAuthToken(res.data.accessToken);
    }
    return res;
  },

  appleLogin: async (payload) => {
    const res = await apiClient.post("/auth/apple", payload);
    if (res.data?.accessToken) {
      setAuthToken(res.data.accessToken);
    }
    return res;
  },

  register: async (name, email, password, phone, gender) => {
    const res = await apiClient.post("/auth/register", {
      name,
      email,
      password,
      phone,
      gender,
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

  updateProfile: async (updates) => {
    return await apiClient.patch("/auth/me", updates);
  },

  refresh: async (refreshToken) => {
    return await apiClient.post("/auth/refresh", { refreshToken });
  },

  forgotPassword: async (email) => {
    return await apiClient.post("/auth/forgot-password", { email });
  },

  resetPassword: async (email, otp, newPassword) => {
    return await apiClient.post("/auth/reset-password", { email, otp, newPassword });
  },

  changePassword: async (currentPassword, newPassword) => {
    return await apiClient.post("/auth/change-password", { currentPassword, newPassword });
  },

  resendVerificationLink: async (email) => {
    return await apiClient.post("/auth/resend-verification", { email });
  },

  deleteAccount: async () => {
    return await apiClient.delete("/auth/delete-account");
  },
};
