import apiClient from "@/lib/api-client";
import { getCached, invalidateCache, setCache } from "@/lib/cache";
import type {
  ApiResponse,
  BackendNotification,
  NotificationsResponse,
} from "@/lib/api";

const UNREAD_COUNT_CACHE_KEY = "notifications:unread-count";
const UNREAD_COUNT_TTL = 2 * 60 * 1000;

let unreadCountRequest: Promise<number> | null = null;

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

export async function getUnreadCount(options?: { forceRefresh?: boolean }) {
  const cached = options?.forceRefresh
    ? null
    : getCached<number>(UNREAD_COUNT_CACHE_KEY, UNREAD_COUNT_TTL);

  if (cached !== null) return cached;

  if (unreadCountRequest) return unreadCountRequest;

  unreadCountRequest = apiClient
    .get<ApiResponse<{ unreadCount: number }>>("/notifications/unread-count")
    .then(({ data }) => {
      const count = data.data.unreadCount;
      setCache(UNREAD_COUNT_CACHE_KEY, count);
      return count;
    })
    .finally(() => {
      unreadCountRequest = null;
    });

  return unreadCountRequest;
}

export function seedUnreadCount(unreadCount: number) {
  setCache(UNREAD_COUNT_CACHE_KEY, unreadCount);
}

export function bumpUnreadCount(delta = 1) {
  const current = getCached<number>(UNREAD_COUNT_CACHE_KEY, UNREAD_COUNT_TTL) ?? 0;
  const next = Math.max(0, current + delta);
  setCache(UNREAD_COUNT_CACHE_KEY, next);
  return next;
}

export function clearUnreadCountCache() {
  invalidateCache(UNREAD_COUNT_CACHE_KEY);
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
