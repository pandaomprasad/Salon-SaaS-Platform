import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useTheme } from "../context/ThemeContext";
import FloatingSearchCapsule from "./FloatingSearchCapsule";

export default function Ios26HomeHero({ onSearchClick, onLocationClick, onNotificationClick, userName, selectedCity, onSearchSubmit }) {
  const { isDark, toggleTheme, toggleAnim } = useTheme();
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
    <LinearGradient
      colors={isDark ? ["#1f1f23", "#121215"] : ["#FFFDFB", "#F8F8F5", "#F0F3F8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      {/* Top bar: Location selector & actions */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.locationChip} onPress={onLocationClick} activeOpacity={0.7}>
          <Ionicons name="location-outline" size={14} color={C.main} />
          <Text style={styles.locationCity} numberOfLines={1}>{selectedCity || "Mumbai"}</Text>
          <Ionicons name="chevron-down" size={12} color={C.muted} />
        </TouchableOpacity>

        <View style={styles.topBarActions}>
          {/* Dark / light toggle */}
          <TouchableOpacity
            style={styles.themeBtn}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
            accessibilityRole="button"
          >
            <Animated.View style={{ opacity: sunOpacity, position: "absolute" }}>
              <Ionicons name="sunny-outline" size={17} color={C.main} />
            </Animated.View>
            <Animated.View style={{ opacity: moonOpacity }}>
              <Ionicons name="moon-outline" size={17} color={C.main} />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notifBtn} onPress={onNotificationClick} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={18} color={C.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Header - Display weight 400 with negative tracking per cursor/DESIGN.md */}
      <View style={styles.greetingBlock}>
        <Text style={styles.sectionTag}>STUDIO DISCOVERY</Text>
        <Text style={styles.greeting}>
          {getGreeting()}{displayName ? `, ${displayName}` : ""}
        </Text>
        <Text style={styles.subGreeting}>
          Find and book top luxury salons & spas
        </Text>
      </View>

      {/* Search Capsule Input */}
      <FloatingSearchCapsule
        onSelectSuggestion={(term) => onSearchSubmit && onSearchSubmit(term)}
        onSearchSubmit={(term) => onSearchSubmit && onSearchSubmit(term)}
      />
    </LinearGradient>
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
      borderRadius: R.sm,
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
      fontSize: 28,
      fontWeight: "400", // Weight 400 per cursor/DESIGN.md
      color: C.ink,
      letterSpacing: -0.72,
      lineHeight: 34,
    },
    subGreeting: {
      fontSize: FS.body,
      fontWeight: "400",
      color: C.body,
      marginTop: S.xxs,
    },
  });
}
