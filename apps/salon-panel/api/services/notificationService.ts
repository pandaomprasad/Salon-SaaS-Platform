import apiClient from "@/lib/api-client";
import type {
  ApiResponse,
  BackendNotification,
  NotificationsResponse,
} from "@/lib/api";

export async function getNotifications(params?: {
  unread?: boolean;
  limit?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<NotificationsResponse>>(
    `/notifications`,
    { params },
  );
  return data.data;
}

export async function getUnreadCount() {
  const { data } = await apiClient.get<
    ApiResponse<{ unreadCount: number }>
  >(`/notifications/unread-count`);
  return data.data.unreadCount;
}

export async function markNotificationRead(notificationId: string) {
  const { data } = await apiClient.patch<
    ApiResponse<{ notification: BackendNotification }>
  >(`/notifications/${notificationId}/read`);
  return data.data.notification;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.post<ApiResponse<null>>(
    `/notifications/read-all`,
  );
  return data;
}