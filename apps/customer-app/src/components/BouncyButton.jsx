// src/components/BouncyButton.jsx
import React from "react";
import { Pressable, View, StyleSheet } from "react-native";

/**
 * BouncyButton component - Updated to remove bounce scale/spring animations on press.
 */
export default function BouncyButton({ children, onPress, style, ...props }) {
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
      onPress={onPress}
      style={({ pressed }) => [
        pressableStyle,
        pressed ? { opacity: 0.85 } : null,
      ]}
      {...props}
    >
      <View style={style}>
        {children}
      </View>
    </Pressable>
  );
}
