// src/screen/ProfileScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C, S, FS, FW, R } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFavorites } from "../context/FavoritesContext";
import ThemeToggle from "../components/ThemeToggle";

const TOP_INSET = Platform.OS === "ios" ? 56 : (StatusBar.currentHeight ? StatusBar.currentHeight + 14 : 40);

export default function ProfileScreen({ navigate, onScroll }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { favorites } = useFavorites();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "G";

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Top Header Title */}
        <View style={styles.topTitleBox}>
          <Text style={[styles.screenTitle, { color: theme.ink }]}>Account Profile</Text>
          <Text style={[styles.screenSub, { color: theme.muted }]}>
            Manage preferences, bookings &amp; security
          </Text>
        </View>

        {/* ───────────── HERO HEADER CARD ───────────── */}
        {isAuthenticated ? (
          <LinearGradient
            colors={isDark ? ["#1e1b4b", "#0f172a"] : ["#fff7ed", "#ffedd5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroCard,
              {
                borderColor: isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(245, 78, 0, 0.2)",
              },
            ]}
          >
            <View style={styles.heroRow}>
              <LinearGradient
                colors={["#f54e00", "#d04200"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>

              <View style={styles.heroMeta}>
                <View style={styles.vipBadge}>
                  <Ionicons name="sparkles" size={12} color="#f54e00" style={{ marginRight: 4 }} />
                  <Text style={styles.vipBadgeText}>LUXE MEMBER</Text>
                </View>
                <Text style={[styles.heroName, { color: theme.ink }]} numberOfLines={1}>
                  {user?.name || "Customer"}
                </Text>
                <Text style={[styles.heroEmail, { color: theme.body }]} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>
            </View>

            {/* Quick Stats Counter Row */}
            <View style={[styles.statsRow, { backgroundColor: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.8)", borderColor: theme.hairline }]}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => navigate && navigate("Bookings")}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={18} color="#f54e00" />
                <Text style={[styles.statValue, { color: theme.ink }]}>Visits</Text>
                <Text style={[styles.statSub, { color: theme.muted }]}>My Appointments</Text>
              </TouchableOpacity>

              <View style={[styles.statDivider, { backgroundColor: theme.hairlineSoft }]} />

              <TouchableOpacity
                style={styles.statItem}
                onPress={() => navigate && navigate("SavedSalons")}
                activeOpacity={0.7}
              >
                <Ionicons name="heart-outline" size={18} color="#ef4444" />
                <Text style={[styles.statValue, { color: theme.ink }]}>{favorites.length}</Text>
                <Text style={[styles.statSub, { color: theme.muted }]}>Saved Salons</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        ) : (
          /* GUEST BANNER CARD */
          <LinearGradient
            colors={isDark ? ["#1e1b4b", "#0f172a"] : ["#fff7ed", "#ffedd5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroCard,
              { borderColor: isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(245, 78, 0, 0.2)" },
            ]}
          >
            <View style={styles.heroRow}>
              <View style={[styles.guestIconBox, { backgroundColor: isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(245, 78, 0, 0.15)" }]}>
                <Ionicons name="person" size={26} color="#f54e00" />
              </View>
              <View style={styles.heroMeta}>
                <Text style={[styles.heroName, { color: theme.ink }]}>Guest User</Text>
                <Text style={[styles.heroEmail, { color: theme.body }]}>
                  Sign in to manage bookings &amp; preferences
                </Text>
              </View>
            </View>

            <View style={styles.guestBtnGroup}>
              <TouchableOpacity
                style={styles.primaryPillBtn}
                onPress={() => navigate && navigate("Login")}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={["#f54e00", "#d04200"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.pillGradient}
                >
                  <Text style={styles.primaryPillText}>Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryPillBtn, { backgroundColor: theme.surface, borderColor: theme.hairline }]}
                onPress={() => navigate && navigate("Register")}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryPillText, { color: theme.ink }]}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        {/* ───────────── SECTION 1: ACCOUNT & BOOKINGS ───────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitleText, { color: theme.primary || "#f54e00" }]}>
            ACCOUNT &amp; ACTIVITY
          </Text>
        </View>

        <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.rowItem, { borderBottomColor: theme.hairlineSoft }]}
              onPress={() => navigate && navigate("EditProfile")}
              activeOpacity={0.7}
            >
              <View style={[styles.iconPill, { backgroundColor: "rgba(99, 102, 241, 0.12)" }]}>
                <Ionicons name="person-outline" size={18} color="#6366f1" />
              </View>
              <View style={styles.rowMeta}>
                <Text style={[styles.rowLabel, { color: theme.ink }]}>Edit Personal Info</Text>
                <Text style={[styles.rowSub, { color: theme.muted }]}>Name, email &amp; phone number</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.muted} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.rowItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("Bookings")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: "rgba(245, 78, 0, 0.12)" }]}>
              <Ionicons name="calendar-outline" size={18} color="#f54e00" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>My Appointments</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>View upcoming &amp; past salon visits</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rowItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("SavedSalons")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
              <Ionicons name="heart-outline" size={18} color="#ef4444" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Saved Salons</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>{favorites.length} saved favorites</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rowItem, { borderBottomWidth: 0 }]}
            onPress={() => navigate && navigate("SavedAddresses")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
              <Ionicons name="location-outline" size={18} color="#10b981" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Saved Locations</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>Manage delivery &amp; appointment addresses</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </TouchableOpacity>
        </View>

        {/* ───────────── SECTION 2: PREFERENCES & DISPLAY ───────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitleText, { color: theme.primary || "#f54e00" }]}>
            PREFERENCES &amp; NOTIFICATIONS
          </Text>
        </View>

        <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
          <TouchableOpacity
            style={[styles.rowItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("NotificationCenter")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: "rgba(168, 85, 247, 0.12)" }]}>
              <Ionicons name="notifications-outline" size={18} color="#a855f7" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Notifications &amp; Alerts</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>Push updates &amp; appointment reminders</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rowItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("Onboarding")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: "rgba(14, 165, 233, 0.12)" }]}>
              <Ionicons name="sparkles-outline" size={18} color="#0ea5e9" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>View App Guide</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>Revisit features &amp; intro slider</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </TouchableOpacity>

          {/* Theme Switch Row */}
          <View style={[styles.rowItem, { borderBottomWidth: 0, paddingRight: S.sm }]}>
            <View style={[styles.iconPill, { backgroundColor: "rgba(234, 179, 8, 0.12)" }]}>
              <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={18} color="#eab308" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Appearance Mode</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>{isDark ? "Dark Theme Active" : "Light Theme Active"}</Text>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {/* ───────────── SECTION 3: HELP & LEGAL ───────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitleText, { color: theme.primary || "#f54e00" }]}>
            HELP &amp; PRIVACY
          </Text>
        </View>

        <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
          <TouchableOpacity
            style={[styles.rowItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("Support")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: "rgba(59, 130, 246, 0.12)" }]}>
              <Ionicons name="help-buoy-outline" size={18} color="#3b82f6" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Help &amp; Support</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>FAQs, customer service &amp; support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rowItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("Legal", { tab: "privacy" })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#10b981" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Privacy &amp; Terms of Service</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>Terms of use &amp; privacy policies</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rowItem, { borderBottomWidth: 0 }]}
            onPress={() => navigate && navigate("Legal", { tab: "data" })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
              <Ionicons name="lock-closed-outline" size={18} color="#ef4444" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Data Rights &amp; Account Deletion</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>Manage personal data &amp; rights</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </TouchableOpacity>
        </View>

        {/* Action Button: Sign Out (for Auth User) or Sign In (for Guest) */}
        {isAuthenticated ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.2)" }]}
            onPress={logout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>Sign Out of Account</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "rgba(245, 78, 0, 0.1)", borderColor: "rgba(245, 78, 0, 0.2)" }]}
            onPress={() => navigate && navigate("Login")}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={18} color="#f54e00" style={{ marginRight: 8 }} />
            <Text style={[styles.actionBtnText, { color: "#f54e00" }]}>Sign In to Account</Text>
          </TouchableOpacity>
        )}

        {/* Footer App Info */}
        <View style={styles.footerBox}>
          <Text style={[styles.footerText, { color: theme.muted }]}>
            Luxe Salon SaaS Platform v1.0.4
          </Text>
          <Text style={[styles.footerSubText, { color: theme.muted }]}>
            © {new Date().getFullYear()} Luxe Salon Platform. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: S.md,
    paddingTop: TOP_INSET,
    paddingBottom: S.xl * 2,
  },
  topTitleBox: {
    marginBottom: S.md,
  },
  screenTitle: {
    fontSize: FS.titleLg || 24,
    fontWeight: FW.bold,
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: FS.xs,
    marginTop: 2,
  },
  heroCard: {
    borderRadius: R.lg || 18,
    borderWidth: 1,
    padding: S.md,
    marginBottom: S.lg,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginRight: S.sm + 4,
  },
  avatarInitials: {
    color: "#ffffff",
    fontSize: FS.titleSm,
    fontWeight: FW.bold,
  },
  guestIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginRight: S.sm + 4,
  },
  heroMeta: {
    flex: 1,
  },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: FW.bold,
    color: "#f54e00",
    letterSpacing: 1,
  },
  heroName: {
    fontSize: FS.sm + 2,
    fontWeight: FW.bold,
  },
  heroEmail: {
    fontSize: FS.xs,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: R.md,
    borderWidth: 1,
    marginTop: S.md,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FS.xs + 1,
    fontWeight: FW.bold,
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  guestBtnGroup: {
    flexDirection: "row",
    gap: S.sm,
    marginTop: S.md,
  },
  primaryPillBtn: {
    flex: 1,
  },
  pillGradient: {
    paddingVertical: S.sm,
    borderRadius: R.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryPillText: {
    color: "#ffffff",
    fontSize: FS.xs + 1,
    fontWeight: FW.bold,
  },
  secondaryPillBtn: {
    flex: 1,
    paddingVertical: S.sm,
    borderRadius: R.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryPillText: {
    fontSize: FS.xs + 1,
    fontWeight: FW.bold,
  },
  sectionHeader: {
    marginBottom: S.xs + 2,
    marginTop: S.sm,
    paddingLeft: 4,
  },
  sectionTitleText: {
    fontSize: 11,
    fontWeight: FW.bold,
    letterSpacing: 1.2,
  },
  groupCard: {
    borderRadius: R.md + 4,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: S.md,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: S.sm + 4,
    paddingHorizontal: S.md,
    borderBottomWidth: 1,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: S.sm + 2,
  },
  rowMeta: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FS.xs + 1,
    fontWeight: FW.semiBold,
  },
  rowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: S.sm + 4,
    borderRadius: R.md + 2,
    borderWidth: 1,
    marginTop: S.md,
    marginBottom: S.lg,
  },
  actionBtnText: {
    fontSize: FS.xs + 1,
    fontWeight: FW.bold,
  },
  footerBox: {
    alignItems: "center",
    paddingBottom: S.md,
  },
  footerText: {
    fontSize: FS.xs - 1,
    fontWeight: FW.medium,
  },
  footerSubText: {
    fontSize: 10,
    marginTop: 2,
  },
});
