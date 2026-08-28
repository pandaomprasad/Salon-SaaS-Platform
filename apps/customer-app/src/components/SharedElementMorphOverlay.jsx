// src/components/SharedElementMorphOverlay.jsx
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Image, Dimensions, Easing } from "react-native";
import { useSharedElement } from "../context/SharedElementContext";
import { C } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TARGET_HEIGHT = 240;
const TARGET_TOP = 52;
const TARGET_LEFT = 16;
const TARGET_WIDTH = SCREEN_WIDTH - 32;

export default function SharedElementMorphOverlay() {
  const styles = getStyles();
  const { activeSharedElement, clearSharedElement } = useSharedElement();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeSharedElement) {
      if (activeSharedElement.onComplete) {
        activeSharedElement.onComplete();
      }

      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 320,
        easing: Easing.bezier(0.5, 0.5, 0.5, 0.5), // Smooth Apple-style fluid curve
        useNativeDriver: true,
      }).start(() => {
        clearSharedElement();
      });
    }
  }, [activeSharedElement]);

  if (!activeSharedElement || !activeSharedElement.bounds) {
    return null;
  }

  const { bounds, image, direction } = activeSharedElement;
  const isReverse = direction === "reverse";

  const w0 = bounds.width || TARGET_WIDTH;
  const h0 = bounds.height || 340;
  const x0 = bounds.x || TARGET_LEFT;
  const y0 = bounds.y || 100;

  const targetCenterX = TARGET_LEFT + (TARGET_WIDTH - w0) / 2;
  const targetCenterY = TARGET_TOP + (TARGET_HEIGHT - h0) / 2;

  const startX = isReverse ? targetCenterX : x0;
  const endX = isReverse ? x0 : targetCenterX;

  const startY = isReverse ? targetCenterY : y0;
  const endY = isReverse ? y0 : targetCenterY;

  const startScaleX = isReverse ? TARGET_WIDTH / w0 : 1;
  const endScaleX = isReverse ? 1 : TARGET_WIDTH / w0;

  const startScaleY = isReverse ? TARGET_HEIGHT / h0 : 1;
  const endScaleY = isReverse ? 1 : TARGET_HEIGHT / h0;

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, endY],
  });
  const scaleX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [startScaleX, endScaleX],
  });
  const scaleY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [startScaleY, endScaleY],
  });

  // Silky smooth opacity crossfade into destination screen
  const opacity = anim.interpolate({
    inputRange: [0, 0.82, 1],
    outputRange: isReverse ? [1, 0.5, 0] : [1, 0.6, 0],
  });

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.floatingMorphCard,
          {
            width: w0,
            height: h0,
            opacity,
            transform: [
              { translateX },
              { translateY },
              { scaleX },
              { scaleY },
            ],
          },
        ]}
      >
        <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </Animated.View>
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    overlayContainer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 99999,
    },
    floatingMorphCard: {
      position: "absolute",
      top: 0,
      left: 0,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: C.surface,
    },
  });
}
