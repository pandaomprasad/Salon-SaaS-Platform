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
import * as Google from "expo-auth-session/providers/google";
import { LinearGradient } from "expo-linear-gradient";
import { makeRedirectUri, ResponseType } from "expo-auth-session";
import { Ionicons } from "@expo/vector-icons";
import { C, FS, FW, R, S } from "../theme";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const isGoogleConfigured = Boolean(webClientId || iosClientId || androidClientId);
const redirectUri = makeRedirectUri({ scheme: "customerapp" });

export default function GoogleSignInModal({ visible, onClose, onSuccess }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const oauthConfig = useMemo(() => {
    if (!isGoogleConfigured) return null;

    return {
      clientId: webClientId,
      iosClientId,
      androidClientId,
      responseType: ResponseType.IdToken,
      scopes: ["openid", "profile", "email"],
      redirectUri,
    };
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest(
    oauthConfig || {
      clientId: "placeholder.apps.googleusercontent.com",
      responseType: ResponseType.IdToken,
      scopes: ["openid", "profile", "email"],
      redirectUri,
    },
  );

  useEffect(() => {
    if (!visible) {
      setError("");
      setLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const idToken = response.params?.id_token;
      if (!idToken) {
        setError("Google sign-in did not return an ID token.");
        return;
      }

      let active = true;
      setLoading(true);

      loginWithGoogle({ idToken })
        .then((result) => {
          if (!active) return;

          if (result.success) {
            onClose?.();
            onSuccess?.(result);
            return;
          }

          setError(result.error || "Google sign-in failed.");
        })
        .catch((err) => {
          if (active) {
            setError(err.message || "Google sign-in failed.");
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }

    if (response.type === "error") {
      setError("Google sign-in could not be completed. Please check the Google client IDs.");
      setLoading(false);
    }

    if (response.type === "dismiss" || response.type === "cancel") {
      setLoading(false);
    }
  }, [loginWithGoogle, onClose, onSuccess, response]);

  const handleGoogleOAuthPress = async () => {
    setError("");

    if (!isGoogleConfigured) {
      setError("Google sign-in is not configured yet. Add the EXPO_PUBLIC_GOOGLE client IDs in apps/customer-app/.env.");
      return;
    }

    if (!request) {
      setError("Google sign-in is still initializing. Please try again.");
      return;
    }

    try {
      setLoading(true);
      await promptAsync();
    } catch (err) {
      setLoading(false);
      setError(err.message || "Could not open the Google sign-in page.");
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Top Multi-Color Gradient Bar */}
          <LinearGradient
            colors={["#4285F4", "#EA4335", "#FBBC05", "#34A853"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topAccentBar}
          />

          <View style={styles.header}>
            <View style={styles.brand}>
              <LinearGradient
                colors={["#4285F4", "#2B6CB0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logo}
              >
                <Text style={styles.logoText}>G</Text>
              </LinearGradient>
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
            <LinearGradient
              colors={["#4285F4", "#3367D6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.googleBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                  <Text style={styles.googleText}>Sign in via Google Browser</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#FFFFFF",
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
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#F6C453",
    borderRadius: R.md,
    padding: 14,
    gap: 4,
  },
  warningTitle: {
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
    color: "#8A5A00",
  },
  warningText: {
    fontSize: FS.bodySm,
    color: "#8A5A00",
  },
  error: {
    color: C.errorText,
    backgroundColor: C.errorBg,
    padding: 10,
    borderRadius: R.md,
    fontSize: FS.bodySm,
  },
  googleBtnGradient: {
    borderRadius: R.md,
    minHeight: 48,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  googleText: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
  },
});
