// src/components/SlideToConfirm.jsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  ActivityIndicator,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Safely attempt to load expo-haptics with native Vibration fallback
let ExpoHaptics = null;
try {
  ExpoHaptics = require("expo-haptics");
} catch (e) {
  ExpoHaptics = null;
}

// Custom Haptic Vibration Patterns (ms offsets and duration sequences)
const CUSTOM_PATTERNS = {
  touchStart: [0, 6],
  stepLight: [0, 4],
  stepMedium: [0, 8, 12, 10],
  thresholdReach: [0, 12, 18, 14],
  bookingSuccess: [0, 35, 45, 65, 30, 85],
  resetBounce: [0, 8, 15, 6],
};

const triggerCustomHaptic = (patternName) => {
  try {
    const pattern = CUSTOM_PATTERNS[patternName] || CUSTOM_PATTERNS.stepLight;
    if (ExpoHaptics) {
      if (patternName === "bookingSuccess") {
        ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
      } else if (patternName === "thresholdReach" || patternName === "stepMedium") {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      } else if (patternName === "resetBounce") {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
      } else {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      }
    } else {
      Vibration.vibrate(pattern);
    }
  } catch (err) {
    // Fallback ignore
  }
};

export default function SlideToConfirm({
  onConfirm,
  disabled = false,
  submitting = false,
  priceText = "",
  label = "Slide to Confirm",
  disabledLabel = "Select Slot to Book",
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const isConfirmed = useRef(false);
  const lastStepRef = useRef(0);

  const KNOB_SIZE = 44;
  const KNOB_MARGIN = 3;
  const maxSlide = Math.max(0, trackWidth - KNOB_SIZE - KNOB_MARGIN * 2);

  // Refs to avoid stale closure issues in PanResponder
  const disabledRef = useRef(disabled);
  const submittingRef = useRef(submitting);
  const maxSlideRef = useRef(maxSlide);
  const onConfirmRef = useRef(onConfirm);

  useEffect(() => {
    disabledRef.current = disabled;
    submittingRef.current = submitting;
    maxSlideRef.current = maxSlide;
    onConfirmRef.current = onConfirm;
  }, [disabled, submitting, maxSlide, onConfirm]);

  const triggerConfirm = () => {
    if (isConfirmed.current || disabledRef.current || submittingRef.current) return;
    isConfirmed.current = true;

    // Trigger grand celebration custom haptic pattern
    triggerCustomHaptic("bookingSuccess");

    Animated.timing(translateX, {
      toValue: maxSlideRef.current,
      duration: 180,
      useNativeDriver: false,
    }).start(() => {
      if (onConfirmRef.current) onConfirmRef.current();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current && !submittingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !disabledRef.current && !submittingRef.current && Math.abs(gestureState.dx) > 2,

      onPanResponderGrant: () => {
        if (!disabledRef.current && !submittingRef.current) {
          lastStepRef.current = 0;
          triggerCustomHaptic("touchStart");
        }
      },

      onPanResponderMove: (_, gestureState) => {
        if (disabledRef.current || submittingRef.current || isConfirmed.current) return;
        const max = maxSlideRef.current;
        if (max <= 0) return;

        const newX = Math.max(0, Math.min(gestureState.dx, max));
        translateX.setValue(newX);

        // Continuous custom haptic steps (12 step resolution)
        const currentStep = Math.floor((newX / max) * 12);
        if (currentStep !== lastStepRef.current) {
          lastStepRef.current = currentStep;

          if (currentStep >= 11) {
            triggerCustomHaptic("thresholdReach");
          } else if (currentStep >= 8) {
            triggerCustomHaptic("stepMedium");
          } else {
            triggerCustomHaptic("stepLight");
          }
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        if (disabledRef.current || submittingRef.current || isConfirmed.current) return;
        const max = maxSlideRef.current;
        if (gestureState.dx >= max * 0.65) {
          triggerConfirm();
        } else {
          lastStepRef.current = 0;
          triggerCustomHaptic("resetBounce");
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            tension: 90,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Reset slider if submitting state finishes
  useEffect(() => {
    if (!submitting) {
      isConfirmed.current = false;
      lastStepRef.current = 0;
      Animated.spring(translateX, {
        toValue: 0,
        friction: 8,
        tension: 90,
        useNativeDriver: false,
      }).start();
    }
  }, [submitting, disabled]);

  const textOpacity = translateX.interpolate({
    inputRange: [0, Math.max(1, maxSlide * 0.5)],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.outerCapsule, disabled && styles.outerDisabled]}>
      {/* Total Payable Label & Price */}
      <View style={styles.priceBox}>
        <Text style={styles.priceLabel}>TOTAL PAYABLE</Text>
        <Text style={styles.priceValue}>{priceText}</Text>
      </View>

      {/* Interactive Swipe Track */}
      <View
        style={styles.trackContainer}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <Animated.View style={[styles.labelWrapper, { opacity: textOpacity }]} pointerEvents="none">
          <Text style={[styles.trackText, disabled && styles.trackTextDisabled]}>
            {disabled ? disabledLabel : `${label} →`}
          </Text>
        </Animated.View>

        {/* Draggable Knob */}
        <Animated.View
          style={[
            styles.knob,
            disabled && styles.knobDisabled,
            { transform: [{ translateX }] },
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#1A1A1A" />
          ) : (
            <Ionicons
              name="chevron-forward-sharp"
              size={20}
              color={disabled ? "#8E8880" : "#1A1A1A"}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerCapsule: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  outerDisabled: {
    backgroundColor: "#222222",
  },
  priceBox: {
    paddingRight: 12,
  },
  priceLabel: {
    color: "#8E8880",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  priceValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 1,
  },
  trackContainer: {
    flex: 1,
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    borderRadius: 25,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    padding: 3,
  },
  labelWrapper: {
    position: "absolute",
    left: 44,
    right: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  trackText: {
    color: "#E6CA65",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  trackTextDisabled: {
    color: "#78716C",
    fontWeight: "700",
  },
  knob: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E6CA65",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  knobDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
});
