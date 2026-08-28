// src/screen/AboutScreen.jsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const TOP_INSET = Platform.OS === "ios" ? 52 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36);

export default function AboutScreen({ goBack, navigate }) {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>About Us</Text>
        <TouchableOpacity onPress={goBack} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={isDark ? "#FFFFFF" : "#18181B"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* App Branding Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.logoContainer}>
            <Ionicons name="scissors" size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.appNameText}>ST CUT</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.1 (Build 104)</Text>
          </View>
          <Text style={styles.taglineText}>
            Your Ultimate Luxury Salon &amp; Styling Destination
          </Text>
        </View>

        {/* Our Mission */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>OUR MISSION</Text>
          <Text style={styles.bodyText}>
            ST CUT is designed to revolutionize the salon booking experience. We connect clients with certified hair stylists, top-rated beauty salons, and luxury spa professionals with transparent pricing and real-time scheduling.
          </Text>
        </View>

        {/* Feature Highlights Grid */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>WHY CHOOSE ST CUT</Text>

          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#6C5CE7" />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Certified Salons</Text>
              <Text style={styles.featureSub}>Verified beauty professionals &amp; luxury salon partners.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <Ionicons name="flash-outline" size={20} color="#6C5CE7" />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Instant Booking</Text>
              <Text style={styles.featureSub}>Reserve your preferred time slot in seconds with zero waiting.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <Ionicons name="gift-outline" size={20} color="#6C5CE7" />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Luxe Rewards</Text>
              <Text style={styles.featureSub}>Earn points on every visit and redeem instant discount vouchers.</Text>
            </View>
          </View>

          <View style={styles.featureRowNoBorder}>
            <View style={styles.featureIconBox}>
              <Ionicons name="card-outline" size={20} color="#6C5CE7" />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Flexible Checkout</Text>
              <Text style={styles.featureSub}>Pay safely via UPI, Cards, Net Banking, or Pay-at-Salon.</Text>
            </View>
          </View>
        </View>

        {/* Contact & Links */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>CONNECT WITH US</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL("https://stcut.app").catch(() => {})}
            activeOpacity={0.7}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="globe-outline" size={20} color={isDark ? "#FFFFFF" : "#18181B"} style={{ marginRight: 14 }} />
              <Text style={styles.linkTitle}>Visit Official Website</Text>
            </View>
            <Ionicons name="open-outline" size={16} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL("mailto:support@stcut.app").catch(() => {})}
            activeOpacity={0.7}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="mail-outline" size={20} color={isDark ? "#FFFFFF" : "#18181B"} style={{ marginRight: 14 }} />
              <Text style={styles.linkTitle}>Email Customer Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRowNoBorder}
            onPress={() => navigate ? navigate("Legal") : null}
            activeOpacity={0.7}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="document-text-outline" size={20} color={isDark ? "#FFFFFF" : "#18181B"} style={{ marginRight: 14 }} />
              <Text style={styles.linkTitle}>Terms of Service &amp; Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Copyright Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.copyrightText}>© 2026 ST CUT Platform Inc.</Text>
          <Text style={styles.allRightsText}>All Rights Reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function getStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121216" : "#FFFFFF",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: TOP_INSET,
      paddingHorizontal: 24,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#2A2A34" : "#EFEFF4",
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#18181B",
      letterSpacing: -0.3,
    },
    closeBtn: {
      padding: 4,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 50,
    },
    heroCard: {
      alignItems: "center",
      backgroundColor: isDark ? "#1A1A22" : "#F7F7FA",
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
    },
    logoContainer: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: "#6C5CE7",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
      shadowColor: "#6C5CE7",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    appNameText: {
      fontSize: 24,
      fontWeight: "900",
      color: isDark ? "#FFFFFF" : "#18181B",
      letterSpacing: 1.5,
      marginBottom: 6,
    },
    versionBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: "rgba(108, 92, 231, 0.12)",
      marginBottom: 12,
    },
    versionText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#6C5CE7",
    },
    taglineText: {
      fontSize: 13.5,
      fontWeight: "500",
      color: isDark ? "#9999A0" : "#71717A",
      textAlign: "center",
    },
    sectionCard: {
      backgroundColor: isDark ? "#1A1A22" : "#F7F7FA",
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: "800",
      color: "#6C5CE7",
      letterSpacing: 1,
      marginBottom: 14,
    },
    bodyText: {
      fontSize: 14,
      fontWeight: "400",
      color: isDark ? "#D1D1D6" : "#3F3F46",
      lineHeight: 22,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#2A2A34" : "#EFEFF4",
    },
    featureRowNoBorder: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    featureIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(108, 92, 231, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    featureTextGroup: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 14.5,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      marginBottom: 2,
    },
    featureSub: {
      fontSize: 12.5,
      fontWeight: "400",
      color: isDark ? "#9999A0" : "#71717A",
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#2A2A34" : "#EFEFF4",
    },
    linkRowNoBorder: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
    },
    linkLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    linkTitle: {
      fontSize: 14.5,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    footerContainer: {
      alignItems: "center",
      paddingVertical: 20,
    },
    copyrightText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#888894" : "#9999A0",
      marginBottom: 2,
    },
    allRightsText: {
      fontSize: 12,
      fontWeight: "400",
      color: isDark ? "#66666E" : "#B0B0B8",
    },
  });
}
