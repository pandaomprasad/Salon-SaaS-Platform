// src/components/CategoryAccordionList.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { paiseToINR } from "../services/apiClient";
import SpringTouchable from "./SpringTouchable";

export default function CategoryAccordionList({
  services = [],
  selectedServices = [],
  onSelectService,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  // Group services by category
  const groupedCategories = React.useMemo(() => {
    const groups = {};
    services.forEach((s) => {
      const cat = (s.category || "General").trim();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return Object.keys(groups).map((catName) => ({
      name: catName,
      items: groups[catName],
    }));
  }, [services]);

  // Keep track of expanded category name (default: first category expanded)
  const [expandedCat, setExpandedCat] = useState(
    groupedCategories.length > 0 ? groupedCategories[0].name : null
  );

  const toggleCategory = (catName) => {
    try {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          220,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.opacity
        )
      );
    } catch (e) {}
    setExpandedCat((prev) => (prev === catName ? null : catName));
  };

  if (groupedCategories.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No services available at this time.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {groupedCategories.map((group) => {
        const isExpanded = expandedCat === group.name;
        const count = group.items.length;

        // Find if any service in this category is currently selected by customer
        const selectedInGroup = group.items.find((item) =>
          selectedServices.some(
            (sel) => (sel._id || sel.id) === (item._id || item.id)
          )
        );

        return (
          <View
            key={group.name}
            style={[
              styles.groupCardWrapper,
              (isExpanded || selectedInGroup) && styles.groupCardWrapperActive,
            ]}
          >
            {/* Category Accordion Header Capsule */}
            <TouchableOpacity
              style={[
                styles.accordionHeader,
                isExpanded && styles.accordionHeaderExpanded,
              ]}
              onPress={() => toggleCategory(group.name)}
              activeOpacity={0.88}
            >
              {/* Left: Category Name */}
              <Text
                style={[
                  styles.categoryTitle,
                  (isExpanded || selectedInGroup) && styles.categoryTitleActive,
                ]}
              >
                {group.name}
              </Text>

              {/* Right: Selected Sub-service Name + Price OR Count + Chevron */}
              <View style={styles.headerRightRow}>
                {selectedInGroup ? (
                  <View style={styles.selectedMetaCol}>
                    <Text style={styles.selectedSubName} numberOfLines={1}>
                      {selectedInGroup.name}
                    </Text>
                    <Text style={styles.selectedPriceText}>
                      +{paiseToINR(selectedInGroup.price)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.countText}>
                    {count} {count === 1 ? "type" : "types"}
                  </Text>
                )}

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={
                    isExpanded || selectedInGroup
                      ? C.purple || "#6C5CE7"
                      : isDark
                      ? "#94A3B8"
                      : "#8E8E93"
                  }
                  style={{ marginLeft: 6 }}
                />
              </View>
            </TouchableOpacity>

            {/* Sub-Services Content */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                {group.items.map((service, index) => {
                  const serviceId = service._id || service.id;
                  const isSelected = selectedServices.some(
                    (s) => (s._id || s.id) === serviceId
                  );
                  const isLast = index === group.items.length - 1;

                  return (
                    <View
                      key={serviceId}
                      style={[styles.serviceRow, isLast && styles.serviceRowLast]}
                    >
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceMeta}>
                          {service.durationMinutes || service.duration || 30} mins
                          {service.description ? ` • ${service.description}` : ""}
                        </Text>
                      </View>

                      <View style={styles.serviceRight}>
                        <Text style={styles.servicePrice}>
                          {paiseToINR(service.price)}
                        </Text>

                        <SpringTouchable
                          style={[
                            styles.selectBtn,
                            isSelected && styles.selectBtnActive,
                          ]}
                          onPress={() => onSelectService?.(service)}
                          scaleTo={0.92}
                          hapticType="light"
                        >
                          <Ionicons
                            name={isSelected ? "checkmark" : "add"}
                            size={16}
                            color={isSelected ? "#FFFFFF" : C.purple || "#6C5CE7"}
                          />
                        </SpringTouchable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function getStyles(theme, isDark) {
  const accentColor = C.purple || "#6C5CE7";

  return StyleSheet.create({
    container: {
      gap: 12,
    },
    groupCardWrapper: {
      borderRadius: 20,
      backgroundColor: isDark ? "#1C1C1E" : "#F4F5F8",
      borderWidth: 1.5,
      borderColor: "transparent",
      overflow: "hidden",
    },
    groupCardWrapperActive: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderColor: accentColor,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    accordionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      height: 56,
    },
    accordionHeaderExpanded: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#2A2A2C" : "#EBECEF",
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#94A3B8" : "#8E8E93",
    },
    categoryTitleActive: {
      color: accentColor,
      fontWeight: "800",
    },
    headerRightRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    countText: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#E2E8F0" : "#1A1A24",
    },
    selectedMetaCol: {
      alignItems: "flex-end",
    },
    selectedSubName: {
      fontSize: 13,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      maxWidth: 140,
    },
    selectedPriceText: {
      fontSize: 12,
      fontWeight: "800",
      color: accentColor,
      marginTop: 1,
    },
    expandedContent: {
      backgroundColor: isDark ? "#141416" : "#FFFFFF",
      paddingHorizontal: 18,
      paddingVertical: 8,
    },
    serviceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#262628" : "#F0F0F5",
    },
    serviceRowLast: {
      borderBottomWidth: 0,
    },
    serviceInfo: {
      flex: 1,
      marginRight: 12,
    },
    serviceName: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      marginBottom: 2,
    },
    serviceMeta: {
      fontSize: 12,
      color: isDark ? "#94A3B8" : "#8E8E93",
    },
    serviceRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    servicePrice: {
      fontSize: 15,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
    },
    selectBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "rgba(108, 92, 231, 0.2)" : "rgba(108, 92, 231, 0.12)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: accentColor,
    },
    selectBtnActive: {
      backgroundColor: accentColor,
    },
    emptyCard: {
      padding: 24,
      alignItems: "center",
      backgroundColor: isDark ? "#1C1C1E" : "#F4F5F8",
      borderRadius: 20,
    },
    emptyText: {
      color: isDark ? "#94A3B8" : "#8E8E93",
      fontSize: 14,
    },
  });
}
