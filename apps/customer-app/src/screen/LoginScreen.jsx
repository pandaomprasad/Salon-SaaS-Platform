// src/screen/LoginScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, SHADOWS } from "../theme";
import { useAuth } from "../context/AuthContext";
import ErrorCardModal from "../components/ErrorCardModal";
import BouncyButton from "../components/BouncyButton";

export default function LoginScreen({ navigate, goBack, routeParams }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (res.success) {
      if (routeParams?.redirectTo && navigate) {
        navigate(routeParams.redirectTo, routeParams.redirectData);
      } else if (navigate) {
        navigate("Profile");
      }
    } else {
      setError(res.error || "Login failed");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Navigation Row */}
        <View style={styles.topNav}>
          {goBack ? (
            <TouchableOpacity style={styles.backCircleBtn} onPress={goBack} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#1A1714" />
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}
        </View>

        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.badgeTag}>
            <Ionicons name="sparkles" size={12} color="#E6CA65" />
            <Text style={styles.badgeTagText}>LUXE ACCESS</Text>
          </View>
          <Text style={styles.brandTitle}>Welcome Back</Text>
          <Text style={styles.brandSub}>
            Sign in to access your appointments & luxury spa privileges.
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <ErrorCardModal
            visible={!!error}
            title="Sign In Error"
            message={error}
            onClose={() => setError("")}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#8E877D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="customer@example.com"
                placeholderTextColor="#A39E93"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#8E877D" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#A39E93"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={19}
                  color="#8E877D"
                />
              </TouchableOpacity>
            </View>
          </View>

          <BouncyButton
            style={styles.submitBtn}
            disabled={loading}
            onPress={handleLogin}
          >
            {loading ? (
              <ActivityIndicator color="#E6CA65" />
            ) : (
              <Text style={styles.submitBtnText}>Sign In</Text>
            )}
          </BouncyButton>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigate && navigate("Register", routeParams)}>
              <Text style={styles.footerLink}> Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F5",
  },
  scrollContent: {
    paddingHorizontal: S.lg,
    paddingTop: Platform.OS === "android" ? 44 : 54,
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: S.lg,
  },
  backCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  brandHeader: {
    marginBottom: S.xl,
  },
  badgeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1714",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    marginBottom: 10,
  },
  badgeTagText: {
    color: "#E6CA65",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1714",
    letterSpacing: -0.6,
  },
  brandSub: {
    fontSize: 13,
    color: "#78716C",
    marginTop: 4,
    lineHeight: 19,
    fontWeight: "400",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: S.md,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8E877D",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F5F0",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#1A1714",
    fontWeight: "500",
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    backgroundColor: "#121016",
    borderRadius: 26,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: S.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnText: {
    color: "#E6CA65",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: S.lg,
  },
  footerText: {
    color: "#8E877D",
    fontSize: 13,
  },
  footerLink: {
    color: "#1A1714",
    fontWeight: "800",
    fontSize: 13,
  },
});
