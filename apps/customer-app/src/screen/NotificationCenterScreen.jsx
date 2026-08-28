// src/screen/NotificationCenterScreen.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FONT_FAMILY } from "../theme";
import { customerService } from "../services/customerService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import SwipeableNotificationItem from "../components/SwipeableNotificationItem";

function formatTimestamp(dateStr) {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

const DEFAULT_DEMO_NOTIFICATIONS = [
  {
    _id: "demo-1",
    title: "Appointment Reminder",
    body: "You have an appointment at The Galleria Hair Salon at 8:00am today",
    highlightWord: "appointment",
    createdAt: new Date().toISOString(),
    isRead: false,
  },
  {
    _id: "demo-2",
    title: "Password Changed",
    body: "Your password is successfully changed",
    highlightWord: "password",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    isRead: true,
  },
  {
    _id: "demo-3",
    title: "Profile Completion",
    body: "Completed your profile to be better health consults.",
    actionText: "Complete Profile",
    createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    isRead: true,
  },
];

export default function NotificationCenterScreen({ navigate, onBack }) {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await customerService.getNotifications();
      let list = [];
      if (res?.data?.notifications) list = res.data.notifications;
      else if (Array.isArray(res?.data)) list = res.data;

      if (list.length === 0) {
        setNotifications(DEFAULT_DEMO_NOTIFICATIONS);
      } else {
        setNotifications(list);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err.message);
      setNotifications(DEFAULT_DEMO_NOTIFICATIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await customerService.markAllNotificationsRead();
    } catch (e) {
      console.warn("Failed to mark all read", e);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleToggleRead = async (item) => {
    const id = item._id || item.id;
    if (!item.isRead) {
      try {
        await customerService.markNotificationRead(id);
      } catch (e) {}
    }
    setNotifications((prev) =>
      prev.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true } : n))
    );
    if (navigate && (item.type?.includes("appointment") || item.body?.toLowerCase().includes("appointment"))) {
      navigate("Bookings");
    }
  };

  const handleDeleteNotification = useCallback(async (item) => {
    const id = item._id || item.id;
    setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== id));
    try {
      await customerService.deleteNotification(id);
    } catch (e) {
      console.warn("Failed to delete notification:", e.message);
    }
  }, []);

  const handleClose = () => {
    if (onBack) onBack();
    else if (navigate) navigate("Home");
  };

  const topInset = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 12);
  const bottomInset = Math.max(insets.bottom, 24) + 20;

  const renderRichBody = (item) => {
    const text = item.body || item.title || "";
    const actionStr = item.actionText || (text.toLowerCase().includes("complete profile") ? "Complete Profile" : null);

    let baseText = text;
    if (actionStr && baseText.includes(actionStr)) {
      baseText = baseText.replace(actionStr, "").trim();
    }

    const words = baseText.split(" ");
    const boldKeywords = ["appointment", "password", "profile", "booking", "confirmed", "rescheduled"];

    return (
      <Text style={styles.itemTextBody}>
        {words.map((word, i) => {
          const clean = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
          const isBold = boldKeywords.includes(clean) || (item.highlightWord && clean === item.highlightWord.toLowerCase());

          return (
            <Text key={i} style={isBold ? styles.boldWord : styles.normalWord}>
              {word}{" "}
            </Text>
          );
        })}
        {actionStr ? (
          <Text style={styles.actionTextLink} onPress={() => navigate && navigate("Profile")}>
            {actionStr}
          </Text>
        ) : null}
      </Text>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Top Header Card Container */}
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Notifications</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.75}>
            <Ionicons name="close" size={22} color={isDark ? "#D1D1D6" : "#3A3A3C"} />
          </TouchableOpacity>
        </View>

        {/* Enhanced Sub-Header Actions Bar */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="checkmark-done-sharp" size={15} color="#6C5CE7" style={{ marginRight: 4 }} />
            <Text style={styles.markAllReadText}>Mark all as read</Text>
          </TouchableOpacity>

          {unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadCount} unread</Text>
            </View>
          )}
        </View>

        {/* Hairline Divider */}
        <View style={styles.divider} />
      </View>

      {/* Notification List Scroll */}
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="notifications-off-outline" size={32} color={isDark ? "#6366F1" : "#4F46E5"} />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>You're all caught up! When you have new alerts, they will show up here.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6C5CE7" />}
        >
          {notifications.map((item, index) => {
            const isLast = index === notifications.length - 1;

            return (
              <SwipeableNotificationItem
                key={item._id || item.id || index}
                item={item}
                isLast={isLast}
                onPress={handleToggleRead}
                onDelete={handleDeleteNotification}
                renderRichBody={renderRichBody}
                formatTimestamp={formatTimestamp}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function getStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121216" : "#FFFFFF",
    },
    headerCard: {
      paddingHorizontal: 22,
      paddingTop: 12,
      backgroundColor: isDark ? "#121216" : "#FFFFFF",
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    screenTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      letterSpacing: -0.4,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F4F4F6",
      alignItems: "center",
      justifyContent: "center",
    },
    actionsBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    markAllBtn: {
      flexDirection: "row",
      alignItems: "center",
    },
    markAllReadText: {
      fontSize: 13.5,
      fontWeight: "600",
      color: "#6C5CE7",
    },
    unreadPill: {
      backgroundColor: "rgba(108, 92, 231, 0.12)",
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
    },
    unreadPillText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#6C5CE7",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? "#2C2C34" : "#EBECEF",
      marginHorizontal: -22,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 0,
      paddingTop: 6,
    },
    loadingCenter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    notificationRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 16,
    },
    rowBorderBottom: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#26262E" : "#EFEFF4",
    },
    indicatorWrap: {
      width: 22,
      paddingTop: 5,
      alignItems: "flex-start",
    },
    unreadPurpleDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#6C5CE7",
    },
    readHollowRing: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: isDark ? "#55555E" : "#C7C7CC",
      backgroundColor: "transparent",
    },
    contentColumn: {
      flex: 1,
    },
    itemTextBody: {
      fontSize: 14,
      lineHeight: 20,
      color: isDark ? "#D1D1D6" : "#3A3A3C",
    },
    normalWord: {
      fontWeight: "400",
      color: isDark ? "#CCCCCC" : "#48484A",
    },
    boldWord: {
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    actionTextLink: {
      fontWeight: "700",
      color: "#6C5CE7",
    },
    timestampText: {
      fontSize: 12,
      color: isDark ? "#7C7C82" : "#A0A0A5",
      marginTop: 4,
      fontWeight: "400",
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 36,
      paddingVertical: 60,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.08)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 13.5,
      lineHeight: 20,
      color: isDark ? "#8E8E93" : "#6E6E73",
      textAlign: "center",
    },
  });
}