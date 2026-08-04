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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useAuth } from "../context/AuthContext";
import ErrorCardModal from "../components/ErrorCardModal";
import BouncyButton from "../components/BouncyButton";

export default function RegisterScreen({ navigate, goBack, routeParams }) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        {goBack ? (
          <TouchableOpacity style={styles.backCircleBtn} onPress={goBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color={C.ink} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badgeTag}>
          <Text style={styles.badgeTagText}>JOIN PLATFORM</Text>
        </View>
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSub}>Join for instant bookings & exclusive partner perks</Text>
      </View>

      {/* Form Card per cursor/DESIGN.md */}
      <View style={styles.formCard}>
        <ErrorCardModal
          visible={!!error}
          title="Registration Error"
          message={error}
          onClose={() => setError("")}
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Jane Doe"
            placeholderTextColor={C.dustTaupe}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="jane@example.com"
            placeholderTextColor={C.dustTaupe}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PHONE NUMBER (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            placeholderTextColor={C.dustTaupe}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a strong password"
            placeholderTextColor={C.dustTaupe}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* button-primary: Cursor Orange #f54e00, 8px radius */}
        <BouncyButton
          style={styles.submitBtn}
          disabled={loading}
          onPress={handleRegister}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Create Account</Text>
          )}
        </BouncyButton>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigate && navigate("Login", routeParams)}>
            <Text style={styles.footerLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg, // Canvas warm cream #f7f7f4
  },
  content: {
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
  header: {
    marginBottom: S.lg,
  },
  badgeTag: {
    backgroundColor: C.read, // Blue timeline pill per cursor/DESIGN.md
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
  headerTitle: {
    fontSize: FS.hero,
    fontWeight: "400", // Display 400
    color: C.ink,
    letterSpacing: -0.72,
  },
  headerSub: {
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
  input: {
    backgroundColor: C.surface,
    borderRadius: R.md, // 8px radius
    paddingHorizontal: S.sm,
    height: 44,
    fontSize: FS.bodySm,
    color: C.ink,
    borderWidth: 1,
    borderColor: C.border,
  },
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
});
