// src/screen/ProfileScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFavorites } from "../context/FavoritesContext";
import ThemeToggle from "../components/ThemeToggle";

export default function ProfileScreen({ navigate, onScroll }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme } = useTheme();
  const { favorites, toggleFavorite } = useFavorites();
  const [showFavModal, setShowFavModal] = useState(false);

  if (!isAuthenticated) {
    return (
      <View style={[styles.guestContainer, { backgroundColor: theme.canvas }]}>
        <View style={[styles.guestIconBox, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
          <Text style={styles.guestIcon}>👤</Text>
        </View>
        <Text style={[styles.guestTitle, { color: theme.ink }]}>Welcome to Salon Platform</Text>
        <Text style={[styles.guestSub, { color: theme.body }]}>
          Sign in or create an account to manage your profile, view appointments, and receive special offers.
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigate && navigate("Login")}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: theme.surface, borderColor: theme.hairline }]}
          onPress={() => navigate && navigate("Register")}
          activeOpacity={0.85}
        >
          <Text style={[styles.secondaryBtnText, { color: theme.ink }]}>Create Account</Text>
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
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Profile Header Card */}
        <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
          <View style={[styles.avatarBox, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.userName, { color: theme.ink }]}>{user?.name || "Customer"}</Text>
          <Text style={[styles.userEmail, { color: theme.body }]}>{user?.email}</Text>

          <View style={[styles.badge, { backgroundColor: theme.grep }]}>
            <Text style={[styles.badgeText, { color: theme.ink }]}>★ LUXE MEMBER</Text>
          </View>
        </View>

        {/* Account Overview Section */}
        <View style={[styles.cardSection, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>ACCOUNT OVERVIEW</Text>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("EditProfile")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={[styles.menuLabel, { color: theme.ink }]}>Edit Personal Info</Text>
            <Text style={[styles.menuArrow, { color: theme.muted }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("Bookings")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>📅</Text>
            <Text style={[styles.menuLabel, { color: theme.ink }]}>My Appointments</Text>
            <Text style={[styles.menuArrow, { color: theme.muted }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => setShowFavModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>❤️</Text>
            <Text style={[styles.menuLabel, { color: theme.ink }]}>Saved Favorites ({favorites.length})</Text>
            <Text style={[styles.menuArrow, { color: theme.muted }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("SavedAddresses")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>📍</Text>
            <Text style={[styles.menuLabel, { color: theme.ink }]}>Saved Locations</Text>
            <Text style={[styles.menuArrow, { color: theme.muted }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("Explore")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>🔍</Text>
            <Text style={[styles.menuLabel, { color: theme.ink }]}>Explore Salons</Text>
            <Text style={[styles.menuArrow, { color: theme.muted }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("Onboarding")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>✨</Text>
            <Text style={[styles.menuLabel, { color: theme.ink }]}>View App Intro</Text>
            <Text style={[styles.menuArrow, { color: theme.muted }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("Support")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>🎧</Text>
            <Text style={[styles.menuLabel, { color: theme.ink }]}>Help &amp; Support</Text>
            <Text style={[styles.menuArrow, { color: theme.muted }]}>→</Text>
          </TouchableOpacity>

          {/* Theme toggle row — no border on last item */}
          <View style={[styles.menuItem, { borderBottomWidth: 0, paddingVertical: S.sm + 2 }]}>
            <ThemeToggle />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: theme.errorBg, borderColor: "rgba(207, 45, 86, 0.2)" }]}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutBtnText, { color: theme.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: S.section }} />
      </ScrollView>

      {/* Saved Favorites Modal */}
      <Modal visible={showFavModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: S.md, maxHeight: "80%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: S.md }}>
              <Text style={{ fontSize: FS.titleSm, fontWeight: FW.semiBold, color: theme.ink }}>Saved Favorites ({favorites.length})</Text>
              <TouchableOpacity onPress={() => setShowFavModal(false)}>
                <Ionicons name="close" size={24} color={theme.ink} />
              </TouchableOpacity>
            </View>

            {favorites.length === 0 ? (
              <View style={{ paddingVertical: S.xl, alignItems: "center" }}>
                <Ionicons name="heart-dislike-outline" size={32} color={C.muted} />
                <Text style={{ marginTop: S.xs, color: C.muted, fontSize: FS.bodySm }}>No saved salons yet.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {favorites.map((fav) => (
                  <TouchableOpacity
                    key={fav._id || fav.id}
                    style={{ flexDirection: "row", alignItems: "center", paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.borderLight }}
                    onPress={() => {
                      setShowFavModal(false);
                      if (navigate) navigate("SalonDetail", { salon: fav });
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: FS.bodySm, fontWeight: FW.semiBold, color: theme.ink }}>{fav.name}</Text>
                      <Text style={{ fontSize: 12, color: C.muted }}>{fav.description || "Luxury Salon & Spa"}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleFavorite(fav)} style={{ padding: 4 }}>
                      <Ionicons name="heart" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
