// src/components/ServiceCard.jsx
import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

        {/* Radio Check Indicator */}
        <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
          {selected ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
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
          <Text style={[styles.price, selected && styles.priceSelected]}>
            {paiseToINR(service.price)}
          </Text>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  category: {
    fontSize: 9,
    fontWeight: "800",
    color: "#8E8880",
    letterSpacing: 1.2,
  },
  dot: {
    fontSize: 10,
    color: "#D4AF37",
  },
  duration: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8E8880",
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF9F6",
  },
  radioCircleSelected: {
    backgroundColor: "#D4AF37",
    borderColor: "#D4AF37",
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  infoArea: {
    flex: 1,
    paddingRight: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 12,
    color: "#77726A",
    marginTop: 4,
    lineHeight: 17,
    fontWeight: "400",
  },
  priceCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },
  priceSelected: {
    color: "#1A1A1A",
  },
  selectedBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    marginTop: 2,
  },
  selectedBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#B58C1B",
    letterSpacing: 0.8,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8E8880",
    marginTop: 4,
  },
});
