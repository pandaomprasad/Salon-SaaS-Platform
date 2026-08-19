// src/components/ServiceCard.jsx
import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO, FONT_FAMILY } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { paiseToINR } from "../services/apiClient";

function getCategoryIcon(catName) {
  const name = (catName || "").toLowerCase();
  if (name.includes("hair")) return "cut-outline";
  if (name.includes("makeup") || name.includes("bridal")) return "sparkles-outline";
  if (name.includes("facial") || name.includes("skin") || name.includes("glow")) return "water-outline";
  if (name.includes("nail")) return "color-palette-outline";
  if (name.includes("spa") || name.includes("massage") || name.includes("body")) return "flower-outline";
  return "cut-outline";
}

function ServiceCard({ service, selected, onSelect }) {
  const { theme } = useTheme();
  const styles = getStyles();
  const categoryName = (service.category || "General").toUpperCase();
  const duration = service.durationMinutes || service.duration || 30;
  const iconName = getCategoryIcon(service.category);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: selected ? theme.primary : theme.hairline },
      ]}
      onPress={() => onSelect && onSelect(service)}
      activeOpacity={0.88}
    >
      <View style={styles.cardInnerRow}>
        {/* Soft Circular Icon Badge */}
        <View style={[styles.iconCircle, { backgroundColor: theme.goldTint }]}>
          <Ionicons name={iconName} size={20} color={theme.primary} />
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          <Text style={[styles.categoryEyebrow, { color: theme.primary }]}>
            {categoryName}  •  {duration} mins
          </Text>
          <Text style={[styles.name, { color: theme.ink, fontFamily: FONT_FAMILY.serif }]}>
            {service.name}
          </Text>
          {service.description ? (
            <Text style={[styles.description, { color: theme.muted }]} numberOfLines={2}>
              {service.description}
            </Text>
          ) : null}
        </View>

        {/* Price & Add Action Button Column */}
        <View style={styles.actionCol}>
          <Text style={[styles.price, { color: theme.ink }]}>
            {paiseToINR(service.price)}
          </Text>

          <TouchableOpacity
            style={styles.addBtnRow}
            onPress={() => onSelect && onSelect(service)}
            activeOpacity={0.8}
          >
            <Text style={[styles.addBtnText, { color: selected ? theme.primary : theme.primary }]}>
              {selected ? "Added" : "Add"}
            </Text>
            <Ionicons
              name={selected ? "checkmark-circle" : "add-circle-outline"}
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ServiceCard);

function getStyles() {
  return StyleSheet.create({
    card: {
      borderRadius: 18,
      padding: S.sm,
      marginBottom: S.sm,
      borderWidth: 1,
    },
    cardInnerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: S.sm,
    },
    iconCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      display: 'none'
    },
    infoCol: {
      flex: 1,
    },
    categoryEyebrow: {
      fontSize: 10,
      fontWeight: FW.bold,
      letterSpacing: 1.0,
      marginBottom: 3,
    },
    name: {
      fontSize: 14,
      fontWeight: FW.bold,
      marginBottom: 3,
    },
    description: {
      fontSize: 11,
      lineHeight: 17,
    },
    actionCol: {
      alignItems: "flex-end",
      justifyContent: "space-between",
      height: "100%",
      minHeight: 52,
    },
    price: {
      fontSize: 16,
      fontWeight: FW.bold,
    },
    addBtnRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
    },
    addBtnText: {
      fontSize: 12,
      fontWeight: FW.bold,
    },
  });
}
