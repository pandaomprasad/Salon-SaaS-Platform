// src/components/AppleSignInButton.jsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { Ionicons } from "@expo/vector-icons";
import { C, FS, FW, R } from "../theme";
import { useAuth } from "../context/AuthContext";

export default function AppleSignInButton({ onSuccess, onError }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithApple } = useAuth();

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setIsAvailable)
      .catch(() => setIsAvailable(false));
  }, []);

  if (!isAvailable && Platform.OS !== "ios") {
    return null;
  }

  const handleAppleSignIn = async () => {
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

  return (
    <TouchableOpacity
      style={styles.appleBtn}
      onPress={handleAppleSignIn}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={C.bg} />
      ) : (
        <View style={styles.appleBtnContent}>
          <Ionicons name="logo-apple" size={18} color={C.bg} style={{ marginRight: 10 }} />
          <Text style={styles.appleBtnText}>Continue with Apple</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  appleBtn: {
    backgroundColor: C.ink,
    borderRadius: R.md,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  appleBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  appleBtnText: {
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
    color: C.bg,
  },
});
