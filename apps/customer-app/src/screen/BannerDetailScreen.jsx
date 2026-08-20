// src/screen/BannerDetailScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO, FONT_FAMILY } from "../theme";
import { useTheme } from "../context/ThemeContext";

export default function BannerDetailScreen({ routeParams, onBack, navigate }) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  const [copied, setCopied] = useState(false);

  const banner = routeParams?.banner || {
    title: "Luxury Salon Experience",
    subtitle: "Enjoy premium beauty treatments",
    tag: "EXCLUSIVE DEAL",
    promoCode: "FIRST20",
    details:
      "Valid on all haircut, facial, and styling treatments. Applicable on appointments booked via the app. Cannot be combined with other offers.",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop",
    cta: "Claim Offer",
  };

  const handleCopyCode = () => {
    if (banner.promoCode) {
      Clipboard.setString(banner.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleApplyOffer = () => {
    if (banner.targetType === "SALON" && banner.targetId) {
      if (navigate) navigate("SalonDetail", { salon: { _id: banner.targetId } });
      return;
    }
    if (banner.targetType === "CATEGORY" && banner.category) {
      if (navigate) navigate("Explore", { category: banner.category });
      return;
    }
    if (navigate) navigate("Explore", { search: banner.promoCode || "" });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (onBack ? onBack() : navigate && navigate("Home"))}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OFFER DETAILS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner Hero Image */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: banner.image || banner.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeText}>{banner.tag || "PROMO OFFER"}</Text>
          </View>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.bannerTitle}>{banner.title}</Text>
          {banner.subtitle ? (
            <Text style={styles.bannerSub}>{banner.subtitle}</Text>
          ) : null}
        </View>

        {/* Promo Voucher Box */}
        {banner.promoCode ? (
          <View style={styles.voucherCard}>
            <View style={styles.voucherLeft}>
              <Text style={styles.voucherLabel}>PROMO CODE</Text>
              <Text style={styles.voucherCode}>{banner.promoCode}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
              onPress={handleCopyCode}
              activeOpacity={0.85}
            >
              <Ionicons
                name={copied ? "checkmark-circle" : "copy-outline"}
                size={16}
                color={copied ? "#FFFFFF" : C.ink}
              />
              <Text style={[styles.copyBtnText, copied && { color: "#FFFFFF" }]}>
                {copied ? "COPIED!" : "COPY CODE"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Offer Details & Terms Section */}
        <View style={styles.detailsBlock}>
          <View style={styles.detailsHeader}>
            <Ionicons name="document-text-outline" size={18} color={C.main} />
            <Text style={styles.detailsHeaderTitle}>Offer Terms & Information</Text>
          </View>
          <Text style={styles.detailsBodyText}>
            {banner.details ||
              "Valid for verified salon bookings. Present this code or select it during checkout to claim your discount. Terms & conditions apply."}
          </Text>
        </View>

        {/* How to Redeem Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>How to Redeem</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <Text style={styles.stepText}>Tap the button below to browse verified salons.</Text>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Select your desired luxury services and preferred appointment slot.
            </Text>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Apply code {banner.promoCode ? `"${banner.promoCode}"` : "at checkout"} to enjoy instant discount.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryCtaBtn}
          onPress={handleApplyOffer}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryCtaText}>
            {banner.promoCode ? `Book Now with ${banner.promoCode}` : "Explore Salons"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getStyles(theme, isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    topHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: S.md,
      paddingTop: Platform.OS === "ios" ? 10 : 20,
      paddingBottom: S.sm,
      borderBottomWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: R.md,
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      ...TYPO.eyebrow,
      color: C.main,
      fontSize: 11,
    },
    scrollContent: {
      padding: S.md,
      paddingBottom: 100,
    },
    heroWrapper: {
      height: 200,
      borderRadius: R.lg,
      overflow: "hidden",
      position: "relative",
      marginBottom: S.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    tagBadge: {
      position: "absolute",
      top: S.sm,
      left: S.sm,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: R.pill,
      borderWidth: 1,
      borderColor: C.main,
    },
    tagBadgeText: {
      fontSize: 10,
      fontWeight: FW.bold,
      color: C.main,
      letterSpacing: 0.8,
    },
    titleSection: {
      marginBottom: S.md,
    },
    bannerTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 24,
      fontWeight: FW.bold,
      color: C.ink,
      lineHeight: 30,
      marginBottom: 6,
    },
    bannerSub: {
      fontSize: FS.body,
      color: C.muted,
      lineHeight: 22,
    },
    voucherCard: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1.5,
      borderColor: C.main,
      marginBottom: S.md,
    },
    voucherLeft: {
      flex: 1,
    },
    voucherLabel: {
      fontSize: 10,
      fontWeight: FW.bold,
      color: C.muted,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    voucherCode: {
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
      fontSize: 20,
      fontWeight: FW.bold,
      color: C.main,
      letterSpacing: 1,
    },
    copyBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.bg,
      paddingHorizontal: S.md,
      paddingVertical: 10,
      borderRadius: R.md,
      borderWidth: 1,
      borderColor: C.border,
      gap: 6,
    },
    copyBtnSuccess: {
      backgroundColor: "#10B981",
      borderColor: "#10B981",
    },
    copyBtnText: {
      fontSize: FS.bodySm,
      fontWeight: FW.bold,
      color: C.ink,
    },
    detailsBlock: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.md,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: S.md,
    },
    detailsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: S.xs,
    },
    detailsHeaderTitle: {
      fontSize: FS.body,
      fontWeight: FW.semiBold,
      color: C.ink,
    },
    detailsBodyText: {
      fontSize: FS.bodySm,
      color: C.body,
      lineHeight: 20,
    },
    stepsCard: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.md,
      borderWidth: 1,
      borderColor: C.border,
      gap: 12,
    },
    stepsTitle: {
      fontSize: FS.body,
      fontWeight: FW.semiBold,
      color: C.ink,
      marginBottom: 4,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    stepNumCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: C.main,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNumText: {
      fontSize: 12,
      fontWeight: FW.bold,
      color: "#FFFFFF",
    },
    stepText: {
      flex: 1,
      fontSize: FS.bodySm,
      color: C.body,
      lineHeight: 18,
    },
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: C.surface,
      paddingHorizontal: S.md,
      paddingVertical: S.md,
      borderTopWidth: 1,
      borderColor: C.border,
    },
    primaryCtaBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.main,
      paddingVertical: 14,
      borderRadius: R.md,
      gap: 8,
    },
    primaryCtaText: {
      fontSize: FS.body,
      fontWeight: FW.bold,
      color: "#FFFFFF",
    },
  });
}
