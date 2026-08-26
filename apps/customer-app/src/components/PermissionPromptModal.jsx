// src/components/PermissionPromptModal.jsx
import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "../theme";
import { useTheme } from "../context/ThemeContext";
import SpringTouchable from "./SpringTouchable";

export default function PermissionPromptModal({
  visible,
  type = "location", // "location" | "notification"
  onEnable,
  onSkip,
  loading = false,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 12) + 12;

  const translateY = useRef(new Animated.Value(-400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 160,
          friction: 18,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -400,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const isLocation = type === "location";
  const title = isLocation ? "Enable Location" : "Enable Notifications";
  const subtitle = isLocation
    ? "We need to know your location in order to suggest nearby services."
    : "Enable notifications to receive instant appointment updates, reminders, and exclusive offer alerts.";

  return (
    <Modal
      visible={!!visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onSkip}
    >
      <TouchableWithoutFeedback onPress={onSkip}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.cardContainer,
                { marginTop: topInset, transform: [{ translateY }] },
              ]}
            >
              {/* Optional Close X Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onSkip}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color={styles.closeIconColor.color} />
              </TouchableOpacity>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Soft Purple Circular Illustration Badge */}
              <View style={styles.illustrationCircle}>
                <Ionicons
                  name={isLocation ? "location" : "notifications"}
                  size={42}
                  color={C.purple || "#6C5CE7"}
                />
              </View>

              {/* Description Subtext */}
              <Text style={styles.subtitle}>{subtitle}</Text>

              {/* Primary Action Button: Enable */}
              <SpringTouchable
                style={styles.enableBtn}
                onPress={onEnable}
                disabled={loading}
                scaleTo={0.96}
                hapticType="medium"
              >
                <Text style={styles.enableBtnText}>Enable</Text>
              </SpringTouchable>

              {/* Bottom Drag Handle Pill */}
              <View style={styles.bottomHandleBar} />
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function getStyles(theme, isDark) {
  const accentColor = C.purple || "#6C5CE7";

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-start",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    cardContainer: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 32,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#2A2A2C" : "#EBECEF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 16,
      position: "relative",
    },
    closeBtn: {
      position: "absolute",
      top: 16,
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "#2A2A2C" : "#F0F1F5",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    closeIconColor: {
      color: isDark ? "#94A3B8" : "#64748B",
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      textAlign: "center",
      marginTop: 4,
      marginBottom: 20,
      letterSpacing: -0.4,
    },
    illustrationCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: isDark ? "rgba(108, 92, 231, 0.2)" : "rgba(108, 92, 231, 0.12)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: "400",
      color: isDark ? "#94A3B8" : "#71717A",
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    enableBtn: {
      width: "100%",
      alignSelf: "stretch",
      height: 52,
      backgroundColor: accentColor,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
      marginBottom: 16,
    },
    enableBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
      letterSpacing: -0.2,
    },
    bottomHandleBar: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.12)",
      marginTop: 4,
    },
  });
}
