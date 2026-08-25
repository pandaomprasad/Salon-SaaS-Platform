// src/theme/appleMotion.js
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * 🍎 Apple Motion & Materials Design Tokens
 * Based on WWDC fluid interface & physics design doctrine
 */

// 1. Spring Physics Configs for React Native Animated.spring / Reanimated
export const APPLE_SPRINGS = {
  // Default UI (menus, tab switches, toggles): Critically damped (1.0), zero bounce
  defaultUI: {
    tension: 200,
    friction: 26,
    useNativeDriver: true,
  },
  // Sheet / Modal Open-Close: Damping ~0.8, slight physical bounce
  sheetModal: {
    tension: 240,
    friction: 20,
    useNativeDriver: true,
  },
  // Card repositioning / Rebook capsule
  cardReposition: {
    tension: 190,
    friction: 25,
    useNativeDriver: true,
  },
  // Flick / Drag release momentum
  momentumFlick: {
    tension: 260,
    friction: 18,
    useNativeDriver: true,
  },
};

// 2. Apple Typography System (§6)
export const APPLE_TYPO = {
  heroTitle: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  bodyText: {
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: 0,
    lineHeight: 22,
  },
  metadata: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.15,
    lineHeight: 18,
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 26,
  },
};

// 3. Apple Haptic Triggers (§3)
export const triggerHaptic = (type = "light") => {
  try {
    if (type === "light") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === "medium") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === "heavy") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (type === "selection") {
      Haptics.selectionAsync();
    } else if (type === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (e) {
    // Graceful fallback on unsupported platforms
  }
};

// 4. Rubberbanding Math Function (§3)
export const rubberband = (overshoot, dimension = 300, constant = 0.55) => {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
};

// 5. Projected Momentum Landing Point Math (§3)
export const projectMomentum = (velocity, decel = 0.998) => {
  return (velocity / 1000) * decel / (1 - decel);
};
