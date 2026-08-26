// src/components/GoogleSignInButton.jsx
import React from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import SpringTouchable from "./SpringTouchable";
import { R } from "../theme";

export default function GoogleSignInButton({ onPress, loading = false, disabled = false }) {
  const { isDark } = useTheme();

  return (
    <SpringTouchable
      style={[
        styles.googleBtn,
        isDark ? styles.googleBtnDark : styles.googleBtnLight,
        disabled && { opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.96}
      hapticType="medium"
    >
      {loading ? (
        <ActivityIndicator color={isDark ? "#FFFFFF" : "#1A1A24"} size="small" />
      ) : (
        <View style={styles.contentRow}>
          <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 12 }} />
          <Text style={[styles.btnText, { color: isDark ? "#FFFFFF" : "#1A1A24" }]}>
            Continue with Google
          </Text>
        </View>
      )}
    </SpringTouchable>
  );
}

const styles = StyleSheet.create({
  googleBtn: {
    height: 54,
    borderRadius: R.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    paddingHorizontal: 20,
    borderWidth: 1.5,
  },
  googleBtnLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  googleBtnDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#2A2A2C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
