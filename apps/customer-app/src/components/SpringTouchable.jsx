// src/components/SpringTouchable.jsx
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { triggerHaptic } from "../theme/appleMotion";

/**
 * Clean Touchable Component (No Bounce Animation)
 */
export default function SpringTouchable({
  children,
  onPress,
  style,
  hapticType = "light",
  disabled = false,
  ...props
}) {
  const handlePress = (e) => {
    if (disabled) return;
    triggerHaptic(hapticType);
    if (onPress) onPress(e);
  };

  const flatStyle = StyleSheet.flatten(style) || {};

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        flatStyle,
        pressed && !disabled ? { opacity: 0.85 } : null,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
