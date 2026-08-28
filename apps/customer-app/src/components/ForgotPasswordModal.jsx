// src/components/ForgotPasswordModal.jsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppleTouchable from "./AppleTouchable";

export default function ForgotPasswordModal({ visible, onClose }) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);
  const { forgotPassword, resetPassword } = useAuth();

  // Flow Sub-Steps:
  // 1: Forgot Password Form ("Send link")
  // 2: "Code has been sent" Popup Modal
  // 3: Reset Password Form ("Change password")
  // 4: "Password Reset Successful" Popup Modal
  const [subStep, setSubStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const newPasswordRef = React.useRef(null);

  const handleSendLink = async () => {
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }
    setError("");
    setLoading(true);

    const res = await forgotPassword(email.trim().toLowerCase());
    setLoading(false);

    if (res.success) {
      // Move to "Code has been sent" popup screen
      setSubStep(2);
    } else {
      setError(res.error || "Failed to send verification code.");
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      setError("Please enter both the verification code and your new password.");
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    setError("");
    setLoading(true);

    const res = await resetPassword(email.trim().toLowerCase(), otp.trim(), newPassword);
    setLoading(false);

    if (res.success) {
      // Move to "Password Reset Successful" popup screen
      setSubStep(4);
    } else {
      setError(res.error || "Failed to reset password.");
    }
  };

  const handleClose = () => {
    setSubStep(1);
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    onClose?.();
  };

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 24);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheetCard}>
          {/* Top Bar with Back Arrow / Close */}
          {subStep === 1 || subStep === 3 ? (
            <View style={styles.topNav}>
              <AppleTouchable
                style={styles.backBtn}
                onPress={subStep === 3 ? () => setSubStep(1) : handleClose}
                scaleTo={0.9}
              >
                <Ionicons name="arrow-back" size={20} color={styles.titleText.color} />
              </AppleTouchable>
            </View>
          ) : null}

          {/* Sub-Step 1: Forgot Password Input Form */}
          {subStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.titleText}>Forgot password</Text>
              <Text style={styles.subtitleText}>
                Please enter your email address to reset your password instruction
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

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

              <AppleTouchable
                style={styles.purpleBtn}
                onPress={handleSendLink}
                disabled={loading}
                scaleTo={0.96}
                hapticType="medium"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.purpleBtnText}>Send link</Text>
                )}
              </AppleTouchable>
            </View>
          )}

          {/* Sub-Step 2: Code Has Been Sent Popup Modal */}
          {subStep === 2 && (
            <View style={styles.popupContainer}>
              <View style={styles.iconCircleMail}>
                <Ionicons name="mail-outline" size={42} color={isDark ? "#FFFFFF" : "#1A1A24"} />
              </View>

              <Text style={styles.popupTitle}>Code has been sent</Text>
              <Text style={styles.popupSubtitle}>
                You'll shortly receive an email with a code to setup a new password.
              </Text>

              <AppleTouchable
                style={styles.purpleBtnDone}
                onPress={() => setSubStep(3)}
                scaleTo={0.96}
                hapticType="medium"
              >
                <Text style={styles.purpleBtnText}>Done</Text>
              </AppleTouchable>
            </View>
          )}

          {/* Sub-Step 3: Reset Password Form */}
          {subStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.titleText}>Reset Password</Text>
              <Text style={styles.subtitleText}>
                Please enter your 6-digit code and a new password
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* 6-Digit OTP Box Input */}
              <OtpBoxInput
                length={6}
                value={otp}
                onChangeOtp={setOtp}
                onComplete={() => newPasswordRef.current?.focus()}
                isDark={isDark}
              />

              {/* New Password */}
              <View style={styles.inputPill}>
                <Ionicons name="lock-closed-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
                <TextInput
                  ref={newPasswordRef}
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter a new password"
                  placeholderTextColor={styles.placeholderColor.color}
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
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

              {/* Confirm Password */}
              <View style={styles.inputPill}>
                <Ionicons name="lock-closed-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your new password"
                  placeholderTextColor={styles.placeholderColor.color}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <AppleTouchable
                style={styles.purpleBtn}
                onPress={handleResetPassword}
                disabled={loading}
                scaleTo={0.96}
                hapticType="medium"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.purpleBtnText}>Change password</Text>
                )}
              </AppleTouchable>
            </View>
          )}

          {/* Sub-Step 4: Password Reset Successful Popup Modal */}
          {subStep === 4 && (
            <View style={styles.popupContainer}>
              <View style={styles.iconCircleSuccess}>
                <Ionicons name="checkmark" size={36} color="#22C55E" />
              </View>

              <Text style={styles.popupTitle}>Password Reset</Text>
              <Text style={styles.popupSubtitle}>
                Your password has been reset successfully
              </Text>

              <AppleTouchable
                style={styles.purpleBtnDone}
                onPress={handleClose}
                scaleTo={0.96}
                hapticType="success"
              >
                <Text style={styles.purpleBtnText}>Sign in</Text>
              </AppleTouchable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function getStyles(theme, isDark) {
  const accentColor = C.purple || "#6C5CE7";

  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-end",
    },
    sheetCard: {
      backgroundColor: isDark ? "#121214" : "#FFFFFF",
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: Platform.OS === "ios" ? 44 : 28,
      minHeight: 420,
    },
    topNav: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? "#1C1C1E" : "#F0F1F5",
      alignItems: "center",
      justifyContent: "center",
    },
    stepContainer: {
      paddingBottom: 10,
    },
    titleText: {
      fontSize: 30,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    subtitleText: {
      fontSize: 15,
      fontWeight: "400",
      color: isDark ? "#94A3B8" : "#9498A4",
      lineHeight: 22,
      marginBottom: 24,
    },
    placeholderColor: {
      color: isDark ? "#64748B" : "#B0B4C0",
    },
    errorText: {
      color: "#EF4444",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      padding: 12,
      borderRadius: 14,
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 16,
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
    purpleBtn: {
      height: 56,
      borderRadius: 28,
      backgroundColor: accentColor,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    purpleBtnText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    // Popup Modal Screens (Image 1 Right & Image 2 Right)
    popupContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
      paddingHorizontal: 12,
    },
    iconCircleMail: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: isDark ? "#1C1C1E" : "#F4F5F8",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    iconCircleSuccess: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(34, 197, 94, 0.12)",
      borderWidth: 2,
      borderColor: "#22C55E",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    popupTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      letterSpacing: -0.4,
      marginBottom: 10,
      textAlign: "center",
    },
    popupSubtitle: {
      fontSize: 15,
      fontWeight: "400",
      color: isDark ? "#94A3B8" : "#9498A4",
      lineHeight: 22,
      textAlign: "center",
      maxWidth: 280,
      marginBottom: 32,
    },
    purpleBtnDone: {
      width: 160,
      height: 50,
      borderRadius: 25,
      backgroundColor: accentColor,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  });
}

