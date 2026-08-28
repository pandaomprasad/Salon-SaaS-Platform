// src/components/ComingSoonLocation.jsx
import React, { memo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, FONT_FAMILY } from "../theme";
import { useTheme } from "../context/ThemeContext";
import AppleTouchable from "./AppleTouchable";

const POPULAR_LIVE_CITIES = ["Brahmapur", "Bangalore", "Bhubaneswar", "Mumbai"];

function ComingSoonLocation({
  city = "your city",
  onChangeLocation,
  onSelectQuickCity,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      {/* Visual Accent Badge */}
      <View style={styles.iconCircleOuter}>
        <View style={styles.iconCircleInner}>
          <Ionicons
            name="sparkles"
            size={34}
            color={isDark ? "#FBBF24" : "#D97706"}
          />
        </View>
      </View>

      {/* Pill Badge */}
      <View style={styles.pillTag}>
        <Text style={styles.pillTagText}>✦ COMING SOON</Text>
      </View>

      {/* Title */}
      <Text style={styles.titleText}>
        Coming Soon to{"\n"}
        <Text style={styles.cityNameHighlight}>{city}</Text>
      </Text>

      {/* Reassuring Subtitle */}
      <Text style={styles.descriptionText}>
        We haven't launched our partner salons in {city} yet. Our team is
        rapidly expanding to bring premier stylists and luxury spas here soon!
      </Text>

      {/* Primary Action: Change Location */}
      {onChangeLocation && (
        <AppleTouchable
          style={styles.changeLocBtn}
          onPress={onChangeLocation}
          scaleTo={0.95}
          hapticType="medium"
        >
          <Ionicons name="location" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.changeLocBtnText}>Change Location</Text>
        </AppleTouchable>
      )}

      {/* Quick City Switcher */}
      {onSelectQuickCity && (
        <View style={styles.quickCitiesSection}>
          <Text style={styles.quickCitiesLabel}>EXPLORE ACTIVE CITIES</Text>
          <View style={styles.quickCitiesRow}>
            {POPULAR_LIVE_CITIES.map((c) => (
              <AppleTouchable
                key={c}
                style={styles.quickCityChip}
                onPress={() => onSelectQuickCity(c)}
                scaleTo={0.92}
                hapticType="light"
              >
                <Ionicons
                  name="navigate-outline"
                  size={12}
                  color={isDark ? "#94A3B8" : "#4B5563"}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.quickCityText}>{c}</Text>
              </AppleTouchable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default memo(ComingSoonLocation);

function getStyles(theme, isDark) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
      paddingVertical: 48,
      marginHorizontal: S.md,
      marginVertical: S.lg,
      borderRadius: 28,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
    },
    iconCircleOuter: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: isDark
        ? "rgba(245, 158, 11, 0.12)"
        : "rgba(245, 158, 11, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(245, 158, 11, 0.25)"
        : "rgba(245, 158, 11, 0.2)",
    },
    iconCircleInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDark
        ? "rgba(245, 158, 11, 0.2)"
        : "rgba(245, 158, 11, 0.18)",
      alignItems: "center",
      justifyContent: "center",
    },
    pillTag: {
      backgroundColor: isDark ? "rgba(245, 158, 11, 0.18)" : "#FEF3C7",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: R.pill,
      borderWidth: 1,
      borderColor: isDark ? "rgba(245, 158, 11, 0.35)" : "#FDE68A",
      marginBottom: 14,
    },
    pillTagText: {
      fontSize: 10.5,
      fontWeight: "800",
      color: isDark ? "#FBBF24" : "#B45309",
      letterSpacing: 0.8,
    },
    titleText: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 23,
      fontWeight: "800",
      color: isDark ? "#F8FAFC" : "#1A1A24",
      textAlign: "center",
      lineHeight: 30,
      marginBottom: 10,
    },
    cityNameHighlight: {
      color: C.main || "#C48B36",
    },
    descriptionText: {
      fontSize: 13.5,
      lineHeight: 21,
      color: isDark ? "#94A3B8" : "#64748B",
      textAlign: "center",
      marginBottom: 24,
      maxWidth: 320,
    },
    changeLocBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.ink,
      paddingHorizontal: 22,
      paddingVertical: 13,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 24,
    },
    changeLocBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
      letterSpacing: 0.2,
    },
    quickCitiesSection: {
      alignItems: "center",
      width: "100%",
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
    },
    quickCitiesLabel: {
      fontSize: 10.5,
      fontWeight: "800",
      letterSpacing: 0.8,
      color: isDark ? "#64748B" : "#94A3B8",
      marginBottom: 12,
    },
    quickCitiesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 8,
    },
    quickCityChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
    },
    quickCityText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#E2E8F0" : "#334155",
    },
  });
}
