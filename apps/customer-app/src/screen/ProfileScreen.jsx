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
  Image,
  AppState,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FONT_FAMILY } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFavorites } from "../context/FavoritesContext";
import VerifyEmailModal from "../components/VerifyEmailModal";

const TOP_INSET = Platform.OS === "ios" ? 52 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36);

export default function ProfileScreen({ navigate, onScroll }) {
  const { user, isAuthenticated, logout, refreshProfile } = useAuth();
  const { isDark, themeMode, setThemeMode } = useTheme();
  const { favorites } = useFavorites();
  const styles = getStyles(isDark);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const isVerified = Boolean(user?.isEmailVerified || user?.email_verified);

  // 1. Initial mount & AppState foreground refresh
  useEffect(() => {
    if (!isAuthenticated || !refreshProfile) return;

    refreshProfile();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        refreshProfile();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, refreshProfile]);

  // 2. Periodic polling ONLY if user email is unverified
  useEffect(() => {
    if (!isAuthenticated || isVerified || !refreshProfile) return;

    const interval = setInterval(() => {
      refreshProfile();
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isVerified, refreshProfile]);

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: "Book your luxury salon appointments on ST CUT! Download now: https://stcut.app",
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout },
      ]
    );
  };

  const MALE_AVATAR_ASSET = require("../../assets/male-avatar.png");
  const FEMALE_AVATAR_ASSET = require("../../assets/female-avatar.png");

  // Helper function to resolve profile image source based on user photo or gender preference
  const resolveProfileAvatarSource = (userData) => {
    if (userData?.avatarUrl && typeof userData.avatarUrl === "string" && userData.avatarUrl.trim().length > 0) {
      return { uri: userData.avatarUrl.trim() };
    }
    const g = (userData?.gender || userData?.sex || userData?.genderPreference || "").toString().toLowerCase().trim();
    if (g === "female" || g === "women" || g === "woman" || g === "f") {
      return FEMALE_AVATAR_ASSET;
    }
    return MALE_AVATAR_ASSET;
  };

  const resolveUserName = (userData) => {
    if (!isAuthenticated) return "Welcome Guest";
    if (userData?.name && userData.name.trim().length > 0) {
      return userData.name.trim();
    }
    if (userData?.email && userData.email.includes("@")) {
      const emailPrefix = userData.email.split("@")[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return "User Account";
  };

  const userAvatarSource = resolveProfileAvatarSource(user);
  const userName = resolveUserName(user);
  const userEmail = isAuthenticated ? (user?.email || "") : "Sign in to manage appointments & preferences";

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Top Row: Left Avatar Box, Right Action Buttons */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.avatarCard}
            onPress={() => {
              if (isAuthenticated) {
                if (navigate) navigate("EditProfile");
              } else {
                if (navigate) navigate("Login");
              }
            }}
            activeOpacity={0.85}
          >
            <Image source={userAvatarSource} style={styles.avatarImage} />
          </TouchableOpacity>

          <View style={styles.topActionsRow}>
            <TouchableOpacity
              style={styles.actionBtnSquare}
              onPress={() => navigate && navigate("NotificationCenter")}
              activeOpacity={0.75}
            >
              <Ionicons name="notifications-outline" size={20} color={isDark ? "#FFFFFF" : "#1A1A1E"} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnSquare}
              onPress={() => navigate && navigate("SavedSalons")}
              activeOpacity={0.75}
            >
              <Ionicons name="heart-outline" size={20} color={isDark ? "#FFFFFF" : "#1A1A1E"} />
              {favorites.length > 0 && <View style={styles.favBadgeDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* User Name + Purple Edit Icon (ONLY SHOWN WHEN LOGGED IN) */}
        <TouchableOpacity
          style={styles.userNameRow}
          onPress={() => {
            if (isAuthenticated) {
              if (navigate) navigate("EditProfile");
            } else {
              if (navigate) navigate("Login");
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.nameText}>{userName}</Text>
          {isAuthenticated && (
            <View style={styles.purpleEditIconBox}>
              <Ionicons name="create-outline" size={15} color="#5842E3" />
            </View>
          )}
        </TouchableOpacity>

        {/* User Email Subtext */}
        <Text style={styles.emailText}>{userEmail}</Text>

        <View style={styles.menuSpacer} />

        {/* Appearance Mode Selection Card */}
        <View style={styles.themeCard}>
          <Text style={styles.themeCardHeader}>APP APPEARANCE</Text>
          <View style={styles.themeSegmentRow}>
            <TouchableOpacity
              style={[
                styles.themeTab,
                themeMode === "light" && styles.themeTabActive,
              ]}
              onPress={() => setThemeMode("light")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="sunny"
                size={14}
                color={themeMode === "light" ? "#FFFFFF" : isDark ? "#A0A0A5" : "#66666E"}
              />
              <Text
                style={[
                  styles.themeTabLabel,
                  themeMode === "light" && styles.themeTabLabelActive,
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeTab,
                themeMode === "dark" && styles.themeTabActive,
              ]}
              onPress={() => setThemeMode("dark")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="moon"
                size={14}
                color={themeMode === "dark" ? "#FFFFFF" : isDark ? "#A0A0A5" : "#66666E"}
              />
              <Text
                style={[
                  styles.themeTabLabel,
                  themeMode === "dark" && styles.themeTabLabelActive,
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeTab,
                themeMode === "system" && styles.themeTabActive,
              ]}
              onPress={() => setThemeMode("system")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={14}
                color={themeMode === "system" ? "#FFFFFF" : isDark ? "#A0A0A5" : "#66666E"}
              />
              <Text
                style={[
                  styles.themeTabLabel,
                  themeMode === "system" && styles.themeTabLabelActive,
                ]}
              >
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuListGroup}>
          {/* 1. Appointment History */}
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => navigate && navigate("Bookings")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeftGroup}>
              <Ionicons name="calendar-outline" size={22} color={isDark ? "#FFFFFF" : "#1A1A1E"} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Appointment History</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={isDark ? "#55555E" : "#C7C7CC"} />
          </TouchableOpacity>

          {/* 2. Payment Methods */}
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => navigate ? navigate("SavedAddresses") : Alert.alert("Payment Methods", "Manage payment methods.")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeftGroup}>
              <Ionicons name="card-outline" size={22} color={isDark ? "#FFFFFF" : "#1A1A1E"} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={isDark ? "#55555E" : "#C7C7CC"} />
          </TouchableOpacity>

          {/* 3. Payment History */}
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => navigate && navigate("Bookings")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeftGroup}>
              <Ionicons name="reload-circle-outline" size={23} color={isDark ? "#FFFFFF" : "#1A1A1E"} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Payment History</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={isDark ? "#55555E" : "#C7C7CC"} />
          </TouchableOpacity>

          {/* 3. Change Password */}
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => navigate && navigate("EditProfile")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeftGroup}>
              <Ionicons name="lock-closed-outline" size={22} color={isDark ? "#FFFFFF" : "#1A1A1E"} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={isDark ? "#55555E" : "#C7C7CC"} />
          </TouchableOpacity>

          {/* 4. Invites Friends */}
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={handleShareApp}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeftGroup}>
              <Ionicons name="people-outline" size={22} color={isDark ? "#FFFFFF" : "#1A1A1E"} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Invites Friends</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={isDark ? "#55555E" : "#C7C7CC"} />
          </TouchableOpacity>

          {/* 5. FAQs */}
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => navigate && navigate("Support")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeftGroup}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={isDark ? "#FFFFFF" : "#1A1A1E"} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>FAQs</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={isDark ? "#55555E" : "#C7C7CC"} />
          </TouchableOpacity>

          {/* 6. About Us */}
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => navigate && navigate("About")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeftGroup}>
              <Ionicons name="help-circle-outline" size={22} color={isDark ? "#FFFFFF" : "#1A1A1E"} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>About Us</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={isDark ? "#55555E" : "#C7C7CC"} />
          </TouchableOpacity>

          {/* 7. Logout */}
          <TouchableOpacity
            style={styles.menuItemRowLast}
            onPress={isAuthenticated ? handleLogoutPress : () => navigate && navigate("Login")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeftGroup}>
              <Ionicons name="close-circle-outline" size={22} color={isDark ? "#FFFFFF" : "#1A1A1E"} style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{isAuthenticated ? "Logout" : "Login"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={isDark ? "#55555E" : "#C7C7CC"} />
          </TouchableOpacity>
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

function getStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121216" : "#FFFFFF",
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: TOP_INSET + 8,
      paddingBottom: 90,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    avatarCard: {
      width: 72,
      height: 72,
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: isDark ? "#282834" : "#F4F4F8",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    topActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    actionBtnSquare: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: isDark ? "#1E1E24" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "#2E2E38" : "#ECECEF",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    favBadgeDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#5842E3",
      position: "absolute",
      top: 9,
      right: 9,
    },
    userNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 2,
    },
    nameText: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A1E",
      letterSpacing: -0.3,
    },
    purpleEditIconBox: {
      width: 26,
      height: 26,
      borderRadius: 7,
      backgroundColor: "rgba(88, 66, 227, 0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    emailText: {
      fontSize: 13.5,
      fontWeight: "400",
      color: isDark ? "#888894" : "#B0B0B8",
    },
    menuSpacer: {
      height: 20,
    },
    themeCard: {
      backgroundColor: isDark ? "#1A1A22" : "#F7F7FA",
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDark ? "#282834" : "#EFEFF4",
    },
    themeCardHeader: {
      fontSize: 10,
      fontWeight: "800",
      color: "#6C5CE7",
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    themeSegmentRow: {
      flexDirection: "row",
      backgroundColor: isDark ? "#282834" : "#EBECEF",
      borderRadius: 12,
      padding: 3,
    },
    themeTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 9,
      borderRadius: 10,
      gap: 6,
    },
    themeTabActive: {
      backgroundColor: "#6C5CE7",
      shadowColor: "#6C5CE7",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    themeTabLabel: {
      fontSize: 12.5,
      fontWeight: "600",
      color: isDark ? "#A0A0A5" : "#66666E",
    },
    themeTabLabelActive: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    menuListGroup: {
      flexDirection: "column",
    },
    menuItemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 18,
    },
    menuItemRowLast: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 18,
    },
    menuLeftGroup: {
      flexDirection: "row",
      alignItems: "center",
    },
    menuIcon: {
      marginRight: 18,
      width: 24,
      textAlign: "center",
    },
    menuLabel: {
      fontSize: 15.5,
      fontWeight: "600",
      color: isDark ? "#E6E6EC" : "#1A1A1E",
      letterSpacing: -0.2,
    },
  });
}
