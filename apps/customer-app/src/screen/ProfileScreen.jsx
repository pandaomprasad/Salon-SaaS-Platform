// src/screen/ProfileScreen.jsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen({ navigate, onScroll }) {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestIconBox}>
          <Text style={styles.guestIcon}>👤</Text>
        </View>
        <Text style={styles.guestTitle}>Welcome to Salon Platform</Text>
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
        {/* Profile Header Card */}
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

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: S.section }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg, // Canvas warm cream #f7f7f4
  },
  content: {
    paddingHorizontal: S.md,
    paddingTop: 52,
    paddingBottom: 110,
  },

  // Profile Header Card per cursor/DESIGN.md
  headerCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg, // 12px radius per cursor/DESIGN.md
    paddingVertical: S.lg,
    paddingHorizontal: S.md,
    alignItems: "center",
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.main, // Cursor Orange
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.sm,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: FW.semiBold,
    color: "#FFFFFF",
  },
  userName: {
    fontSize: FS.title,
    fontWeight: "400", // Display 400
    color: C.ink,
    letterSpacing: -0.32,
  },
  userEmail: {
    fontSize: FS.bodySm,
    color: C.body,
    marginTop: 2,
  },
  badge: {
    backgroundColor: C.grep, // Mint timeline pill per cursor/DESIGN.md
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    borderRadius: R.pill,
    marginTop: S.sm,
  },
  badgeText: {
    color: C.ink,
    fontSize: 10,
    fontWeight: FW.semiBold,
    letterSpacing: 0.88,
  },

  // Account Actions Card per cursor/DESIGN.md
  cardSection: {
    backgroundColor: C.surface,
    borderRadius: R.lg, // 12px card radius
    padding: S.md,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: {
    ...TYPO.eyebrow,
    color: C.main,
    marginBottom: S.xs,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: S.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  menuIcon: {
    fontSize: 16,
    marginRight: S.sm,
  },
  menuLabel: {
    flex: 1,
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
    color: C.ink,
  },
  menuArrow: {
    color: C.muted,
    fontSize: FS.bodySm,
  },

  // Sign Out Button
  logoutBtn: {
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: "rgba(207, 45, 86, 0.2)",
    paddingVertical: 12,
    borderRadius: R.md, // 8px radius
    alignItems: "center",
  },
  logoutBtnText: {
    color: C.error,
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },

  // Guest State
  guestContainer: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: S.xl,
  },
  guestIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  guestIcon: {
    fontSize: 28,
  },
  guestTitle: {
    fontSize: FS.titleLg,
    fontWeight: "400", // Display 400
    color: C.ink,
    textAlign: "center",
    letterSpacing: -0.32,
  },
  guestSub: {
    fontSize: FS.bodySm,
    color: C.body,
    textAlign: "center",
    marginTop: S.xs,
    marginBottom: S.xl,
    lineHeight: 20,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: C.main, // Cursor Orange
    paddingVertical: 12,
    borderRadius: R.md, // 8px radius
    alignItems: "center",
    marginBottom: S.xs,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },
  secondaryBtn: {
    width: "100%",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    borderRadius: R.md, // 8px radius
    alignItems: "center",
  },
  secondaryBtnText: {
    color: C.ink,
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },
});
