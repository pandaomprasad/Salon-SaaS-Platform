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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, FS, FW, R, S } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ForgotPasswordModal({ visible, onClose }) {
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSendOtp = async () => {
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const res = await forgotPassword(email.trim().toLowerCase());
    setLoading(false);

    if (res.success) {
      setSuccessMsg("Verification code sent! Please check your email inbox.");
      setStep(2);
    } else {
      setError(res.error || "Failed to send verification code.");
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      setError("Please enter both the 6-digit code and your new password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const res = await resetPassword(email.trim().toLowerCase(), otp.trim(), newPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMsg("Password reset successfully! You can now sign in.");
      setTimeout(() => {
        handleClose();
      }, 1800);
    } else {
      setError(res.error || "Failed to reset password.");
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail("");
    setOtp("");
    setNewPassword("");
    setError("");
    setSuccessMsg("");
    onClose?.();
  };

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, S.lg);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { paddingBottom: bottomPadding }]}>
          <View style={styles.topAccentBar} />

          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={styles.logo}>
                <Ionicons name="key-outline" size={20} color={C.bg} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>
                  {step === 1 ? "Forgot Password" : "Reset Password"}
                </Text>
                <Text style={styles.subtitle}>
                  {step === 1
                    ? "Enter your email to receive a 6-digit code"
                    : "Enter your 6-digit code & new password"}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
              <Ionicons name="close" size={20} color={C.ink} />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {successMsg ? <Text style={styles.success}>{successMsg}</Text> : null}

          {step === 1 ? (
            <View style={styles.form}>
              <Text style={styles.label}>REGISTERED EMAIL</Text>
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

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={C.bg} />
                ) : (
                  <Text style={styles.submitBtnText}>Send Verification Code</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>6-DIGIT VERIFICATION CODE</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color={C.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor={C.dustTaupe}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>

              <Text style={styles.label}>NEW PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={16} color={C.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="At least 8 characters"
                  placeholderTextColor={C.dustTaupe}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={C.bg} />
                ) : (
                  <Text style={styles.submitBtnText}>Confirm Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep(1)} style={styles.resendBtn}>
                <Text style={styles.resendText}>Didn't receive a code? Try again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justify: "flex-end",
  },
  card: {
    backgroundColor: C.surface,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    padding: S.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : S.lg,
    gap: S.md,
  },
  topAccentBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: C.main,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FS.titleSm,
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  subtitle: {
    fontSize: FS.caption,
    color: C.body,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.bone,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    gap: 12,
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: FW.bold,
    color: C.muted,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.lifted,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: FS.bodySm,
    color: C.ink,
  },
  submitBtn: {
    backgroundColor: C.ink,
    borderRadius: R.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: C.bg,
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
  },
  error: {
    color: C.errorText,
    backgroundColor: C.errorBg,
    padding: 10,
    borderRadius: R.md,
    fontSize: FS.bodySm,
  },
  success: {
    color: "#065F46",
    backgroundColor: "#D1FAE5",
    padding: 10,
    borderRadius: R.md,
    fontSize: FS.bodySm,
  },
  resendBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  resendText: {
    fontSize: 12,
    color: C.main,
    fontWeight: FW.medium,
  },
});