function OtpBoxInput({ length = 6, value = "", onChangeOtp, onComplete, isDark }) {
  const inputRefs = React.useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const handleChange = (text, index) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (!cleaned) {
      const nextOtp = value.substring(0, index) + value.substring(index + 1);
      onChangeOtp(nextOtp);
      return;
    }

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, length);
      onChangeOtp(pasted);
      if (pasted.length === length && onComplete) {
        setTimeout(() => onComplete(), 50);
      } else {
        const targetIdx = Math.min(pasted.length - 1, length - 1);
        if (inputRefs.current[targetIdx]) {
          inputRefs.current[targetIdx].focus();
        }
      }
      return;
    }

    const valArr = value.split("");
    valArr[index] = cleaned;
    const newOtp = valArr.join("").slice(0, length);
    onChangeOtp(newOtp);

    if (newOtp.length === length && onComplete) {
      setTimeout(() => onComplete(), 50);
    } else if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
        const nextOtp = value.substring(0, index - 1) + value.substring(index);
        onChangeOtp(nextOtp);
      }
    }
  };

  return (
    <View style={otpStyles.container}>
      {Array.from({ length }).map((_, i) => {
        const isFilled = Boolean(digits[i]);
        return (
          <View
            key={i}
            style={[
              otpStyles.box,
              {
                backgroundColor: isDark ? "#2C2C2E" : "#F5F6F8",
                borderColor: isFilled ? "#5CD65C" : isDark ? "#3A3A3C" : "#E4E4E8",
              },
            ]}
          >
            <TextInput
              ref={(ref) => (inputRefs.current[i] = ref)}
              style={[
                otpStyles.boxText,
                { color: isDark ? "#FFFFFF" : "#18181B" },
              ]}
              keyboardType="number-pad"
              maxLength={i === 0 ? length : 1}
              selectTextOnFocus
              value={digits[i]}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
            />
          </View>
        );
      })}
    </View>
  );
}

const otpStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 14,
    gap: 8,
  },
  box: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  boxText: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
    padding: 0,
  },
});
