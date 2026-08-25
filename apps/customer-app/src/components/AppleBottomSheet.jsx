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
import { APPLE_SPRINGS, triggerHaptic } from "../theme/appleMotion";

const SCREEN_HEIGHT = Dimensions.get("window").height;

/**
 * 🍎 AppleBottomSheet Component
 * Interruptible, 1:1 touch-tracked, spring-driven bottom sheet modal
 * with velocity-sensitive dismissal & glassmorphic backdrop.
 */
export default function AppleBottomSheet({
  visible,
  onClose,
  children,
  height = SCREEN_HEIGHT * 0.75,
  title,
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Track live Y position for interruptibility
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
        // Prevent dragging above top limit (dy < 0) with rubberband dampening
        if (gestureState.dy < 0) {
          const rubberbandDy = gestureState.dy * 0.2;
          translateY.setValue(rubberbandDy);
        } else {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;

        // Dismiss if dragged down > 120px or flicked down rapidly (vy > 0.5)
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
          // Snap back open with spring bounce
          Animated.spring(translateY, {
            toValue: 0,
            ...APPLE_SPRINGS.sheetModal,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Glass Scrim Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
            <BlurView intensity={Platform.OS === "ios" ? 30 : 50} style={StyleSheet.absoluteFill} tint="dark" />
            <View style={styles.scrimDim} />
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Spring-Driven Interruptible Card Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { height, transform: [{ translateY }] },
          ]}
        >
          {/* Drag Handle Bar */}
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={styles.dragHandleBar} />
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
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  sheetContainer: {
    width: "100%",
    backgroundColor: "rgba(24, 24, 26, 0.96)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 24,
    overflow: "hidden",
  },
  dragHandleContainer: {
    width: "100%",
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandleBar: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  content: {
    flex: 1,
  },
});
