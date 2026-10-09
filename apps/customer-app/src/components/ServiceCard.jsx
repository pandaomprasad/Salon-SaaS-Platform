// src/components/ServiceCard.jsx
import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO, FONT_FAMILY } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { paiseToINR } from "../services/apiClient";

function getCategoryIcon(catName) {
  const name = (catName || "").toLowerCase();
  if (name.includes("hair")) return "cut-outline";
  if (name.includes("combo") || name.includes("package")) return "gift-outline";
  if (name.includes("makeup") || name.includes("bridal")) return "sparkles-outline";
  if (name.includes("facial") || name.includes("skin") || name.includes("glow")) return "water-outline";
  if (name.includes("nail")) return "color-palette-outline";
  if (name.includes("spa") || name.includes("massage") || name.includes("body")) return "flower-outline";
  return "cut-outline";
}

function ServiceCard({ service, selected, onSelect, onViewCombo }) {
  const { theme, isDark } = useTheme();
  const styles = getStyles();
  const duration = service.durationMinutes || service.duration || 30;
  const imageUrl = service.image || "https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=200&auto=format&fit=crop";
  const isCombo =
    service.category?.toLowerCase() === "combo" ||
    Boolean(service.includedServices && service.includedServices.length > 0);

  const handleCardPress = () => {
    if (isCombo && onViewCombo) {
      onViewCombo(service);
    } else if (onSelect) {
      onSelect(service);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: selected ? theme.primary : theme.hairline },
      ]}
      onPress={handleCardPress}
      activeOpacity={0.88}
    >
      <View style={styles.cardInnerRow}>
        <View style={styles.infoCol}>
          <Text style={[styles.name, { color: theme.ink }]}>
            {service.name}
          </Text>
          
          <View style={styles.priceDurationRow}>
            <Text style={[styles.price, { color: C.price }]}>
              {paiseToINR(service.price)}
            </Text>
            <View style={styles.dotSeparator} />
            <Ionicons name="time-outline" size={13} color="#888888" />
            <Text style={styles.durationText}>{duration} mins</Text>
          </View>

          <Text style={[styles.description, { color: "#666666" }]} numberOfLines={2}>
            {service.description || "Premium service tailored for you"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, selected ? styles.addBtnSelected : styles.addBtnDefault]}
          onPress={() => onSelect && onSelect(service)}
          activeOpacity={0.8}
        >
          <Text style={[styles.addBtnText, selected ? styles.addBtnTextSelected : styles.addBtnTextDefault]}>
            {selected ? "Added" : "Add"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ServiceCard);

function getStyles() {
  return StyleSheet.create({
    card: {
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F0F0",
      backgroundColor: "#FFFFFF",
    },
    cardInnerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    infoCol: {
      flex: 1,
      justifyContent: "center",
    },
    name: {
      fontSize: 15.5,
      fontWeight: "700",
      marginBottom: 6,
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    priceDurationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    price: {
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    dotSeparator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: "#D1D5DB",
      marginHorizontal: 8,
    },
    durationText: {
      fontSize: 12.5,
      color: "#6B7280",
      fontWeight: "500",
      marginLeft: 4,
    },
    description: {
      fontSize: 12.5,
      lineHeight: 18,
    },
    addBtn: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      minWidth: 72,
    },
    addBtnDefault: {
      backgroundColor: C.crimsonTint || "#FCE8E8", // Light crimson tint
    },
    addBtnSelected: {
      backgroundColor: C.button, // Solid #B3261E
    },
    addBtnText: {
      fontSize: 13,
      fontWeight: "700",
    },
    addBtnTextDefault: {
      color: C.crimsonDark, // #8C1D2A text
    },
    addBtnTextSelected: {
      color: "#FFFFFF",
    },
  });
}
