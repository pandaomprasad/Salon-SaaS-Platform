// src/screen/RegisterScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import ErrorCardModal from "../components/ErrorCardModal";
import GoogleSignInModal from "../components/GoogleSignInModal";
import GoogleSignInButton from "../components/GoogleSignInButton";
import AppleTouchable from "../components/AppleTouchable";

export default function RegisterScreen({ navigate, goBack, routeParams }) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const topInset = Math.max(insets.top, isAndroid ? (StatusBar.currentHeight || 24) : 12) + 8;
  const bottomInset = isAndroid ? Math.max(insets.bottom, 36) + 16 : Math.max(insets.bottom, 20) + 16;

  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await register(name.trim(), email.trim().toLowerCase(), password, phone.trim());
    setLoading(false);

    if (res.success) {
      if (routeParams?.redirectTo && navigate) {
        navigate(routeParams.redirectTo, routeParams.redirectData);
      } else if (navigate) {
        navigate("Profile");
      }
    } else {
      setError(res.error || "Registration failed");
    }
  };

  const handleGoogleLogin = () => {
    setError("");
    setShowGoogleModal(true);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset, paddingBottom: bottomInset }]}
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

      {/* Header */}
      <View style={styles.headerBlock}>
        <Text style={styles.titleText}>Create Account</Text>
        <Text style={styles.subtitleText}>Join for instant bookings & exclusive partner perks</Text>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        <ErrorCardModal
          visible={!!error}
          title="Registration Error"
          message={error}
          onClose={() => setError("")}
        />

        {/* Full Name Input */}
        <View style={styles.inputPill}>
          <Ionicons name="person-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={styles.placeholderColor.color}
            value={name}
            onChangeText={setName}
          />
        </View>

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

        {/* Phone Input (Optional) */}
        <View style={styles.inputPill}>
          <Ionicons name="call-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number (Optional)"
            placeholderTextColor={styles.placeholderColor.color}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
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

        {/* Primary Action Button: Sign Up */}
        <AppleTouchable
          style={styles.signUpBtn}
          onPress={handleRegister}
          disabled={loading}
          scaleTo={0.96}
          hapticType="medium"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.signUpBtnText}>Create Account</Text>
          )}
        </AppleTouchable>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <Text style={styles.dividerText}>Or Continue with</Text>
        </View>

        {/* Full-width Continue with Google Button */}
        <GoogleSignInButton
          onPress={handleGoogleLogin}
          disabled={loading}
        />

        {/* Social Buttons */}
        <View style={styles.socialRow}>
          <AppleTouchable style={styles.socialCard} onPress={() => setError("Facebook login available soon.")} scaleTo={0.92}>
            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
          </AppleTouchable>

          <AppleTouchable style={styles.socialCard} onPress={handleGoogleLogin} scaleTo={0.92} hapticType="medium">
            <Ionicons name="logo-google" size={24} color="#EA4335" />
          </AppleTouchable>

          <AppleTouchable style={styles.socialCard} onPress={() => setError("Twitter login available soon.")} scaleTo={0.92}>
            <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
          </AppleTouchable>
        </View>

        {/* Footer Link */}
        <View style={styles.footerBlock}>
          <View style={styles.signInRow}>
            <Text style={styles.hasAccountText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigate && navigate("Login", routeParams)}>
              <Text style={styles.signInText}>Sign In</Text>
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
      </View>
    </ScrollView>
  );
}

function getStyles(theme, isDark) {
  const accentColor = "#6C5CE7";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0D0D0D" : "#FAFAFA",
    },
    content: {
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
      marginBottom: 28,
    },
    titleText: {
      fontSize: 34,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      letterSpacing: -0.6,
      marginBottom: 6,
    },
    subtitleText: {
      fontSize: 15,
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
      height: 54,
      marginBottom: 14,
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
    signUpBtn: {
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
      marginTop: 8,
      marginBottom: 28,
    },
    signUpBtnText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    dividerRow: {
      alignItems: "center",
      marginBottom: 20,
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
      marginBottom: 28,
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
      paddingBottom: 16,
    },
    signInRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    hasAccountText: {
      fontSize: 14,
      color: isDark ? "#94A3B8" : "#9498A4",
    },
    signInText: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#A5B4FC" : accentColor,
    },
  });
}
