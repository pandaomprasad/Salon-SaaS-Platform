// src/screen/ShopScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme";
import { useTheme } from "../context/ThemeContext";
import SpringTouchable from "../components/SpringTouchable";
import { useLocationStore } from "../store/useLocationStore";
import ComingSoonLocation from "../components/ComingSoonLocation";
import LocationPickerModal from "../components/LocationPickerModal";
import { ScrollView } from "react-native";

const TOP_INSET =
  Platform.OS === "ios" ? 52 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36;

export default function ShopScreen({ navigate, onScroll }) {
  const { isDark } = useTheme();
  const [notified, setNotified] = useState(false);
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const isCityEmpty = selectedCity && selectedCity.toLowerCase() !== "brahmapur";

  const handleNotifyPress = () => {
    setNotified(true);
    Alert.alert(
      "Notification Set! 🎉",
      "We'll notify you as soon as the ST CUT Shop opens."
    );
  };

  const styles = getStyles(isDark);
  const accentColor = C.purple || "#D91C5C";

  if (isCityEmpty) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shop</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}>
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={(c) => setSelectedCity(c)}
          />
        </ScrollView>
        <LocationPickerModal
          visible={locationModalVisible}
          selectedCity={selectedCity}
          onSelectCity={(city) => {
            setSelectedCity(city);
            setLocationModalVisible(false);
          }}
          onClose={() => setLocationModalVisible(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
      </View>

      {/* Centered Minimal Coming Soon View */}
      <View style={styles.content}>
        <View style={styles.iconRingOuter}>
          <View style={styles.iconRingInner}>
            <Ionicons name="bag-handle-outline" size={38} color={accentColor} />
          </View>
        </View>

        <View style={styles.badgePill}>
          <View style={styles.glowingDot} />
          <Text style={styles.badgeText}>COMING SOON</Text>
        </View>

        <Text style={styles.title}>ST CUT Store</Text>
        <Text style={styles.subtitle}>
          Our exclusive collection of salon-grade products &amp; beauty essentials is on its way.
        </Text>

        <SpringTouchable
          style={[styles.notifyBtn, notified && styles.notifyBtnDone]}
          onPress={handleNotifyPress}
          disabled={notified}
          scaleTo={0.96}
        >
          <Ionicons
            name={notified ? "checkmark-circle" : "notifications-outline"}
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.notifyBtnText}>
            {notified ? "You'll Be Notified!" : "Notify Me When Available"}
          </Text>
        </SpringTouchable>
      </View>
    </View>
  );
}

function getStyles(isDark) {
  const accentColor = C.purple || "#D91C5C";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0A0A0C" : "#FAFAFC",
    },
    header: {
      paddingTop: TOP_INSET,
      paddingHorizontal: 24,
      paddingBottom: 16,
      backgroundColor: isDark ? "#0A0A0C" : "#FAFAFC",
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#111827",
      letterSpacing: -0.5,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingBottom: 100,
    },
    iconRingOuter: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: isDark ? "rgba(217, 28, 92, 0.12)" : "#FDF2F5",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(217, 28, 92, 0.25)" : "#FCE7EC",
    },
    iconRingInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? "rgba(217, 28, 92, 0.2)" : "#FBE6EA",
      alignItems: "center",
      justifyContent: "center",
    },
    badgePill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(217, 28, 92, 0.15)" : "#FDF2F5",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(217, 28, 92, 0.3)" : "#FCE7EC",
      marginBottom: 16,
    },
    glowingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: accentColor,
      marginRight: 6,
    },
    badgeText: {
      fontSize: 10.5,
      fontWeight: "800",
      color: accentColor,
      letterSpacing: 0.8,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#111827",
      textAlign: "center",
      marginBottom: 10,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: "400",
      color: isDark ? "#9CA3AF" : "#6B7280",
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 28,
      maxWidth: 280,
    },
    notifyBtn: {
      backgroundColor: accentColor,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      height: 48,
      borderRadius: 24,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
      width: "100%",
      maxWidth: 280,
    },
    notifyBtnDone: {
      backgroundColor: isDark ? "#10B981" : "#059669",
      shadowColor: "#10B981",
    },
    notifyBtnText: {
      color: "#FFFFFF",
      fontSize: 14.5,
      fontWeight: "700",
    },
  });
}
