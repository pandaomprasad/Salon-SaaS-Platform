// src/services/customerService.js
import { apiClient, getAuthToken } from "./apiClient";

export const customerService = {
  // Favorites
  getFavoriteSalons: async () => {
    if (!getAuthToken()) return { success: true, data: { favorites: [] } };
    return await apiClient.get("/customers/me/favorites");
  },

  addFavoriteSalon: async (salonId) => {
    if (!getAuthToken()) throw new Error("Authentication required");
    return await apiClient.post(`/customers/me/favorites/${salonId}`);
  },

  removeFavoriteSalon: async (salonId) => {
    if (!getAuthToken()) throw new Error("Authentication required");
    return await apiClient.delete(`/customers/me/favorites/${salonId}`);
  },

  // In-App Notifications
  getNotifications: async (params = {}) => {
    if (!getAuthToken()) return { success: true, data: { notifications: [], total: 0 } };
    const query = new URLSearchParams(params).toString();
    const endpoint = `/notifications${query ? `?${query}` : ""}`;
    return await apiClient.get(endpoint);
  },

  getUnreadCount: async () => {
    if (!getAuthToken()) return { success: true, data: { count: 0, unreadCount: 0 } };
    return await apiClient.get("/notifications/unread-count");
  },

  markNotificationRead: async (notificationId) => {
    if (!getAuthToken()) return;
    return await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  markAllNotificationsRead: async () => {
    if (!getAuthToken()) return;
    return await apiClient.post("/notifications/read-all");
  },

  deleteNotification: async (notificationId) => {
    if (!getAuthToken()) return;
    return await apiClient.delete(`/notifications/${notificationId}`);
  },
};
