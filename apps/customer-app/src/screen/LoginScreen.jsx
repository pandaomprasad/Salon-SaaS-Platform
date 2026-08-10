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
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useAuth } from "../context/AuthContext";
import ErrorCardModal from "../components/ErrorCardModal";
import BouncyButton from "../components/BouncyButton";
import GoogleSignInModal from "../components/GoogleSignInModal";

export default function LoginScreen({ navigate, goBack, routeParams }) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const [showGoogleModal, setShowGoogleModal] = useState(false);

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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Navigation Row */}
        <View style={styles.topNav}>
          {goBack ? (
            <TouchableOpacity style={styles.backCircleBtn} onPress={goBack} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={18} color={C.ink} />
            </TouchableOpacity>
          ) : <View style={{ width: 36 }} />}
        </View>

        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.badgeTag}>
            <Text style={styles.badgeTagText}>MEMBER ACCESS</Text>
          </View>
          <Text style={styles.brandTitle}>Welcome Back</Text>
          <Text style={styles.brandSub}>
            Sign in to access your appointments & luxury studio privileges.
          </Text>
        </View>

        {/* Form Card per cursor/DESIGN.md */}
        <View style={styles.formCard}>
          <ErrorCardModal
            visible={!!error}
            title="Sign In Error"
            message={error}
            onClose={() => setError("")}
          />

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={googleLoading || loading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color={C.ink} />
            ) : (
              <View style={styles.googleBtnContent}>
                <Ionicons name="logo-google" size={18} color="#4285F4" style={{ marginRight: 10 }} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SIGN IN WITH EMAIL</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={16} color={C.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="customer@example.com"
                placeholderTextColor={C.dustTaupe}
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
              <Ionicons name="lock-closed-outline" size={16} color={C.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={C.dustTaupe}
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
                  size={18}
                  color={C.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* button-primary: Cursor Orange #f54e00, 8px radius */}
          <BouncyButton
            style={styles.submitBtn}
            disabled={loading}
            onPress={handleLogin}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg, // Canvas warm cream #f7f7f4
  },
  scrollContent: {
    paddingHorizontal: S.md,
    paddingTop: Platform.OS === "android" ? 44 : 52,
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: S.md,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: R.md,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  brandHeader: {
    marginBottom: S.lg,
  },
  badgeTag: {
    backgroundColor: C.grep, // Mint timeline pill per cursor/DESIGN.md
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: R.pill,
    marginBottom: S.xs,
  },
  badgeTagText: {
    color: C.ink,
    fontSize: 10,
    fontWeight: FW.semiBold,
    letterSpacing: 0.88,
  },
  brandTitle: {
    fontSize: FS.hero,
    fontWeight: "400", // Display 400
    color: C.ink,
    letterSpacing: -0.72,
  },
  brandSub: {
    fontSize: FS.bodySm,
    color: C.body,
    marginTop: S.xxs,
    lineHeight: 20,
  },
  // feature-card per cursor/DESIGN.md: 12px radius, white surface, hairline border
  formCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg, // 12px card radius
    padding: S.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  inputGroup: {
    marginBottom: S.sm + 2,
  },
  label: {
    ...TYPO.eyebrow,
    marginBottom: S.xxs,
  },
  // text-input per cursor/DESIGN.md: 8px radius, height 44px
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: R.md, // 8px radius
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: S.sm,
    height: 44,
  },
  inputIcon: {
    marginRight: S.xs,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: FS.bodySm,
    color: C.ink,
    fontWeight: FW.regular,
  },
  eyeBtn: {
    padding: S.xxs,
  },
  // button-primary per cursor/DESIGN.md: Cursor Orange #f54e00, 8px radius
  submitBtn: {
    backgroundColor: C.main, // Cursor Orange
    borderRadius: R.md, // 8px radius
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: S.sm,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: S.md,
  },
  footerText: {
    color: C.muted,
    fontSize: FS.bodySm,
  },
  footerLink: {
    color: C.main,
    fontWeight: FW.medium,
    fontSize: FS.bodySm,
  },
  googleBtn: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.sm,
  },
  googleBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleBtnText: {
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: S.md,
    marginTop: S.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: FW.semiBold,
    color: C.muted,
    marginHorizontal: S.xs,
    letterSpacing: 0.6,
  },
});
