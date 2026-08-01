// src/screen/ProfileScreen.jsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { C, S, SHADOWS } from "../theme";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen({ navigate, onScroll }) {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestIconBox}>
          <Text style={styles.guestIcon}>👤</Text>
        </View>
        <Text style={styles.guestTitle}>Welcome to Salon Luxe</Text>
        <Text style={styles.guestSub}>
          Sign in or create an account to manage your profile, view appointments, and receive special offers.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigate && navigate("Login")}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigate && navigate("Register")}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Aesthetic Minimal Profile Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || "Customer"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>★ LUXE MEMBER</Text>
          </View>
        </View>

        {/* Account Overview Section */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>ACCOUNT OVERVIEW</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigate && navigate("EditProfile")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={styles.menuLabel}>Edit Personal Info</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigate && navigate("Bookings")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>📅</Text>
            <Text style={styles.menuLabel}>My Appointments</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigate && navigate("SavedAddresses")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>📍</Text>
            <Text style={styles.menuLabel}>Saved Locations</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigate && navigate("Explore")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>🔍</Text>
            <Text style={styles.menuLabel}>Explore Salons</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigate && navigate("Onboarding")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>✨</Text>
            <Text style={styles.menuLabel}>View App Intro</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => navigate && navigate("Support")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>🎧</Text>
            <Text style={styles.menuLabel}>Help & Support</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Gentle Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  content: {
    paddingHorizontal: S.lg,
    paddingTop: 54,
    paddingBottom: 40,
  },

  // Profile Header Card
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingVertical: S.xl,
    paddingHorizontal: S.lg,
    alignItems: "center",
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    ...SHADOWS.sm,
  },
  avatarBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#B49460",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.md,
    shadowColor: "#B49460",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1714",
    letterSpacing: -0.4,
  },
  userEmail: {
    fontSize: 13,
    color: "#8E877D",
    marginTop: 3,
  },
  badge: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 18,
    marginTop: S.md,
  },
  badgeText: {
    color: "#B45309",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  // Account Actions Card
  cardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: S.lg,
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1.2,
    marginBottom: S.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.04)",
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1714",
  },
  menuArrow: {
    color: "#A8A29E",
    fontSize: 15,
    fontWeight: "700",
  },

  // Sign Out Button
  logoutBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.18)",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
  },
  logoutBtnText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "800",
  },

  // Guest State
  guestContainer: {
    flex: 1,
    backgroundColor: "#F7F5F0",
    alignItems: "center",
    justifyContent: "center",
    padding: S.xxl,
  },
  guestIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#121016",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.lg,
  },
  guestIcon: {
    fontSize: 32,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1714",
    textAlign: "center",
  },
  guestSub: {
    fontSize: 13,
    color: "#8E877D",
    textAlign: "center",
    marginTop: S.sm,
    marginBottom: S.xxl,
    lineHeight: 18,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#121016",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: S.sm,
  },
  primaryBtnText: {
    color: C.gold,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#1A1714",
    fontSize: 14,
    fontWeight: "800",
  },
});
