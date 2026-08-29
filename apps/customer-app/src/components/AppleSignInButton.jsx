// src/components/AppleSignInButton.jsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform, Text, ActivityIndicator } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { Ionicons } from "@expo/vector-icons";
import { C, R } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import SpringTouchable from "./SpringTouchable";

export default function AppleSignInButton({ onSuccess, onError, variant = "full" }) {
  const { isDark } = useTheme();
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithApple } = useAuth();

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setIsAvailable)
      .catch(() => setIsAvailable(false));
  }, []);

  const handleAppleSignIn = async () => {
    if (Platform.OS !== "ios" || !isAvailable) {
      onError?.("Apple Sign-In is only available on iOS devices.");
      return;
    }

    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log("[Apple SignIn Credential]", credential);

      const res = await loginWithApple({
        identityToken: credential.identityToken,
        user: credential.user,
        fullName: credential.fullName,
        email: credential.email,
      });

      setLoading(false);

      if (res.success) {
        onSuccess?.(res);
      } else {
        onError?.(res.error || "Apple sign-in failed on server.");
      }
    } catch (err) {
      setLoading(false);
      if (err.code === "ERR_REQUEST_CANCELED") {
        console.log("[Apple SignIn Cancelled by User]");
      } else {
        console.error("[Apple SignIn Exception]", err);
        onError?.(err.message || "Failed to sign in with Apple.");
      }
    }
  };

  if (variant === "circle") {
    return (
      <SpringTouchable
        style={[
          styles.circleBtn,
          isDark ? styles.appleBtnDark : styles.appleBtnLight,
        ]}
        onPress={handleAppleSignIn}
        disabled={loading}
        scaleTo={0.92}
        hapticType="medium"
      >
        {loading ? (
          <ActivityIndicator color={isDark ? "#121212" : "#FFFFFF"} size="small" />
        ) : (
          <Ionicons
            name="logo-apple"
            size={26}
            color={isDark ? "#121212" : "#FFFFFF"}
          />
        )}
      </SpringTouchable>
    );
  }

  return (
    <SpringTouchable
      style={[
        styles.appleBtn,
        isDark ? styles.appleBtnDark : styles.appleBtnLight,
      ]}
      onPress={handleAppleSignIn}
      disabled={loading}
      scaleTo={0.96}
      hapticType="medium"
    >
      {loading ? (
        <ActivityIndicator color={isDark ? "#121212" : "#FFFFFF"} size="small" />
      ) : (
        <View style={styles.appleBtnContent}>
          <Ionicons
            name="logo-apple"
            size={22}
            color={isDark ? "#121212" : "#FFFFFF"}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.appleBtnText, { color: isDark ? "#121212" : "#FFFFFF" }]}>
            Continue with Apple
          </Text>
        </View>
      )}
    </SpringTouchable>
  );
}

const styles = StyleSheet.create({
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  appleBtn: {
    height: 54,
    borderRadius: R.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  appleBtnLight: {
    backgroundColor: "#121212",
    borderColor: "#121212",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  appleBtnDark: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  appleBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  appleBtnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
