// src/components/ScreenTransition.jsx
import React, { useRef, useEffect } from "react";
import { Animated, Dimensions, StyleSheet } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ScreenTransition({ children, screenKey, isStackScreen }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animation value on screen change
    animVal.setValue(0);

    Animated.spring(animVal, {
      toValue: 1,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [screenKey]);

  // Interpolations for horizontal slide, opacity crossfade, and scale
  const translateX = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [isStackScreen ? SCREEN_WIDTH * 0.25 : 30, 0],
  });

  const opacity = animVal.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.7, 1],
  });

  const scale = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [isStackScreen ? 0.97 : 0.99, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateX }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
