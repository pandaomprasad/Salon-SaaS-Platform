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
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import ErrorCardModal from "../components/ErrorCardModal";
import GoogleSignInModal from "../components/GoogleSignInModal";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import AppleSignInButton from "../components/AppleSignInButton";
import GoogleSignInButton from "../components/GoogleSignInButton";
import AppleTouchable from "../components/AppleTouchable";

export default function LoginScreen({ navigate, goBack, routeParams }) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const topInset = Math.max(insets.top, isAndroid ? (StatusBar.currentHeight || 24) : 12) + 8;
  const bottomInset = isAndroid ? Math.max(insets.bottom, 36) + 16 : Math.max(insets.bottom, 20) + 16;

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

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

  const handleGoogleLogin = () => {
    setError("");
    setShowGoogleModal(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset, paddingBottom: bottomInset }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Back Navigation Arrow */}
        <View style={styles.topNav}>
          {goBack ? (
            <AppleTouchable style={styles.backBtn} onPress={goBack} scaleTo={0.9}>
              <Ionicons name="arrow-back" size={22} color={styles.titleText.color} />
            </AppleTouchable>
          ) : <View style={{ width: 36 }} />}
        </View>

        {/* Welcome Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.titleText}>Welcome!</Text>
          <Text style={styles.subtitleText}>Sign in to continue</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <ErrorCardModal
            visible={!!error}
            title="Sign In Error"
            message={error}
            onClose={() => setError("")}
          />

          {/* Email Input */}
          <View style={styles.inputPill}>
            <Ionicons name="mail-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={styles.placeholderColor.color}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputPill}>
            <Ionicons name="lock-closed-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={styles.placeholderColor.color}
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
                size={20}
                color={styles.placeholderColor.color}
              />
            </TouchableOpacity>
          </View>

          {/* Remember Me Checkbox */}
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>

          {/* Primary Action Button: Sign in */}
          <AppleTouchable
            style={styles.signInBtn}
            onPress={handleLogin}
            disabled={loading}
            scaleTo={0.96}
            hapticType="medium"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signInBtnText}>Sign in</Text>
            )}
          </AppleTouchable>

          {/* Or Continue with Divider */}
          <View style={styles.dividerRow}>
            <Text style={styles.dividerText}>Or Continue with</Text>
          </View>

          {/* Full-width Continue with Google Button */}
          <GoogleSignInButton
            onPress={handleGoogleLogin}
            loading={googleLoading}
            disabled={loading}
          />

          {/* Optional Apple Sign-In on iOS / Apple devices */}
          {Platform.OS === "ios" && (
            <AppleSignInButton
              onSuccess={() => {
                if (routeParams?.redirectTo && navigate) {
                  navigate(routeParams.redirectTo, routeParams.redirectData);
                } else if (navigate) {
                  navigate("Profile");
                }
              }}
              onError={(err) => setError(err)}
            />
          )}

          {/* Footer Links: Forgot Password & Sign Up */}
          <View style={styles.footerBlock}>
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => setShowForgotModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>

            <View style={styles.signUpRow}>
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigate && navigate("Register", routeParams)}>
                <Text style={styles.signUpText}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>

          <GoogleSignInModal
            visible={showGoogleModal}
            onClose={() => setShowGoogleModal(false)}
            onSuccess={() => {
              if (routeParams?.redirectTo && navigate) {
                navigate(routeParams.redirectTo, routeParams.redirectData);
              } else if (navigate) {
                navigate("Profile");
              }
            }}
          />

          <ForgotPasswordModal
            visible={showForgotModal}
            onClose={() => setShowForgotModal(false)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStyles(theme, isDark) {
  const accentColor = C.purple || "#6C5CE7";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0D0D0D" : "#FAFAFA",
    },
    scrollContent: {
      paddingHorizontal: 24,
      flexGrow: 1,
    },
    topNav: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#1C1C1E" : "#F0F1F5",
    },
    headerBlock: {
      marginBottom: 32,
    },
    titleText: {
      fontSize: 34,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      letterSpacing: -0.6,
      marginBottom: 6,
    },
    subtitleText: {
      fontSize: 16,
      fontWeight: "400",
      color: isDark ? "#94A3B8" : "#9498A4",
    },
    placeholderColor: {
      color: isDark ? "#64748B" : "#B0B4C0",
    },
    formContainer: {
      flex: 1,
    },
    inputPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1C1C1E" : "#F4F5F8",
      borderRadius: 20,
      paddingHorizontal: 18,
      height: 56,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? "#2A2A2C" : "#EBECEF",
    },
    inputIcon: {
      marginRight: 14,
    },
    input: {
      flex: 1,
      height: "100%",
      fontSize: 15,
      color: isDark ? "#FFFFFF" : "#1A1A24",
      fontWeight: "500",
    },
    eyeBtn: {
      padding: 6,
    },
    rememberRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
      marginTop: 2,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      backgroundColor: isDark ? "#2A2A2C" : "#E0E2E9",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    checkboxChecked: {
      backgroundColor: accentColor,
    },
    rememberText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#A5B4FC" : accentColor,
    },
    signInBtn: {
      height: 56,
      borderRadius: 28,
      backgroundColor: accentColor,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
      marginBottom: 32,
    },
    signInBtnText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    dividerRow: {
      alignItems: "center",
      marginBottom: 24,
    },
    dividerText: {
      fontSize: 13,
      fontWeight: "500",
      color: isDark ? "#64748B" : "#A0A4B0",
    },
    socialRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
      marginBottom: 36,
    },
    socialCard: {
      width: 58,
      height: 58,
      borderRadius: 18,
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: isDark ? "#2A2A2C" : "#EBECEF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    footerBlock: {
      alignItems: "center",
      marginTop: "auto",
      paddingBottom: 0,
    },
    forgotBtn: {
      paddingVertical: 8,
      marginBottom: 0,
    },
    forgotText: {
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#94A3B8" : "#9498A4",
    },
    signUpRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    noAccountText: {
      fontSize: 14,
      color: isDark ? "#94A3B8" : "#9498A4",
    },
    signUpText: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#A5B4FC" : accentColor,
    },
  });
}
