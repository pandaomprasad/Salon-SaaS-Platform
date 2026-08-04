// src/components/ServiceCard.jsx
import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { paiseToINR } from "../services/apiClient";

function ServiceCard({ service, selected, onSelect }) {
  const categoryName = (service.category || "General").toUpperCase();
  const duration = service.durationMinutes || service.duration || 30;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
      ]}
      onPress={() => onSelect && onSelect(service)}
      activeOpacity={0.88}
    >
      {/* Category & Selection Header */}
      <View style={styles.cardHeader}>
        <View style={styles.categoryRow}>
          <Text style={styles.category}>{categoryName}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.duration}>{duration} mins</Text>
        </View>

        {/* Radio Indicator */}
        <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
          {selected ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
        </View>
      </View>

      {/* Main Details & Price */}
      <View style={styles.mainRow}>
        <View style={styles.infoArea}>
          <Text style={styles.name}>{service.name}</Text>
          {service.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {service.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.priceCol}>
          <Text style={styles.price}>{paiseToINR(service.price)}</Text>
          {selected ? (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>SELECTED</Text>
            </View>
          ) : (
            <Text style={styles.addBtnText}>+ Add</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ServiceCard);

const styles = StyleSheet.create({
  // feature-card per cursor/DESIGN.md: 12px radius, white surface, hairline border, no shadows
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg, // 12px radius per cursor/DESIGN.md
    padding: S.md,
    marginBottom: S.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardSelected: {
    borderColor: C.main, // Cursor Orange border
    backgroundColor: C.surface,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: S.xs,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  category: {
    fontSize: 10,
    fontWeight: FW.semiBold,
    color: C.muted,
    letterSpacing: 0.88,
  },
  dot: {
    fontSize: 10,
    color: C.main,
  },
  duration: {
    fontSize: 10,
    fontWeight: FW.medium,
    color: C.muted,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.borderDark,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.lifted,
  },
  radioCircleSelected: {
    backgroundColor: C.main,
    borderColor: C.main,
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  infoArea: {
    flex: 1,
    paddingRight: S.sm,
  },
  name: {
    fontSize: FS.titleSm,
    fontWeight: FW.semiBold,
    color: C.ink,
    letterSpacing: 0,
  },
  description: {
    fontSize: FS.bodySm,
    color: C.body,
    marginTop: 4,
    lineHeight: 18,
  },
  priceCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  price: {
    fontSize: FS.titleSm,
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  selectedBadge: {
    backgroundColor: C.mainLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: R.pill,
    marginTop: 2,
  },
  selectedBadgeText: {
    fontSize: 9,
    fontWeight: FW.semiBold,
    color: C.main,
    letterSpacing: 0.88,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: FW.medium,
    color: C.muted,
    marginTop: 2,
  },
});
