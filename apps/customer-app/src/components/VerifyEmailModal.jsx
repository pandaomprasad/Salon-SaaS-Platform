// src/components/VerifyEmailModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO, FF } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { authService } from "../services/authService";

export default function VerifyEmailModal({ visible, email, onClose, onVerified }) {
  const { isDark } = useTheme();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setResendStatus("");
    try {
      await authService.resendVerificationLink(email);
      setResendStatus("Verification link resent! Check your inbox.");
      setCooldown(45);
    } catch (err) {
      setResendStatus(err.message || "Failed to resend link. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const res = await authService.getProfile();
      const user = res.data?.user || res.data;
      if (user?.isEmailVerified || user?.email_verified) {
        if (onVerified) onVerified();
        if (onClose) onClose();
      } else {
        setResendStatus("Email not verified yet. Please tap the link in your inbox.");
      }
    } catch (e) {
      setResendStatus("Unable to check status. Try again.");
    } finally {
      setChecking(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF", borderColor: isDark ? "#2A2A2C" : "#E8E8E0" }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={isDark ? "#F4F4F2" : "#121212"} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name="mail-unread" size={32} color={C.main} />
          </View>

          <Text style={[styles.title, { color: isDark ? "#F4F4F2" : "#121212" }]}>
            Check Your Inbox
          </Text>

          <Text style={[styles.description, { color: isDark ? "#A0A09C" : "#666666" }]}>
            We've sent a verification link to{"\n"}
            <Text style={{ color: C.main, fontWeight: "700" }}>{email || "your email"}</Text>.
            Tap the link to activate your ST CUT account.
          </Text>

          {resendStatus !== "" && (
            <Text style={[styles.statusMessage, { color: resendStatus.includes("resent") ? C.main : "#E53E3E" }]}>
              {resendStatus}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: C.main }]}
            onPress={handleCheckStatus}
            disabled={checking}
            activeOpacity={0.85}
          >
            {checking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>I've Verified My Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendBtn, cooldown > 0 && { opacity: 0.6 }]}
            onPress={handleResend}
            disabled={cooldown > 0 || resending}
            activeOpacity={0.8}
          >
            {resending ? (
              <ActivityIndicator size="small" color={C.main} />
            ) : (
              <Text style={[styles.resendText, { color: isDark ? "#F4F4F2" : "#121212" }]}>
                {cooldown > 0 ? `Resend Link (${cooldown}s)` : "Resend Verification Link"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: S.md,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: R.xl,
    padding: S.xl,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: S.md,
    right: S.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(196, 139, 54, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.md,
    marginTop: S.xs,
  },
  title: {
    fontFamily: FF.display,
    fontSize: 22,
    marginBottom: S.xs,
    textAlign: "center",
  },
  description: {
    fontFamily: FF.body,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: S.md,
  },
  statusMessage: {
    fontFamily: FF.body,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: S.md,
    textAlign: "center",
  },
  primaryBtn: {
    width: "100%",
    height: 48,
    borderRadius: R.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.xs,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  resendBtn: {
    paddingVertical: S.xs,
  },
  resendText: {
    fontFamily: FF.body,
    fontSize: 13,
    fontWeight: "600",
  },
});
