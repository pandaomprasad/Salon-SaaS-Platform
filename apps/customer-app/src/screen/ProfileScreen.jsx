// src/screen/ProfileScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFavorites } from "../context/FavoritesContext";
import ThemeToggle from "../components/ThemeToggle";
import VerifyEmailModal from "../components/VerifyEmailModal";

const TOP_INSET = Platform.OS === "ios" ? 56 : (StatusBar.currentHeight ? StatusBar.currentHeight + 14 : 40);

export default function ProfileScreen({ navigate, onScroll }) {
  const styles = getStyles();
  const { user, isAuthenticated, logout, refreshProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const { favorites } = useFavorites();
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const isVerified = Boolean(user?.isEmailVerified || user?.email_verified);

  // Auto-sync user profile when returning from browser to the app or periodically if unverified
  useEffect(() => {
    if (!isAuthenticated || !refreshProfile) return;

    // Initial check on mount
    refreshProfile();

    // AppState change listener (runs when user switches back from Chrome/Safari to ST CUT)
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        refreshProfile();
      }
    });

    // Short interval polling if email is currently unverified (every 4 seconds)
    let interval = null;
    if (!isVerified) {
      interval = setInterval(() => {
        refreshProfile();
      }, 4000);
    }

    return () => {
      subscription.remove();
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, isVerified, refreshProfile]);

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
          <View
            style={[
              styles.heroCard,
              { backgroundColor: theme.surface, borderColor: theme.hairline },
            ]}
          >
            <View style={styles.heroRow}>
              <View style={[styles.avatarGradient, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>

              <View style={styles.heroMeta}>
                <View style={styles.vipBadge}>
                  <Ionicons name="sparkles" size={12} color={theme.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.vipBadgeText}>LUXE MEMBER</Text>
                </View>
                <Text style={[styles.heroName, { color: theme.ink }]} numberOfLines={1}>
                  {user?.name || "Customer"}
                </Text>
                <Text style={[styles.heroEmail, { color: theme.body }]} numberOfLines={1}>
                  {user?.email}
                </Text>
                {user ? (
                  isVerified ? (
                    <View style={styles.verifiedCapsule}>
                      <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                      <Text style={styles.verifiedCapsuleText}>Verified Account</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.unverifiedCapsule}
                      onPress={() => setShowVerifyModal(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="alert-circle" size={13} color="#D49B45" />
                      <Text style={styles.unverifiedCapsuleText}>Unverified • Tap to Verify</Text>
                    </TouchableOpacity>
                  )
                ) : null}
              </View>
            </View>

            {/* Quick Stats Counter Row */}
            <View style={[styles.statsRow, { backgroundColor: theme.canvasSoft, borderColor: theme.hairline }]}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => navigate && navigate("Bookings")}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.ink }]}>Visits</Text>
                <Text style={[styles.statSub, { color: theme.muted }]}>My Appointments</Text>
              </TouchableOpacity>

              <View style={[styles.statDivider, { backgroundColor: theme.hairlineSoft }]} />

              <TouchableOpacity
                style={styles.statItem}
                onPress={() => navigate && navigate("SavedSalons")}
                activeOpacity={0.7}
              >
                <Ionicons name="heart-outline" size={18} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.ink }]}>{favorites.length}</Text>
                <Text style={[styles.statSub, { color: theme.muted }]}>Saved Salons</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* GUEST BANNER CARD */
          <View
            style={[
              styles.heroCard,
              { backgroundColor: theme.surface, borderColor: theme.hairline },
            ]}
          >
            <View style={styles.heroRow}>
              <View style={[styles.guestIconBox, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)" }]}>
                <Ionicons name="person" size={24} color={theme.primary} />
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
                style={[styles.primaryPillBtn, { backgroundColor: theme.primary }]}
                onPress={() => navigate && navigate("Login")}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryPillText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryPillBtn, { backgroundColor: theme.surface, borderColor: theme.hairline }]}
                onPress={() => navigate && navigate("Register")}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryPillText, { color: theme.ink }]}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ───────────── SECTION 1: ACCOUNT & BOOKINGS ───────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitleText, { color: theme.primary }]}>
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
              <View style={[styles.iconPill, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)" }]}>
                <Ionicons name="person-outline" size={18} color={theme.primary} />
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
            <View style={[styles.iconPill, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)" }]}>
              <Ionicons name="calendar-outline" size={18} color={theme.primary} />
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
            <View style={[styles.iconPill, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)" }]}>
              <Ionicons name="heart-outline" size={18} color={theme.primary} />
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
            <View style={[styles.iconPill, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)" }]}>
              <Ionicons name="location-outline" size={18} color={theme.primary} />
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
          <Text style={[styles.sectionTitleText, { color: theme.primary }]}>
            PREFERENCES &amp; NOTIFICATIONS
          </Text>
        </View>

        <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
          <TouchableOpacity
            style={[styles.rowItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("NotificationCenter")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)" }]}>
              <Ionicons name="notifications-outline" size={18} color={theme.primary} />
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
            <View style={[styles.iconPill, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)" }]}>
              <Ionicons name="sparkles-outline" size={18} color={theme.primary} />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>View App Guide</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>Revisit features &amp; intro slider</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </TouchableOpacity>

          {/* Theme Switch Row */}
          <View style={[styles.rowItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconPill, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)" }]}>
              <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={18} color={theme.primary} />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Appearance Mode</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>{isDark ? "Dark Theme Active" : "Light Theme Active"}</Text>
            </View>
            <ThemeToggle showLabel={false} />
          </View>
        </View>

        {/* ───────────── SECTION 3: HELP & LEGAL ───────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitleText, { color: theme.primary }]}>
            HELP &amp; PRIVACY
          </Text>
        </View>

        <View style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
          <TouchableOpacity
            style={[styles.rowItem, { borderBottomColor: theme.hairlineSoft }]}
            onPress={() => navigate && navigate("Support")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconPill, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)" }]}>
              <Ionicons name="help-buoy-outline" size={18} color={theme.primary} />
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
            <View style={[styles.iconPill, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)" }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
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
            <View style={[styles.iconPill, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)" }]}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.primary} />
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
            style={[styles.actionBtn, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)", borderColor: "rgba(189, 68, 68, 0.2)" }]}
            onPress={logout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.actionBtnText, { color: theme.primary }]}>Sign Out of Account</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? "rgba(189, 68, 68, 0.18)" : "rgba(189, 68, 68, 0.08)", borderColor: "rgba(189, 68, 68, 0.2)" }]}
            onPress={() => navigate && navigate("Login")}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.actionBtnText, { color: theme.primary }]}>Sign In to Account</Text>
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

      <VerifyEmailModal
        visible={showVerifyModal}
        email={user?.email}
        onClose={() => setShowVerifyModal(false)}
        onVerified={() => setShowVerifyModal(false)}
      />
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: S.md,
    paddingTop: TOP_INSET,
    paddingBottom: 84,
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
    color: C.bg,
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
    color: C.main,
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
  verifiedCapsule: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 6,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  verifiedCapsuleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
    letterSpacing: 0.2,
  },
  unverifiedCapsule: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 6,
    backgroundColor: "rgba(212, 155, 69, 0.12)",
    borderColor: "rgba(212, 155, 69, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  unverifiedCapsuleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D49B45",
    letterSpacing: 0.2,
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
    height: 44,
    borderRadius: R.md,
    alignItems: "center",
    justifyContent: "center",
  },
  pillGradient: {
    paddingVertical: S.sm,
    borderRadius: R.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryPillText: {
    color: "#FFFFFF",
    fontSize: FS.xs + 1,
    fontWeight: FW.bold,
  },
  secondaryPillBtn: {
    flex: 1,
    height: 44,
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
    paddingRight: S.xs,
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
    height: 46,
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
}
