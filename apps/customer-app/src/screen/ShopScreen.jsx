// src/screen/ShopScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const TOP_INSET = Platform.OS === "ios" ? 52 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36);

export default function ShopScreen({ navigate, onScroll }) {
  const { isDark } = useTheme();
  const [notified, setNotified] = useState(false);

  const handleNotifyPress = () => {
    setNotified(true);
    Alert.alert(
      "Notification Set! 🎉",
      "Thank you for your interest! We'll notify you as soon as the ST CUT Shop launches."
    );
  };

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="bag-handle-outline" size={42} color="#FFFFFF" />
          </View>

          <View style={styles.comingBadge}>
            <Text style={styles.comingBadgeText}>LAUNCHING SOON</Text>
          </View>

          <Text style={styles.heroTitle}>ST CUT Store &amp; Exclusives</Text>
          <Text style={styles.heroSub}>
            We are curating a premium collection of salon-grade haircare, luxury styling serums, and beauty essentials from top certified brands.
          </Text>
        </View>

        {/* Feature Preview List */}
        <View style={styles.featuresCard}>
          <Text style={styles.sectionHeader}>WHAT TO EXPECT</Text>

          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <Ionicons name="sparkles-outline" size={20} color="#6C5CE7" />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Authentic Salon Products</Text>
              <Text style={styles.featureSub}>100% genuine products recommended by expert stylists.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <Ionicons name="car-outline" size={20} color="#6C5CE7" />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Express Doorstep Delivery</Text>
              <Text style={styles.featureSub}>Fast delivery directly from partner salons in your city.</Text>
            </View>
          </View>

          <View style={styles.featureRowNoBorder}>
            <View style={styles.featureIconBox}>
              <Ionicons name="gift-outline" size={20} color="#6C5CE7" />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={styles.featureTitle}>Luxe Rewards &amp; Offers</Text>
              <Text style={styles.featureSub}>Redeem points for instant discounts on product purchases.</Text>
            </View>
          </View>
        </View>

        {/* Notify Me Button */}
        <TouchableOpacity
          style={[styles.notifyBtn, notified && styles.notifyBtnDone]}
          onPress={handleNotifyPress}
          activeOpacity={0.88}
          disabled={notified}
        >
          <Ionicons
            name={notified ? "checkmark-circle" : "notifications"}
            size={20}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.notifyBtnText}>
            {notified ? "You will be notified!" : "Notify Me When Available"}
          </Text>
        </TouchableOpacity>
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
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 110,
    },
    heroCard: {
      alignItems: "center",
      backgroundColor: isDark ? "#1A1A22" : "#F7F7FA",
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
    },
    iconCircle: {
      width: 76,
      height: 76,
      borderRadius: 24,
      backgroundColor: "#6C5CE7",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      shadowColor: "#6C5CE7",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
    comingBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: "rgba(108, 92, 231, 0.12)",
      marginBottom: 12,
    },
    comingBadgeText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#6C5CE7",
      letterSpacing: 1,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#18181B",
      textAlign: "center",
      marginBottom: 8,
    },
    heroSub: {
      fontSize: 13.5,
      fontWeight: "400",
      color: isDark ? "#9999A0" : "#71717A",
      textAlign: "center",
      lineHeight: 21,
    },
    featuresCard: {
      backgroundColor: isDark ? "#1A1A22" : "#F7F7FA",
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: "800",
      color: "#6C5CE7",
      letterSpacing: 1,
      marginBottom: 14,
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
    notifyBtn: {
      backgroundColor: "#6C5CE7",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 52,
      borderRadius: 16,
      shadowColor: "#6C5CE7",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    notifyBtnDone: {
      backgroundColor: "#10B981",
    },
    notifyBtnText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
