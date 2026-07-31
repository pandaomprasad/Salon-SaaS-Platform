// src/components/AnimatedBackgroundElements.jsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Platform } from "react-native";
import { BlurView } from "expo-blur";

export default function AnimatedBackgroundElements() {
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const starOpacity1 = useRef(new Animated.Value(0.4)).current;
  const starOpacity2 = useRef(new Animated.Value(0.5)).current;
  const starRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Orb 1 Gentle Pulse & Drift
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(orb1Scale, {
            toValue: 1.35,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Scale, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(orb1Y, {
            toValue: -30,
            duration: 4500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orb1Y, {
            toValue: 0,
            duration: 4500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Orb 2 Floating
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(orb2Scale, {
            toValue: 1.4,
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Scale, {
            toValue: 1,
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(orb2Y, {
            toValue: 35,
            duration: 5500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orb2Y, {
            toValue: 0,
            duration: 5500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Sparkles Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(starOpacity1, {
          toValue: 0.95,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(starOpacity1, {
          toValue: 0.3,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(starOpacity2, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(starOpacity2, {
          toValue: 0.35,
          duration: 2600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle Sparkle Rotation
    Animated.loop(
      Animated.timing(starRotate, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = starRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Ambient Gold Gaussian Blur Orb (Top Right) */}
      <Animated.View
        style={[
          styles.glowOrb,
          styles.orbGold,
          {
            transform: [{ translateY: orb1Y }, { scale: orb1Scale }],
          },
        ]}
      />

      {/* Ambient Warm Champagne Gaussian Blur Orb (Mid Left) */}
      <Animated.View
        style={[
          styles.glowOrb,
          styles.orbChampagne,
          {
            transform: [{ translateY: orb2Y }, { scale: orb2Scale }],
          },
        ]}
      />

      {/* Full Background Blur Mask for Soft Gaussian Glow */}
      <BlurView
        intensity={Platform.OS === "ios" ? 70 : 45}
        tint="light"
        style={StyleSheet.absoluteFill}
        experimentalBlurMethod="dimezis"
      />

      {/* Floating Animated Sparkles */}
      <Animated.View
        style={[
          styles.sparklePos,
          styles.sparkle1,
          { opacity: starOpacity1, transform: [{ rotate: spin }] },
        ]}
      >
        <Text style={styles.sparkleIcon}>✨</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.sparklePos,
          styles.sparkle2,
          { opacity: starOpacity2, transform: [{ rotate: spin }] },
        ]}
      >
        <Text style={styles.sparkleIconSmall}>✦</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.sparklePos,
          styles.sparkle3,
          { opacity: starOpacity1 },
        ]}
      >
        <Text style={styles.sparkleIcon}>✨</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.sparklePos,
          styles.sparkle4,
          { opacity: starOpacity2, transform: [{ rotate: spin }] },
        ]}
      >
        <Text style={styles.sparkleIconSmall}>✦</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowOrb: {
    position: "absolute",
    borderRadius: 220,
    opacity: 0.55,
    ...(Platform.OS === "web" ? { filter: "blur(60px)" } : {}),
  },
  orbGold: {
    top: 30,
    right: -40,
    width: 290,
    height: 290,
    backgroundColor: "rgba(212, 175, 55, 0.45)",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
  orbChampagne: {
    top: 360,
    left: -60,
    width: 320,
    height: 320,
    backgroundColor: "rgba(243, 229, 171, 0.55)",
    shadowColor: "#F3E5AB",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 45,
  },
  sparklePos: {
    position: "absolute",
    zIndex: 10,
  },
  sparkle1: {
    top: 130,
    left: 28,
  },
  sparkle2: {
    top: 270,
    right: 32,
  },
  sparkle3: {
    top: 540,
    left: 20,
  },
  sparkle4: {
    top: 720,
    right: 28,
  },
  sparkleIcon: {
    fontSize: 16,
    color: "#D4AF37",
  },
  sparkleIconSmall: {
    fontSize: 14,
    color: "#D4AF37",
    fontWeight: "900",
  },
});
