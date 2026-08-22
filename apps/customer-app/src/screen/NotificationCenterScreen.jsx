// src/screen/NotificationCenterScreen.jsx
import React, { useState, useEffect, useMemo } from "react";
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
import { C, S, FS, FW, R, TYPO, SHADOWS } from "../theme";
import { customerService } from "../services/customerService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatTimestamp(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

function getDateGroup(dateStr) {
  if (!dateStr) return "Earlier";
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (d >= startOfToday) return "Today";
  if (d >= startOfYesterday) return "Yesterday";
  if (d >= startOfWeek) return "This week";
  return "Earlier";
}

function getNotificationMeta(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("appointment.created") || t.includes("book"))
    return { icon: "calendar-outline", color: C.main };
  if (t.includes("completed"))
    return { icon: "checkmark-circle-outline", color: "#2E9E5B" };
  if (t.includes("cancelled") || t.includes("reject"))
    return { icon: "close-circle-outline", color: "#C24545" };
  if (t.includes("resched"))
    return { icon: "time-outline", color: "#C9922E" };
  if (t.includes("leave"))
    return { icon: "briefcase-outline", color: C.muted };
  return { icon: "notifications-outline", color: C.muted };
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

export default function NotificationCenterScreen({ navigate, onBack }) {
  const styles = getStyles();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchNotifications = async () => {
    try {
      const res = await customerService.getNotifications();
      let list = [];
      if (res?.data?.notifications) list = res.data.notifications;
      else if (Array.isArray(res?.data)) list = res.data;

      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
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

  const visibleNotifications = useMemo(() => {
    if (activeFilter === "unread") return notifications.filter((n) => !n.isRead);
    return notifications;
  }, [notifications, activeFilter]);

  const groupedSections = useMemo(() => {
    const groups = {};
    visibleNotifications.forEach((item) => {
      const key = getDateGroup(item.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    const order = ["Today", "Yesterday", "This week", "Earlier"];
    return order
      .filter((key) => groups[key]?.length)
      .map((key) => ({ title: key, data: groups[key] }));
  }, [visibleNotifications]);

  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const topInset = Math.max(insets.top, isAndroid ? (StatusBar.currentHeight || 24) : 0);
  const bottomInset = isAndroid ? Math.max(insets.bottom, 36) + 20 : Math.max(insets.bottom, 20) + 20;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 10 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack || (() => navigate && navigate("Home"))}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={C.ink} />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.eyebrow}>IN-APP ALERTS</Text>
            <Text style={styles.title}>Notifications</Text>
          </View>

          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterTabs}>
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterTab, isActive && styles.filterTabActive]}
                  onPress={() => setActiveFilter(f.key)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.8}>
              <Ionicons name="checkmark-done-outline" size={14} color={C.main} />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Body */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={C.main} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.main} />}
        >
          {visibleNotifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name={activeFilter === "unread" ? "checkmark-done-outline" : "notifications-off-outline"}
                  size={30}
                  color={C.dustTaupe}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeFilter === "unread" ? "You're all caught up" : "No Notifications Yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === "unread"
                  ? "No unread alerts right now. Check back later."
                  : "Booking updates and alerts will appear right here."}
              </Text>
            </View>
          ) : (
            groupedSections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionHeader}>{section.title}</Text>

                {section.data.map((item) => {
                  const id = item._id || item.id;
                  const isUnread = !item.isRead;
                  const meta = getNotificationMeta(item.type);

                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.itemCard, isUnread && styles.itemCardUnread]}
                      onPress={() => handleItemPress(item)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.iconBox, { backgroundColor: `${meta.color}14` }]}>
                        <Ionicons name={meta.icon} size={19} color={meta.color} />
                      </View>

                      <View style={styles.itemMain}>
                        <View style={styles.itemHeaderRow}>
                          <Text
                            style={[styles.itemTitle, isUnread && styles.itemTitleBold]}
                            numberOfLines={1}
                          >
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
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      paddingTop: 54,
      paddingHorizontal: S.lg,
      paddingBottom: S.sm,
      backgroundColor: C.bg,
      borderBottomWidth: 1,
      borderColor: C.border,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: S.md,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: R.md,
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
      letterSpacing: 1.2,
    },
    title: {
      fontSize: 24,
      fontWeight: FW.bold,
      color: C.ink,
      letterSpacing: -0.5,
      marginTop: 2,
    },
    headerBadge: {
      minWidth: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: C.main,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 7,
    },
    headerBadgeText: {
      fontSize: 12,
      fontWeight: FW.bold,
      color: "#FFFFFF",
    },
    filterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    filterTabs: {
      flexDirection: "row",
      backgroundColor: C.surface,
      borderRadius: R.sm,
      padding: 3,
      borderWidth: 1,
      borderColor: C.border,
    },
    filterTab: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: R.sm,
    },
    filterTabActive: {
      backgroundColor: C.main,   // was: C.ink (which is rendering as stark white/near-white here)
    },
    filterTabText: {
      fontSize: 12.5,
      fontWeight: FW.medium,
      color: C.muted,
    },
    filterTabTextActive: {
      color: "#FFFFFF",
      fontWeight: FW.semiBold,
    },
    markAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 7,
      paddingHorizontal: 12,
    },
    markAllText: {
      fontSize: 12.5,
      fontWeight: FW.semiBold,
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
      flexGrow: 1,          // was: padding: S.md, paddingBottom: S.xl
      padding: S.md,
      paddingBottom: S.xl,
    },
    section: {
      marginBottom: S.md,
    },
    sectionHeader: {
      fontSize: 11.5,
      fontWeight: FW.bold,
      color: C.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: S.sm,
      marginLeft: 2,
    },
    emptyCard: {
      flex: 1,               // fills remaining scroll space
      // backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.xl,
      alignItems: "center",
      justifyContent: "center", // vertically centers icon/title/subtitle inside it
      borderWidth: 0,
      borderColor: C.border,
      // removed marginTop: S.xl
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
      fontWeight: FW.semiBold,
      color: C.ink,
      marginBottom: S.xs,
    },
    emptySubtitle: {
      fontSize: FS.bodySm,
      color: C.muted,
      textAlign: "center",
      lineHeight: 20,
      maxWidth: 260,
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
      marginBottom: S.sm,
      ...SHADOWS.sm,
    },
    itemCardUnread: {
      backgroundColor: C.lifted,
      borderColor: "rgba(189, 68, 68, 0.2)",
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: R.full,
      alignItems: "center",
      justifyContent: "center",
      marginRight: S.sm,
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
      fontWeight: FW.medium,
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
}