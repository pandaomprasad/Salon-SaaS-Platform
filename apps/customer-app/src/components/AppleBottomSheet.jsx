// src/components/AppleBottomSheet.jsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Modal,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../context/ThemeContext";
import { APPLE_SPRINGS, triggerHaptic } from "../theme/appleMotion";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function AppleBottomSheet({
  visible,
  onClose,
  children,
  height = SCREEN_HEIGHT * 0.75,
  title,
}) {
  const { isDark } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);

  useEffect(() => {
    if (visible) {
      triggerHaptic("medium");
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          ...APPLE_SPRINGS.sheetModal,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: SCREEN_HEIGHT,
          tension: 260,
          friction: 22,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation((value) => {
          lastY.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          const rubberbandDy = gestureState.dy * 0.2;
          translateY.setValue(rubberbandDy);
        } else {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        if (dy > 120 || vy > 0.5) {
          triggerHaptic("light");
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: SCREEN_HEIGHT,
              tension: 260,
              friction: 20,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 180,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (onClose) onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            ...APPLE_SPRINGS.sheetModal,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  const sheetBg = isDark ? "#181820" : "#FFFFFF";
  const sheetBorder = isDark ? "#282834" : "#EFEFF4";
  const handleColor = isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Glass Scrim Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
            {Platform.OS === "ios" ? (
              <BlurView intensity={30} style={StyleSheet.absoluteFill} tint={isDark ? "dark" : "light"} />
            ) : null}
            <View style={[styles.scrimDim, { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)" }]} />
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Spring-Driven Interruptible Card Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              height,
              backgroundColor: sheetBg,
              borderColor: sheetBorder,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle Bar */}
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={[styles.dragHandleBar, { backgroundColor: handleColor }]} />
          </View>

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  scrimDim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 24,
    overflow: "hidden",
  },
  dragHandleContainer: {
    width: "100%",
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandleBar: {
    width: 38,
    height: 5,
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
});
