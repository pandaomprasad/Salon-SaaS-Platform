// src/components/ComboServiceModal.jsx
import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, S, FS, FW, R, FONT_FAMILY } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { paiseToINR } from "../services/apiClient";
import AppleTouchable from "./AppleTouchable";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DEFAULT_COMBO_IMAGE =
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop";

const DEFAULT_INCLUDED_SERVICES = [
  "Hairstyling",
  "Nail",
  "Hair color",
  "Body Glowing",
  "Facial",
  "Spa",
  "Eyebrows",
  "Make up",
  "Retouch",
  "Corner Lashes",
];

function ComboServiceModal({
  visible,
  service,
  onClose,
  onSelectService,
  isSelected = false,
}) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(theme, isDark, insets), [theme, isDark, insets]);

  if (!service) return null;

  const coverImage =
    service.imageUrl || service.image || service.photoUrl || DEFAULT_COMBO_IMAGE;

  const includedList =
    Array.isArray(service.includedServices) && service.includedServices.length > 0
      ? service.includedServices
      : DEFAULT_INCLUDED_SERVICES;

  const offerTag =
    service.packageOfferTag ||
    service.offerTag ||
    "Completed Package Offer till sep 18, 2026";

  const description =
    service.description ||
    "Women want to feel attractive. We offer timeless beauty package to accentuate their natural beauty so they can feel beautiful in every day.";

  const durationMins = service.durationMinutes || service.duration || 120;

  const handleToggleSelect = () => {
    if (onSelectService) {
      onSelectService(service);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouchArea} />
        </TouchableWithoutFeedback>

        <View style={styles.sheetContainer}>
          {/* Top Grabber Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={20}
              color={isDark ? "#E2E8F0" : "#4A5568"}
            />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={true}
          >
            {/* Banner Image */}
            <View style={styles.imageCard}>
              <Image
                source={{ uri: coverImage }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
              <View style={styles.comboBadgePill}>
                <Text style={styles.comboBadgeText}>✦ ALL-IN-ONE COMBO</Text>
              </View>
            </View>

            {/* Title & Offer Subtitle */}
            <View style={styles.headerBlock}>
              <Text style={styles.titleText}>{service.name}</Text>
              {offerTag ? (
                <Text style={styles.offerSubtitleText}>{offerTag}</Text>
              ) : null}
            </View>

            {/* Description Text */}
            <Text style={styles.descriptionText}>{description}</Text>

            {/* Included Services Checklist */}
            <View style={styles.servicesSection}>
              <Text style={styles.servicesHeading}>Service</Text>

              <View style={styles.checklistGrid}>
                {includedList.map((item, index) => {
                  const label = typeof item === "string" ? item : item?.name || String(item);
                  return (
                    <View key={index} style={styles.checklistItem}>
                      <View style={styles.checkIconWrap}>
                        <Ionicons
                          name="checkmark"
                          size={15}
                          color="#22C55E"
                          style={styles.checkIcon}
                        />
                      </View>
                      <Text style={styles.checklistLabel} numberOfLines={1}>
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action / Price Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.priceMetaCol}>
              <Text style={styles.priceLabel}>TOTAL PACKAGE PRICE</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>
                  {paiseToINR(service.price)}
                </Text>
                <Text style={styles.durationValue}>
                  • {durationMins} mins
                </Text>
              </View>
            </View>

            <AppleTouchable
              style={[
                styles.actionBtn,
                isSelected && styles.actionBtnSelected,
              ]}
              onPress={handleToggleSelect}
              scaleTo={0.94}
              hapticType="medium"
            >
              <Ionicons
                name={isSelected ? "checkmark-circle" : "add-circle"}
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.actionBtnText}>
                {isSelected ? "Added to Booking" : "Select Package"}
              </Text>
            </AppleTouchable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default memo(ComboServiceModal);

function getStyles(theme, isDark, insets) {
  const bottomPadding = Math.max(insets.bottom, 16);

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.62)",
      justifyContent: "flex-end",
    },
    backdropTouchArea: {
      flex: 1,
    },
    sheetContainer: {
      backgroundColor: isDark ? "#141416" : "#FFFFFF",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: SCREEN_HEIGHT * 0.88,
      paddingTop: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 24,
    },
    handleContainer: {
      alignItems: "center",
      paddingVertical: 6,
    },
    handleBar: {
      width: 44,
      height: 4.5,
      borderRadius: 3,
      backgroundColor: isDark ? "#3A3A3C" : "#D1D5DB",
    },
    closeBtn: {
      position: "absolute",
      top: 14,
      right: 18,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "#242426" : "#F3F4F6",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 24,
    },
    imageCard: {
      width: "100%",
      height: 185,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: isDark ? "#222" : "#F0F0F0",
      marginBottom: 16,
      position: "relative",
    },
    bannerImage: {
      width: "100%",
      height: "100%",
    },
    comboBadgePill: {
      position: "absolute",
      top: 12,
      left: 12,
      backgroundColor: "rgba(15, 15, 13, 0.82)",
      paddingHorizontal: 10,
      paddingVertical: 4.5,
      borderRadius: R.pill,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.22)",
    },
    comboBadgeText: {
      color: "#FBBF24",
      fontSize: 10,
      fontWeight: FW.bold,
      letterSpacing: 0.6,
    },
    headerBlock: {
      marginBottom: 10,
    },
    titleText: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 21,
      fontWeight: "800",
      color: isDark ? "#F8FAFC" : "#1A1A24",
      lineHeight: 26,
      marginBottom: 4,
    },
    offerSubtitleText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#94A3B8" : "#8E8E93",
      letterSpacing: 0.2,
    },
    descriptionText: {
      fontSize: 13,
      lineHeight: 20,
      color: isDark ? "#CBD5E1" : "#4A5568",
      marginBottom: 20,
    },
    servicesSection: {
      marginBottom: 10,
    },
    servicesHeading: {
      fontSize: 16,
      fontWeight: "800",
      color: isDark ? "#F8FAFC" : "#1A1A24",
      marginBottom: 14,
    },
    checklistGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 12,
    },
    checklistItem: {
      width: "50%",
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 8,
    },
    checkIconWrap: {
      width: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    checkIcon: {
      fontWeight: "bold",
    },
    checklistLabel: {
      fontSize: 13.5,
      fontWeight: "600",
      color: isDark ? "#E2E8F0" : "#2D3748",
      flex: 1,
    },
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: bottomPadding,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#242426" : "#F1F2F4",
      backgroundColor: isDark ? "#141416" : "#FFFFFF",
    },
    priceMetaCol: {
      flex: 1,
    },
    priceLabel: {
      fontSize: 9.5,
      fontWeight: "700",
      color: isDark ? "#94A3B8" : "#8E8E93",
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
    },
    priceValue: {
      fontSize: 18,
      fontWeight: "900",
      color: isDark ? "#FFFFFF" : "#1A1A24",
    },
    durationValue: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#94A3B8" : "#718096",
    },
    actionBtn: {
      backgroundColor: C.blue || "#3B82F6",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: R.button,
      shadowColor: C.blue || "#3B82F6",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    actionBtnSelected: {
      backgroundColor: "#10B981",
      shadowColor: "#10B981",
    },
    actionBtnText: {
      color: "#FFFFFF",
      fontSize: 13.5,
      fontWeight: "700",
    },
  });
}
