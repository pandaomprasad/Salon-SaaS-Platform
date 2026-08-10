// src/services/customerService.js
import { apiClient } from "./apiClient";

export const customerService = {
  // Favorites
  getFavoriteSalons: async () => {
    return await apiClient.get("/customers/me/favorites");
  },

  addFavoriteSalon: async (salonId) => {
    return await apiClient.post(`/customers/me/favorites/${salonId}`);
  },

  removeFavoriteSalon: async (salonId) => {
    return await apiClient.delete(`/customers/me/favorites/${salonId}`);
  },

  // In-App Notifications
  getNotifications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/notifications${query ? `?${query}` : ""}`;
    return await apiClient.get(endpoint);
  },

  getUnreadCount: async () => {
    return await apiClient.get("/notifications/unread-count");
  },

  markNotificationRead: async (notificationId) => {
    return await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  markAllNotificationsRead: async () => {
    return await apiClient.post("/notifications/read-all");
  },
};
