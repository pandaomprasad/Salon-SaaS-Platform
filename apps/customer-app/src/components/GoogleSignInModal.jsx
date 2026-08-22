import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, FS, FW, R, S } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DEFAULT_WEB_CLIENT_ID = "23232568516-arksroglu4uhc0ogqm94uh3e6cbln9lv.apps.googleusercontent.com";
const DEFAULT_ANDROID_CLIENT_ID = "23232568516-744mk3m6va3up35md674td07vdqseqnh.apps.googleusercontent.com";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || DEFAULT_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || DEFAULT_ANDROID_CLIENT_ID;

const isGoogleConfigured = Boolean(webClientId || iosClientId || androidClientId);

let GoogleSignin = null;
let isGoogleSdkAvailable = false;

try {
  const GoogleModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = GoogleModule.GoogleSignin;
  if (GoogleSignin && typeof GoogleSignin.configure === "function") {
    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });
    isGoogleSdkAvailable = true;
  }
} catch (err) {
  console.warn("[GoogleSignin Native Module Warning]", err?.message || err);
  isGoogleSdkAvailable = false;
}

export default function GoogleSignInModal({ visible, onClose, onSuccess }) {
  const styles = getStyles();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) {
      setError("");
      setLoading(false);
    }
  }, [visible]);

  const handleGoogleOAuthPress = async () => {
    setError("");

    if (!isGoogleSdkAvailable) {
      setError("Google Sign-In native module ('RNGoogleSignin') is not registered in this binary. Please rebuild your APK using 'npx expo run:android'.");
      return;
    }

    if (!isGoogleConfigured) {
      setError("Google sign-in is not configured yet. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in apps/customer-app/.env.");
      return;
    }

    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log("[Google Native SignIn Response]", JSON.stringify(userInfo, null, 2));

      const idToken = userInfo.data?.idToken || userInfo.idToken;

      if (!idToken) {
        setError("Google sign-in completed, but no ID token was received.");
        return;
      }

      console.log("[Google Auth Success] Extract ID Token:", idToken.substring(0, 20) + "...");
      const res = await loginWithGoogle({ idToken });
      console.log("[Google Auth Backend Res]", JSON.stringify(res));

      if (res.success) {
        onClose?.();
        onSuccess?.(res);
        return;
      }

      setError(res.error || "Backend authentication failed.");
    } catch (err) {
      console.error("[Google SignIn Exception]", err);
      if (err.code === "SIGN_IN_CANCELLED" || err.message?.includes("CANCELLED")) {
        console.log("[Google SignIn Cancelled]");
      } else {
        setError("Google sign-in failed: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, S.lg);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { paddingBottom: bottomPadding }]}>
          {/* Top Accent Bar */}
          <View style={styles.topAccentBar} />

          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>G</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Sign in with Google</Text>
                <Text style={styles.subtitle}>Continue securely with your Google account</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={loading}>
              <Ionicons name="close" size={20} color={C.ink} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Native Google Sign-In</Text>
            <Text style={styles.infoText}>
              Google Play Services native prompt will open to sign you in securely.
            </Text>
            <Text style={styles.infoMeta}>Web Client ID: {webClientId.substring(0, 25)}...</Text>
          </View>

          {!isGoogleConfigured ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Setup needed</Text>
              <Text style={styles.warningText}>
                Add `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, or `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in `apps/customer-app/.env`.
              </Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[(loading || !isGoogleConfigured) && styles.disabled]}
            onPress={handleGoogleOAuthPress}
            disabled={loading || !isGoogleConfigured}
            activeOpacity={0.88}
          >
            <View style={styles.googleBtn}>
              {loading ? (
                <ActivityIndicator color={C.bg} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color={C.bg} />
                  <Text style={styles.googleText}>Sign in with Google Account</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function getStyles() {
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: C.surface,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    padding: S.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : S.lg,
    gap: S.md,
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
    paddingRight: 12,
  },
  headerText: {
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
  logoText: {
    color: C.bg,
    fontSize: 22,
    fontWeight: FW.bold,
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
  infoBox: {
    backgroundColor: C.lifted,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    padding: 14,
    gap: 4,
  },
  infoTitle: {
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  infoText: {
    fontSize: FS.bodySm,
    color: C.body,
  },
  infoMeta: {
    fontSize: 12,
    color: C.muted,
  },
  warningBox: {
    backgroundColor: C.infoBg,
    borderWidth: 1,
    borderColor: C.info,
    borderRadius: R.md,
    padding: 14,
    gap: 4,
  },
  warningTitle: {
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
    color: C.info,
  },
  warningText: {
    fontSize: FS.bodySm,
    color: C.info,
  },
  error: {
    color: C.errorText,
    backgroundColor: C.errorBg,
    padding: 10,
    borderRadius: R.md,
    fontSize: FS.bodySm,
  },
  googleBtn: {
    borderRadius: R.md,
    minHeight: 48,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: C.ink,
  },
  disabled: {
    opacity: 0.6,
  },
  googleText: {
    color: C.bg,
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
  },
  topAccentBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: C.main,
  },
  });
}
