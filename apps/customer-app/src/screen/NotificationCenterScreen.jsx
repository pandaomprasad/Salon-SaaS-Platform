// src/screen/NotificationCenterScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO, SHADOWS } from "../theme";
import { customerService } from "../services/customerService";

function formatTimestamp(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

function getNotificationIcon(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("appointment.created") || t.includes("book")) return "calendar-outline";
  if (t.includes("completed")) return "checkmark-circle-outline";
  if (t.includes("cancelled") || t.includes("reject")) return "close-circle-outline";
  if (t.includes("resched")) return "time-outline";
  if (t.includes("leave")) return "briefcase-outline";
  return "notifications-outline";
}

export default function NotificationCenterScreen({ navigate, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await customerService.getNotifications();
      if (res?.data?.notifications) {
        setNotifications(res.data.notifications);
        const unread = res.data.notifications.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      } else if (Array.isArray(res?.data)) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkRead = async (id) => {
    try {
      await customerService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.warn("Failed to mark read", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await customerService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn("Failed to mark all read", e);
    }
  };

  const handleItemPress = (item) => {
    if (!item.isRead) {
      handleMarkRead(item._id || item.id);
    }
    if (navigate && (item.data?.appointmentId || item.type?.includes("appointment"))) {
      navigate("Bookings");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack || (() => navigate && navigate("Home"))}>
          <Ionicons name="arrow-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.eyebrow}>IN-APP ALERTS</Text>
          <Text style={styles.title}>Notification Center</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content Body */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={C.main} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.main} />}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={32} color={C.dustTaupe} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.emptySubtitle}>
                You are all caught up! Booking updates and alerts will appear right here.
              </Text>
            </View>
          ) : (
            notifications.map((item) => {
              const id = item._id || item.id;
              const isUnread = !item.isRead;
              const iconName = getNotificationIcon(item.type);

              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.itemCard, isUnread && styles.itemCardUnread]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconBox, isUnread && styles.iconBoxUnread]}>
                    <Ionicons name={iconName} size={20} color={isUnread ? C.main : C.muted} />
                  </View>

                  <View style={styles.itemMain}>
                    <View style={styles.itemHeaderRow}>
                      <Text style={[styles.itemTitle, isUnread && styles.itemTitleBold]} numberOfLines={1}>
                        {item.title || "Notification"}
                      </Text>
                      <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
                    </View>

                    {item.body && (
                      <Text style={styles.itemBody} numberOfLines={2}>
                        {item.body}
                      </Text>
                    )}
                  </View>

                  {isUnread && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: S.lg,
    paddingBottom: S.md,
    backgroundColor: C.bg,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: R.full,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: S.sm,
  },
  headerTextGroup: {
    flex: 1,
  },
  eyebrow: {
    ...TYPO.eyebrow,
    color: C.main,
    fontSize: 11,
  },
  title: {
    fontSize: 22,
    fontWeight: FW.medium,
    color: C.ink,
    letterSpacing: -0.4,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: R.full,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: FW.medium,
    color: C.main,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: S.md,
    gap: S.sm,
  },
  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    padding: S.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    marginTop: S.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: R.full,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.md,
  },
  emptyTitle: {
    fontSize: FS.h3,
    fontWeight: FW.medium,
    color: C.ink,
    marginBottom: S.xs,
  },
  emptySubtitle: {
    fontSize: FS.bodySm,
    color: C.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  itemCard: {
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: S.md,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: C.border,
    position: "relative",
    ...SHADOWS.sm,
  },
  itemCardUnread: {
    backgroundColor: C.lifted,
    borderColor: "rgba(245, 78, 0, 0.2)",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: R.full,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: S.sm,
  },
  iconBoxUnread: {
    backgroundColor: "rgba(245, 78, 0, 0.08)",
  },
  itemMain: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
    color: C.ink,
    flex: 1,
    marginRight: S.xs,
  },
  itemTitleBold: {
    fontWeight: FW.bold,
    color: C.ink,
  },
  timestamp: {
    fontSize: 11,
    color: C.muted,
  },
  itemBody: {
    fontSize: FS.caption,
    color: C.body,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: R.full,
    backgroundColor: C.main,
    position: "absolute",
    top: S.md,
    right: S.md,
  },
});
