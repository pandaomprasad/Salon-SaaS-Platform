// src/screen/LegalScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C, S, FS, FW, R } from "../theme";
import { useTheme } from "../context/ThemeContext";

const TOP_INSET = Platform.OS === "ios" ? 56 : (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 40);

const TABS = [
  { id: "privacy", label: "Privacy Policy", icon: "shield-checkmark-outline" },
  { id: "terms", label: "Terms of Service", icon: "document-text-outline" },
  { id: "data", label: "Data Rights", icon: "lock-closed-outline" },
];

export default function LegalScreen({ goBack, routeParams, onScroll }) {
  const { theme, isDark } = useTheme();
  const initialTab = routeParams?.tab || "privacy";
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.hairline }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.grep }]}
          onPress={() => goBack && goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.ink} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: theme.ink }]}>Legal &amp; Privacy</Text>
          <Text style={[styles.headerSub, { color: theme.muted }]}>
            Policies, Terms &amp; Data Rights
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Segmented Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.hairline }]}>
        {TABS.map((t) => {
          const isSelected = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.tabBtn,
                isSelected && [styles.tabBtnActive, { borderBottomColor: "#f54e00" }],
              ]}
              onPress={() => setActiveTab(t.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={t.icon}
                size={16}
                color={isSelected ? "#f54e00" : theme.muted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isSelected ? "#f54e00" : theme.body },
                  isSelected && styles.tabLabelActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Effective Date Badge */}
        <View style={[styles.infoBanner, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
          <Ionicons name="information-circle-outline" size={18} color="#f54e00" />
          <Text style={[styles.infoBannerText, { color: theme.body }]}>
            Last updated: <Text style={{ color: theme.ink, fontWeight: FW.bold }}>August 12, 2026</Text> • Applies to all Luxe Salon Platform services.
          </Text>
        </View>

        {/* ───────────── TAB 1: PRIVACY POLICY ───────────── */}
        {activeTab === "privacy" && (
          <View style={styles.sectionGap}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>1. Overview &amp; Data Collection</Text>
              <Text style={[styles.paragraph, { color: theme.body }]}>
                Luxe Salon SaaS Platform (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting the personal information you share with us when using our mobile applications and websites.
              </Text>
              <Text style={[styles.paragraph, { color: theme.body }]}>
                We collect information you provide directly during account registration, profile setup, and appointment bookings, including:
              </Text>
              <View style={styles.bulletList}>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• Personal Identifiers: Full Name, Email Address, Phone Number.</Text>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• Location Information: Approximate GPS coordinates (used solely to discover nearby salons with your permission).</Text>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• Booking History: Preferred branches, booked time slots, specialist selections, and customer notes.</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>2. How We Use Your Information</Text>
              <Text style={[styles.paragraph, { color: theme.body }]}>
                Your data is processed strictly to provide and improve salon booking services:
              </Text>
              <View style={styles.bulletList}>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• Processing &amp; Confirming Salon Appointments with branch managers.</Text>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• Sending real-time status updates via Push Notifications and Email.</Text>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• Preventing fraudulent bookings and securing account access.</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>3. Data Protection &amp; Sharing</Text>
              <Text style={[styles.paragraph, { color: theme.body }]}>
                We do NOT sell, rent, or trade your personal data to third-party advertisers. Information is only shared with the specific salon branch where you book an appointment to enable service fulfillment.
              </Text>
              <Text style={[styles.paragraph, { color: theme.body }]}>
                All data transmission between your mobile device and our backend APIs is encrypted using TLS 1.3/SSL protocols.
              </Text>
            </View>
          </View>
        )}

        {/* ───────────── TAB 2: TERMS OF SERVICE ───────────── */}
        {activeTab === "terms" && (
          <View style={styles.sectionGap}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>1. Acceptance of Terms</Text>
              <Text style={[styles.paragraph, { color: theme.body }]}>
                By downloading, registering, or using the Luxe Salon Platform application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our app.
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>2. Booking &amp; Cancellation Policy</Text>
              <Text style={[styles.paragraph, { color: theme.body }]}>
                When you reserve a slot through our app:
              </Text>
              <View style={styles.bulletList}>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• PENDING appointments are submitted to the salon partner for confirmation.</Text>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• Cancellations can be made directly in the app prior to slot commencement.</Text>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• Repeated no-shows may lead to temporary booking restrictions on your account.</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>3. Partner Salon Disclaimer</Text>
              <Text style={[styles.paragraph, { color: theme.body }]}>
                Salons listed on the platform operate as independent business entities. While we monitor partner quality, individual service execution and in-salon experiences are managed directly by each salon branch.
              </Text>
            </View>
          </View>
        )}

        {/* ───────────── TAB 3: DATA RIGHTS & DELETION ───────────── */}
        {activeTab === "data" && (
          <View style={styles.sectionGap}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>1. Your Data Protection Rights</Text>
              <Text style={[styles.paragraph, { color: theme.body }]}>
                Under global privacy laws (GDPR, CCPA, DPDP), you have full control over your personal data:
              </Text>
              <View style={styles.bulletList}>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• Right to Access: View all personal data and booking history stored on your account.</Text>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• Right to Rectification: Edit your name, email, or phone number in your Profile settings.</Text>
                <Text style={[styles.bulletItem, { color: theme.body }]}>• Right to Erasure: Request permanent deletion of your account and personal records.</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>2. Account &amp; Data Deletion Request</Text>
              <Text style={[styles.paragraph, { color: theme.body }]}>
                You may request complete account deletion at any time. Deleting your account permanently removes your profile, saved locations, favorite salons, and booking history.
              </Text>
              
              <TouchableOpacity
                style={styles.deleteBtnGradient}
                onPress={() => Linking.openURL("mailto:privacy@salonplatform.com?subject=Account%20Deletion%20Request")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#ef4444", "#dc2626"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deleteBtnGradientBox}
                >
                  <Ionicons name="trash-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>Request Account Deletion</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Contact Legal Team Card */}
        <View style={[styles.contactCard, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
          <Text style={[styles.contactTitle, { color: theme.ink }]}>Questions regarding our Privacy Policy?</Text>
          <Text style={[styles.contactSub, { color: theme.body }]}>
            Our data protection compliance team is ready to assist you.
          </Text>
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: theme.grep }]}
            onPress={() => Linking.openURL("mailto:privacy@salonplatform.com")}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={16} color={theme.ink} style={{ marginRight: 6 }} />
            <Text style={[styles.contactBtnText, { color: theme.ink }]}>Contact Privacy Officer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: S.md,
    paddingTop: TOP_INSET,
    paddingBottom: S.sm + 2,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleBox: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FS.md,
    fontWeight: FW.bold,
  },
  headerSub: {
    fontSize: FS.xs - 1,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: S.xs,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: S.sm + 2,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: FS.xs,
    fontWeight: FW.medium,
  },
  tabLabelActive: {
    fontWeight: FW.bold,
  },
  scrollContent: {
    padding: S.md,
    paddingBottom: S.xl * 2,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: R.md,
    borderWidth: 1,
    padding: S.sm + 2,
    marginBottom: S.md,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: FS.xs,
    lineHeight: 18,
  },
  sectionGap: {
    gap: S.md,
  },
  card: {
    borderRadius: R.md,
    borderWidth: 1,
    padding: S.md,
  },
  cardTitle: {
    fontSize: FS.sm + 1,
    fontWeight: FW.bold,
    marginBottom: S.xs + 2,
  },
  paragraph: {
    fontSize: FS.xs + 1,
    lineHeight: 20,
    marginBottom: S.xs + 2,
  },
  bulletList: {
    marginTop: S.xs,
    gap: 6,
  },
  bulletItem: {
    fontSize: FS.xs,
    lineHeight: 18,
  },
  deleteBtnGradient: {
    marginTop: S.sm,
  },
  deleteBtnGradientBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: S.sm + 2,
    borderRadius: R.md,
  },
  deleteBtnText: {
    color: "#ffffff",
    fontSize: FS.xs + 1,
    fontWeight: FW.bold,
  },
  contactCard: {
    borderRadius: R.md,
    borderWidth: 1,
    padding: S.md,
    marginTop: S.lg,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: FS.sm,
    fontWeight: FW.bold,
    textAlign: "center",
  },
  contactSub: {
    fontSize: FS.xs,
    textAlign: "center",
    marginTop: 4,
    marginBottom: S.sm + 2,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    borderRadius: R.md,
  },
  contactBtnText: {
    fontSize: FS.xs,
    fontWeight: FW.bold,
  },
});
