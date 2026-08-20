// src/components/FilterModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO, FONT_FAMILY } from "../theme";
import { useTheme } from "../context/ThemeContext";

const RATING_OPTIONS = [
  { id: "all", label: "Any Rating" },
  { id: "4.0", label: "4.0+ ★" },
  { id: "4.5", label: "4.5+ ★ (Top Rated)" },
  { id: "4.8", label: "4.8+ ★ (Premier)" },
];

const PRICE_OPTIONS = [
  { id: "all", label: "All Prices" },
  { id: "budget", label: "₹ Budget (< ₹500)" },
  { id: "moderate", label: "₹₹ Moderate (₹500-₹1500)" },
  { id: "luxury", label: "₹₹₹ Luxury (₹1500+)" },
];

const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "rating", label: "Highest Rated" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "price_high", label: "Price: High to Low" },
];

const SERVICE_OPTIONS = [
  { id: "all", label: "All Services", icon: "sparkles-outline" },
  { id: "hair", label: "Hair Care & Cut", icon: "cut-outline" },
  { id: "facial", label: "Facials & Skin", icon: "water-outline" },
  { id: "nails", label: "Nails & Spa", icon: "color-palette-outline" },
  { id: "makeup", label: "Bridal & Makeup", icon: "rose-outline" },
];

export default function FilterModal({
  visible,
  filters = {},
  onApplyFilters,
  onClose,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  const [minRating, setMinRating] = useState(filters.minRating || "all");
  const [priceRange, setPriceRange] = useState(filters.priceRange || "all");
  const [sortBy, setSortBy] = useState(filters.sortBy || "recommended");
  const [serviceType, setServiceType] = useState(filters.serviceType || "all");

  useEffect(() => {
    if (visible) {
      setMinRating(filters.minRating || "all");
      setPriceRange(filters.priceRange || "all");
      setSortBy(filters.sortBy || "recommended");
      setServiceType(filters.serviceType || "all");
    }
  }, [visible, filters]);

  const activeCount = [
    minRating !== "all",
    priceRange !== "all",
    sortBy !== "recommended",
    serviceType !== "all",
  ].filter(Boolean).length;

  const handleReset = () => {
    setMinRating("all");
    setPriceRange("all");
    setSortBy("recommended");
    setServiceType("all");
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters({
        minRating,
        priceRange,
        sortBy,
        serviceType,
      });
    }
    if (onClose) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetContainer}>
              {/* Top Grabber Indicator */}
              <View style={styles.grabberRow}>
                <View style={styles.grabber} />
              </View>

              {/* Sheet Header */}
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eyebrow}>FILTER & REFINE</Text>
                  <Text style={styles.title}>Refine Search</Text>
                </View>

                {activeCount > 0 && (
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resetBtnText}>Reset All</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color={C.ink} />
                </TouchableOpacity>
              </View>

              {/* Filter Body Options */}
              <ScrollView
                style={styles.scrollBody}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. Sort By */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>SORT BY</Text>
                  <View style={styles.chipGrid}>
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = sortBy === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                          onPress={() => setSortBy(opt.id)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. Minimum Rating */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>MINIMUM RATING</Text>
                  <View style={styles.chipGrid}>
                    {RATING_OPTIONS.map((opt) => {
                      const isSelected = minRating === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                          onPress={() => setMinRating(opt.id)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Price Range */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>PRICE RANGE</Text>
                  <View style={styles.chipGrid}>
                    {PRICE_OPTIONS.map((opt) => {
                      const isSelected = priceRange === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                          onPress={() => setPriceRange(opt.id)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 4. Services */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>SERVICES & SPECIALTY</Text>
                  <View style={styles.chipGrid}>
                    {SERVICE_OPTIONS.map((opt) => {
                      const isSelected = serviceType === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                          onPress={() => setServiceType(opt.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={opt.icon}
                            size={14}
                            color={isSelected ? "#FFFFFF" : C.main}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Apply CTA Button */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleApply}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.applyBtnText}>
                    Apply Filters {activeCount > 0 ? `(${activeCount})` : ""}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function getStyles(theme, isDark) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      justifyContent: "flex-end",
    },
    sheetContainer: {
      backgroundColor: C.bg,
      borderTopLeftRadius: R.xl,
      borderTopRightRadius: R.xl,
      maxHeight: "85%",
      paddingBottom: Platform.OS === "ios" ? 34 : 20,
      borderTopWidth: 1,
      borderColor: C.border,
    },
    grabberRow: {
      alignItems: "center",
      paddingVertical: S.xs + 2,
    },
    grabber: {
      width: 40,
      height: 4,
      borderRadius: R.full,
      backgroundColor: C.mutedSoft || C.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: S.md,
      paddingBottom: S.sm,
      borderBottomWidth: 1,
      borderColor: C.border,
    },
    eyebrow: {
      ...TYPO.eyebrow,
      color: C.main,
      fontSize: 10,
      letterSpacing: 1.2,
    },
    title: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 22,
      fontWeight: FW.bold,
      color: C.ink,
      marginTop: 1,
    },
    resetBtn: {
      paddingHorizontal: S.sm,
      paddingVertical: 6,
      marginRight: S.xs,
    },
    resetBtnText: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
      color: C.main,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollBody: {
      maxHeight: 420,
    },
    scrollContent: {
      padding: S.md,
      gap: S.md,
    },
    section: {
      gap: S.xs,
    },
    sectionTitle: {
      ...TYPO.eyebrow,
      fontSize: 10,
      color: C.muted,
      letterSpacing: 1,
      marginBottom: 4,
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.surface,
      paddingHorizontal: S.sm + 2,
      paddingVertical: 8,
      borderRadius: R.pill,
      borderWidth: 1,
      borderColor: C.border,
    },
    chipSelected: {
      backgroundColor: C.main,
      borderColor: C.main,
    },
    chipText: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
      color: C.ink,
    },
    chipTextSelected: {
      color: "#FFFFFF",
      fontWeight: FW.bold,
    },
    footer: {
      paddingHorizontal: S.md,
      paddingTop: S.sm,
    },
    applyBtn: {
      backgroundColor: C.main,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: R.button,
    },
    applyBtnText: {
      color: "#FFFFFF",
      fontSize: FS.body,
      fontWeight: FW.bold,
      letterSpacing: 0.2,
    },
  });
}
