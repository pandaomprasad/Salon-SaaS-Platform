import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO, FF } from "../theme";
import { useTheme } from "../context/ThemeContext";
import FloatingSearchCapsule from "./FloatingSearchCapsule";
import AppleTouchable from "./AppleTouchable";

export default function Ios26HomeHero({ onSearchClick, onLocationClick, onNotificationClick, onFilterPress, userName, selectedCity, onSearchSubmit }) {
  const { isDark, toggleTheme, toggleAnim } = useTheme();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let active = true;
    const checkUnread = async () => {
      try {
        const res = await customerService.getUnreadCount();
        const count = typeof res?.data?.count === "number" ? res.data.count : (res?.data?.unreadCount || 0);
        if (active) setHasUnread(count > 0);
      } catch (err) {
        try {
          const res = await customerService.getNotifications();
          const list = res?.data?.notifications || (Array.isArray(res?.data) ? res.data : []);
          const unread = list.some((n) => !n.isRead);
          if (active) setHasUnread(unread);
        } catch (e) {}
      }
    };
    checkUnread();
    return () => { active = false; };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = userName ? userName.split(" ")[0] : null;
  const styles = getStyles();

  // Icon crossfade: 0→1 (light→dark)
  const sunOpacity = toggleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const moonOpacity = toggleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={styles.hero}>
      {/* Top bar: Location selector & actions */}
      <View style={styles.topBar}>
        <AppleTouchable style={styles.locationChip} onPress={onLocationClick} scaleTo={0.96}>
          <Ionicons name="location-outline" size={14} color={C.main} />
          <Text style={styles.locationCity} numberOfLines={1}>{selectedCity || "Brahmapur"}</Text>
          <Ionicons name="chevron-down" size={12} color={C.muted} />
        </AppleTouchable>

        <View style={styles.topBarActions}>
          {/* Dark / light toggle */}
          <AppleTouchable
            style={styles.themeBtn}
            onPress={toggleTheme}
            scaleTo={0.92}
            hapticType="medium"
            accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
            accessibilityRole="button"
          >
            <Animated.View style={{ opacity: sunOpacity, position: "absolute" }}>
              <Ionicons name="sunny-outline" size={17} color={C.main} />
            </Animated.View>
            <Animated.View style={{ opacity: moonOpacity }}>
              <Ionicons name="moon-outline" size={17} color={C.main} />
            </Animated.View>
          </AppleTouchable>

          <AppleTouchable style={styles.notifBtn} onPress={onNotificationClick} scaleTo={0.92} hapticType="light">
            <Ionicons name="notifications-outline" size={18} color={C.ink} />
            {hasUnread && <View style={styles.notifBadgeDot} />}
          </AppleTouchable>
        </View>
      </View>

      {/* Hero Header - Display weight 400 with negative tracking per cursor/DESIGN.md */}
      <View style={styles.greetingBlock}>
        <Text style={styles.sectionTag}>THE SALON EDIT</Text>
        <Text style={styles.greeting}>
          {getGreeting()}{displayName ? `, ${displayName}` : ""}
        </Text>
        <Text style={styles.subGreeting}>
          {selectedCity || "Brahmapur"}'s finest, ready to book
        </Text>
      </View>

      {/* Search Capsule Input */}
      <FloatingSearchCapsule
        selectedCity={selectedCity}
        onLocationClick={onLocationClick}
        onSelectSuggestion={(term) => onSearchSubmit && onSearchSubmit(term)}
        onSearchSubmit={(term) => onSearchSubmit && onSearchSubmit(term)}
        onFilterPress={onFilterPress}
      />
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    hero: {
      paddingTop: Platform.OS === "android" ? 44 : 52,
      paddingHorizontal: S.md,
      paddingBottom: S.md,
      backgroundColor: C.bg,
      zIndex: 100,
    },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: S.lg,
    },
    locationChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: C.surface,
      paddingHorizontal: S.sm,
      paddingVertical: 6,
      borderRadius: R.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    locationCity: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
      color: C.ink,
    },
    notifBtn: {
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: C.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
      position: "relative",
    },
    notifBadgeDot: {
      position: "absolute",
      top: 7,
      right: 7,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: C.main,
    },
    topBarActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    themeBtn: {
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: C.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    greetingBlock: {
      marginBottom: S.lg,
    },
    sectionTag: {
      ...TYPO.eyebrow,
      marginBottom: S.xxs,
      color: C.main,
    },
    greeting: {
      fontFamily: FF.display,
      fontSize: FS.headline,
      color: C.ink,
      lineHeight: FS.headline * 1.08,
    },
    subGreeting: {
      fontFamily: FF.body,
      fontSize: FS.subheadline,
      color: C.muted,
      marginTop: S.xxs,
    },
  });
}
