import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { C, FS, FW, R, S } from "../theme";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const isGoogleConfigured = Boolean(webClientId || iosClientId || androidClientId);

export default function GoogleSignInModal({ visible, onClose, onSuccess }) {
  const styles = getStyles();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectUri = useMemo(() => {
    return makeRedirectUri({
      scheme: "customerapp",
      preferLocalhost: true,
    });
  }, []);

  useEffect(() => {
    if (!visible) {
      setError("");
      setLoading(false);
    }
  }, [visible]);

  const handleGoogleOAuthPress = async () => {
    setError("");

    if (!isGoogleConfigured) {
      setError("Google sign-in is not configured yet. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in apps/customer-app/.env.");
      return;
    }

    try {
      setLoading(true);
      const nonce = Math.random().toString(36).substring(2);
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(webClientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=id_token` +
        `&scope=${encodeURIComponent("openid profile email")}` +
        `&nonce=${encodeURIComponent(nonce)}`;

      console.log("[Google Auth Direct URL]", authUrl);
      console.log("[Google Auth Redirect URI]", redirectUri);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      console.log("[Google Auth Result]", JSON.stringify(result, null, 2));

      if (result.type === "success" && result.url) {
        // Extract id_token from URL fragment
        const hash = result.url.split("#")[1] || result.url.split("?")[1] || "";
        const urlParams = new URLSearchParams(hash);
        const idToken = urlParams.get("id_token");

        if (idToken) {
          console.log("[Google Auth Success] Extract ID Token:", idToken.substring(0, 20) + "...");
          const res = await loginWithGoogle({ idToken });
          console.log("[Google Auth Backend Res]", JSON.stringify(res));

          if (res.success) {
            onClose?.();
            onSuccess?.(res);
            return;
          }

          setError(res.error || "Backend authentication failed.");
        } else {
          console.error("[Google Auth Error] No id_token in URL:", result.url);
          setError("Google login did not return an id_token.");
        }
      } else if (result.type === "cancel" || result.type === "dismiss") {
        console.log("[Google Auth Cancelled]", result.type);
      } else {
        setError(`Google login status: ${result.type}`);
      }
    } catch (err) {
      console.error("[Google Auth Exception]", err);
      setError("OAuth Exception: " + (err.message || "Failed to complete Google login"));
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
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
            <Text style={styles.infoTitle}>Google OAuth</Text>
            <Text style={styles.infoText}>
              The browser will open Google sign-in and return to the app after verification.
            </Text>
            <Text style={styles.infoMeta}>Redirect URI: {redirectUri}</Text>
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
                  <Text style={styles.googleText}>Sign in via Google Browser</Text>
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
