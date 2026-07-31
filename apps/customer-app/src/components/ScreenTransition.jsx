// src/components/ScreenTransition.jsx
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Dimensions, StyleSheet, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const IOS_SHEET_EASING = Easing.out(Easing.cubic);

export default function ScreenTransition({ children, screenKey, isStackScreen = false }) {
  const translateYAnim = useRef(new Animated.Value(isStackScreen ? SCREEN_HEIGHT : 0)).current;
  const fadeAnim = useRef(new Animated.Value(isStackScreen ? 0 : 0.5)).current;

  useEffect(() => {
    if (isStackScreen) {
      // Smooth Scale-Fade for Stack Screens (integrates perfectly with shared element morph)
      translateYAnim.setValue(0);
      fadeAnim.setValue(0);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        easing: IOS_SHEET_EASING,
        useNativeDriver: true,
      }).start();
    } else {
      // Tab Cross-Fade
      fadeAnim.setValue(0.5);
      translateYAnim.setValue(0);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    }
  }, [screenKey, isStackScreen]);

  return (
    <View style={styles.outerWrap}>
      {isStackScreen ? (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        />
      ) : null}

      <Animated.View
        style={[
          styles.container,
          isStackScreen
            ? {
                transform: [{ translateY: translateYAnim }],
                opacity: fadeAnim,
              }
            : {
                opacity: fadeAnim,
              },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  container: {
    flex: 1,
  },
});
