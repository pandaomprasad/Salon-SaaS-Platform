// src/components/AppleTouchable.jsx
import React, { useRef } from "react";
import { Animated, Pressable } from "react-native";
import { APPLE_SPRINGS, triggerHaptic } from "../theme/appleMotion";

/**
 * 🍎 AppleTouchable Component
 * Replaces generic TouchableOpacity with a physical spring-scaled,
 * instant-haptic pressable element following Apple's WWDC motion principles.
 */
export default function AppleTouchable({
  children,
  onPress,
  style,
  scaleTo = 0.96,
  hapticType = "light",
  disabled = false,
  ...props
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    triggerHaptic(hapticType);
    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      tension: 180,
      friction: 14,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 16,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
