// src/components/ThemeToggle.jsx
import React, { useRef } from "react";
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  View,
  Text,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

/**
 * ThemeToggle — An animated pill toggle that switches between light and dark mode.
 * Uses the cursor/DESIGN.md token set: Cursor Orange for active state,
 * hairline-only depth, 8px radius for the container, pill-shaped thumb.
 */
export default function ThemeToggle({ style }) {
  const { isDark, toggleTheme, toggleAnim, theme } = useTheme();

  // Thumb slide: toggleAnim goes 0→1 (light→dark)
  const thumbTranslate = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  // Track color: from surface to a dark surface
  const trackColor = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.hairlineStrong, theme.primary],
  });

  // Icon opacity crossfade
  const sunOpacity = toggleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const moonOpacity = toggleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={toggleTheme}
      style={[styles.row, style]}
      accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
    >
      {/* Label */}
      <View style={styles.labelRow}>
        <Animated.View style={{ opacity: sunOpacity, position: "absolute" }}>
          <Ionicons name="sunny-outline" size={16} color={theme.primary} />
        </Animated.View>
        <Animated.View style={{ opacity: moonOpacity }}>
          <Ionicons name="moon-outline" size={16} color={theme.primary} />
        </Animated.View>
      </View>

      <Text style={[styles.label, { color: theme.body }]}>
        {isDark ? "Dark Mode" : "Light Mode"}
      </Text>

      {/* Pill track + thumb */}
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor: trackColor,
            borderColor: theme.hairline,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: theme.surface,
              transform: [{ translateX: thumbTranslate }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelRow: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  // Pill track: 52×28
  track: {
    width: 52,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    padding: 2,
  },
  // Round thumb: 22×22
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
