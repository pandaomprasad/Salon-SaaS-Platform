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

  // Extract width/flex layout properties so Pressable container expands correctly
  const flatStyle = StyleSheet.flatten(style) || {};
  const containerLayout = {
    width: flatStyle.width,
    flex: flatStyle.flex,
    alignSelf: flatStyle.alignSelf || (flatStyle.width === "100%" ? "stretch" : undefined),
    margin: flatStyle.margin,
    marginTop: flatStyle.marginTop,
    marginBottom: flatStyle.marginBottom,
    marginLeft: flatStyle.marginLeft,
    marginRight: flatStyle.marginRight,
    marginVertical: flatStyle.marginVertical,
    marginHorizontal: flatStyle.marginHorizontal,
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={containerLayout}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
