// src/components/BouncyButton.jsx
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

export default function BouncyButton({ children, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    // 1. Subtle Gentle Press Down (95% size)
    Animated.spring(scale, {
      toValue: 0.95,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    // 2. Gentle Release Micro-Bounce (102% then smooth settle to 100%)
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.02,
        friction: 8,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.0,
        friction: 8,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const flatStyle = StyleSheet.flatten(style) || {};
  const isAbsolute = flatStyle.position === "absolute";
  const pressableStyle = isAbsolute
    ? {
        position: "absolute",
        top: flatStyle.top,
        left: flatStyle.left,
        right: flatStyle.right,
        bottom: flatStyle.bottom,
        zIndex: flatStyle.zIndex,
      }
    : null;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={pressableStyle}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
