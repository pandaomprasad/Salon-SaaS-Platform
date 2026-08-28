// src/screen/MapScreen.jsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const TOP_INSET = Platform.OS === "ios" ? 52 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36);

export default function MapScreen({ navigate, onScroll }) {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map &amp; Nearby Salons</Text>
      </View>

      <View style={styles.centerContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="map" size={42} color="#FFFFFF" />
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>UNDER DEVELOPMENT</Text>
        </View>

        <Text style={styles.titleText}>To be done</Text>
        <Text style={styles.subText}>
          Live interactive map exploration and GPS salon locator will be available in the upcoming update.
        </Text>
      </View>
    </View>
  );
}

function getStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121216" : "#FFFFFF",
    },
    header: {
      paddingTop: TOP_INSET,
      paddingHorizontal: 24,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#2A2A34" : "#EFEFF4",
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#18181B",
      letterSpacing: -0.3,
    },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingBottom: 80,
    },
    iconCircle: {
      width: 76,
      height: 76,
      borderRadius: 24,
      backgroundColor: "#6C5CE7",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      shadowColor: "#6C5CE7",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: "rgba(108, 92, 231, 0.12)",
      marginBottom: 12,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#6C5CE7",
      letterSpacing: 1,
    },
    titleText: {
      fontSize: 24,
      fontWeight: "900",
      color: isDark ? "#FFFFFF" : "#18181B",
      textAlign: "center",
      marginBottom: 8,
    },
    subText: {
      fontSize: 13.5,
      fontWeight: "400",
      color: isDark ? "#9999A0" : "#71717A",
      textAlign: "center",
      lineHeight: 21,
    },
  });
}
