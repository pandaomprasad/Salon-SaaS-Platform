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
} from "react-native";
import { C, S, SHADOWS } from "../theme";
import { useAuth } from "../context/AuthContext";
import ErrorCardModal from "../components/ErrorCardModal";

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
      <View style={styles.header}>
        {goBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSub}>Join Salon Luxe for easy bookings & exclusive perks</Text>
      </View>

      <View style={styles.formCard}>
      <ErrorCardModal
        visible={!!error}
        title="Registration Error"
        message={error}
        onClose={() => setError("")}
      />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Jane Doe"
            placeholderTextColor={C.muted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="jane@example.com"
            placeholderTextColor={C.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            placeholderTextColor={C.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a strong password"
            placeholderTextColor={C.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          disabled={loading}
          onPress={handleRegister}
        >
          {loading ? (
            <ActivityIndicator color={C.dark} />
          ) : (
            <Text style={styles.submitBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

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
    backgroundColor: C.bg,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: C.dark,
    paddingTop: 60,
    paddingHorizontal: S.lg,
    paddingBottom: S.xxl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    marginBottom: S.sm,
  },
  backText: {
    color: C.gold,
    fontSize: 14,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
  },
  headerSub: {
    fontSize: 13,
    color: C.muted,
    marginTop: 4,
  },
  formCard: {
    marginHorizontal: S.lg,
    marginTop: -20,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: S.lg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    ...SHADOWS.md,
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: S.md,
    borderRadius: 10,
    marginBottom: S.md,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: S.md,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: S.md,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  submitBtn: {
    backgroundColor: C.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: S.sm,
  },
  submitBtnText: {
    color: C.dark,
    fontSize: 15,
    fontWeight: "900",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: S.lg,
  },
  footerText: {
    color: C.muted,
    fontSize: 13,
  },
  footerLink: {
    color: C.dark,
    fontWeight: "800",
    fontSize: 13,
  },
});
