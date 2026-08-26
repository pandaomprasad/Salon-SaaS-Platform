// src/components/SpringTouchable.jsx
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { APPLE_SPRINGS, triggerHaptic } from "../theme/appleMotion";

/**
 * ⚡ SpringTouchable Component
 * Replaces generic TouchableOpacity with a physical spring-scaled,
 * instant-haptic pressable element following fluid motion principles.
 */
export default function SpringTouchable({
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

  // Extract layout properties for Pressable container
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

  // Inner animated view fills 100% of Pressable container width
  const innerStyle = {
    ...flatStyle,
    width: flatStyle.width !== undefined ? "100%" : undefined,
    flex: flatStyle.flex !== undefined ? 1 : undefined,
    margin: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    marginVertical: 0,
    marginHorizontal: 0,
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
      <Animated.View style={[innerStyle, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
