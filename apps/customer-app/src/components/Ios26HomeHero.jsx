import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { S } from "../theme";
import FloatingSearchCapsule from "./FloatingSearchCapsule";
import BouncyButton from "./BouncyButton";

export default function Ios26HomeHero({ onSearchClick, onLocationClick, userName, selectedCity, onSearchSubmit }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <View style={styles.heroContainer}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <View style={styles.vipTag}>
            <Ionicons name="sparkles" size={10} color="#E6CA65" />
            <Text style={styles.vipTagText}>VIP MEMBER</Text>
          </View>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.userName}>{userName || "Book Your Salon"}</Text>
        </View>

        <BouncyButton
          style={styles.locationPill}
          onPress={onLocationClick}
        >
          <Ionicons name="location" size={13} color="#1A1714" />
          <Text style={styles.locationText} numberOfLines={1}>{selectedCity || "Mumbai"}</Text>
          <Ionicons name="chevron-down" size={12} color="#8E877D" />
        </BouncyButton>
      </View>

      {/* Floating Pill Search Bar & Dropdown Card */}
      <FloatingSearchCapsule
        onSelectSuggestion={(term) => onSearchSubmit && onSearchSubmit(term)}
        onSearchSubmit={(term) => onSearchSubmit && onSearchSubmit(term)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    backgroundColor: "transparent",
    paddingTop: Platform.OS === "android" ? 44 : 54,
    paddingHorizontal: S.lg,
    paddingBottom: S.sm,
    zIndex: 100,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: S.md,
  },
  greetingBlock: {
    flex: 1,
  },
  vipTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1714",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  vipTagText: {
    color: "#E6CA65",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  greetingText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8E877D",
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  userName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1714",
    marginTop: 1,
    letterSpacing: -0.5,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    gap: 5,
  },
  locationText: {
    color: "#1A1714",
    fontSize: 12,
    fontWeight: "800",
  },
});
