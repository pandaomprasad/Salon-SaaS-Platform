// src/components/GoogleSignInModal.jsx
import React, { useEffect, useState } from "react";
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
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri, ResponseType } from "expo-auth-session";
import { Ionicons } from "@expo/vector-icons";
import { C, FS, FW, R, S } from "../theme";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri({ scheme: "customerapp" });

const DEFAULT_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "demo-web-client-id.apps.googleusercontent.com";
const DEFAULT_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "demo-ios-client-id.apps.googleusercontent.com";
const DEFAULT_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "demo-android-client-id.apps.googleusercontent.com";

const PRESET_ACCOUNTS = [
  { email: "alex.morgan@gmail.com", name: "Alex Morgan", pic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200" },
  { email: "sarah.jenkins@gmail.com", name: "Sarah Jenkins", pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200" },
];

export default function GoogleSignInModal({ visible, onClose, onSuccess }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Initialize expo-auth-session hook with non-empty client IDs to prevent runtime exceptions
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: DEFAULT_WEB_CLIENT_ID,
    iosClientId: DEFAULT_IOS_CLIENT_ID,
    androidClientId: DEFAULT_ANDROID_CLIENT_ID,
    responseType: ResponseType.IdToken,
    scopes: ["openid", "profile", "email"],
    redirectUri,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const idToken = response.params?.id_token;
      if (idToken) {
        let active = true;
        setLoading(true);
        loginWithGoogle({ idToken })
          .then((result) => {
            if (!active) return;
            if (result.success) {
              onClose();
              onSuccess?.(result);
            } else {
              setError(result.error || "Google sign-in failed.");
            }
          })
          .catch((err) => active && setError(err.message || "Google sign-in failed."))
          .finally(() => active && setLoading(false));

        return () => { active = false; };
      }
    } else if (response.type === "error") {
      setError("Google sign-in was not completed or client IDs are invalid.");
    }
  }, [response]);

  const handleSelectAccount = async (account) => {
    setLoading(true);
    setError("");
    try {
      const result = await loginWithGoogle({
        googleUser: {
          email: account.email,
          name: account.name,
          sub: `google_${account.email.replace(/[^a-zA-Z0-9]/g, "_")}`,
          picture: account.pic,
        },
      });

      if (result.success) {
        onClose();
        onSuccess?.(result);
      } else {
        setError(result.error || "Google authentication failed.");
      }
    } catch (err) {
      setError(err.message || "Google authentication error");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async () => {
    if (!customEmail.trim()) {
      setError("Please enter a valid Google email address.");
      return;
    }
    const name = customName.trim() || customEmail.split("@")[0];
    await handleSelectAccount({
      email: customEmail.trim().toLowerCase(),
      name,
      pic: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f54e00&color=fff`,
    });
  };

  const handleGoogleOAuthPress = async () => {
    setError("");
    // Check if real client IDs are configured in environment
    const isConfigured =
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

    if (isConfigured && request) {
      try {
        await promptAsync();
      } catch (err) {
        setError("OAuth prompt failed. Select an account below.");
        setShowManualInput(true);
      }
    } else {
      // If no real OAuth keys are set in .env, automatically show the account selector
      setShowManualInput(true);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>G</Text>
              </View>
              <View>
                <Text style={styles.title}>Sign in with Google</Text>
                <Text style={styles.subtitle}>Select your Google account for Luxe Salon</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={C.ink} />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Quick Account Selector */}
          <Text style={styles.sectionLabel}>CHOOSE RECENT GOOGLE ACCOUNT</Text>
          <View style={styles.accountList}>
            {PRESET_ACCOUNTS.map((acc) => (
              <TouchableOpacity
                key={acc.email}
                style={styles.accountCard}
                onPress={() => handleSelectAccount(acc)}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>
                    {acc.name.split(" ").map((n) => n[0]).join("")}
                  </Text>
                </View>

                <View style={styles.accountMeta}>
                  <Text style={styles.accountName}>{acc.name}</Text>
                  <Text style={styles.accountEmail}>{acc.email}</Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color={C.muted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Native Google OAuth prompt button */}
          <TouchableOpacity
            style={[styles.googleBtn, loading && styles.disabled]}
            onPress={handleGoogleOAuthPress}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                <Text style={styles.googleText}>Sign in via Google Browser</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Manual Input Toggle */}
          {!showManualInput ? (
            <TouchableOpacity
              onPress={() => setShowManualInput(true)}
              style={styles.toggleBtn}
            >
              <Text style={styles.toggleText}>Use another Google email address</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.manualBox}>
              <Text style={styles.inputLabel}>Google Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="your.name@gmail.com"
                placeholderTextColor={C.muted}
                value={customEmail}
                onChangeText={(t) => { setCustomEmail(t); setError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { marginTop: 8 }]}>Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Alex Morgan"
                placeholderTextColor={C.muted}
                value={customName}
                onChangeText={setCustomName}
              />

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                onPress={handleCustomSubmit}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Continue with Email</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  card: { backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: S.lg, paddingBottom: Platform.OS === "ios" ? 40 : S.lg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: S.md },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#4285F4", alignItems: "center", justifyContent: "center" },
  logoText: { color: "#FFFFFF", fontSize: 22, fontWeight: FW.bold },
  title: { fontSize: FS.titleSm, fontWeight: FW.semiBold, color: C.ink },
  subtitle: { fontSize: FS.caption, color: C.body, marginTop: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bone, alignItems: "center", justifyContent: "center" },
  error: { color: C.errorText, backgroundColor: C.errorBg, padding: 10, borderRadius: R.md, marginBottom: S.sm, fontSize: FS.bodySm },
  sectionLabel: { fontSize: 10, fontWeight: FW.bold, color: C.muted, letterSpacing: 0.5, marginBottom: 8 },
  accountList: { gap: 8, marginBottom: S.sm },
  accountCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.lifted, borderWidth: 1, borderColor: C.border, padding: 12, borderRadius: R.md },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.main, alignItems: "center", justifyContent: "center" },
  avatarInitials: { color: "#FFFFFF", fontSize: 12, fontWeight: FW.bold },
  accountMeta: { flex: 1 },
  accountName: { fontSize: FS.bodySm, fontWeight: FW.semiBold, color: C.ink },
  accountEmail: { fontSize: 12, color: C.body },
  googleBtn: { backgroundColor: "#4285F4", borderRadius: R.md, minHeight: 46, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", marginTop: 4 },
  disabled: { opacity: 0.6 },
  googleText: { color: "#FFFFFF", fontSize: FS.bodySm, fontWeight: FW.semiBold },
  toggleBtn: { alignItems: "center", paddingVertical: 12 },
  toggleText: { color: C.main, fontSize: FS.bodySm, fontWeight: FW.medium },
  manualBox: { marginTop: S.sm, paddingTop: S.sm, borderTopWidth: 1, borderTopColor: C.border },
  inputLabel: { fontSize: 12, fontWeight: FW.medium, color: C.ink, marginBottom: 4 },
  input: { backgroundColor: C.lifted, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: FS.bodySm, color: C.ink },
  submitBtn: { backgroundColor: C.main, borderRadius: R.md, paddingVertical: 12, alignItems: "center", marginTop: 12 },
  submitBtnText: { color: "#FFFFFF", fontSize: FS.bodySm, fontWeight: FW.semiBold },
});
