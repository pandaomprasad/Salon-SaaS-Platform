// src/screen/SplashScreen.jsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme";

const { width, height } = Dimensions.get("window");

// ── Flat B&W tokens (monochrome + #BD4444 highlight) ─────
const COLORS = {
  canvas: C.bg,
  surface: C.surface,
  ink: C.ink,
  body: C.textSecondary,
  muted: C.textMuted,
  primary: "#BD4444",
  primaryActive: "#9E3232",
  onPrimary: C.bg,
  hairline: C.border,
  // Monochrome soft orbs/dots
  thinking: "#D9D9D9",
  grep: "#D9D9D9",
  read: "#D9D9D9",
  edit: "#D9D9D9",
  done: "#BD4444",
};

export default function SplashScreen({ onFinish }) {
  const styles = getStyles();
  // ── Animation values ──────────────────────────────────────
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const iconSpin = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(30)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  // Floating orbs
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const orb3 = useRef(new Animated.Value(0)).current;

  // Progress bar
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Dot pulse
  const dotPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── Phase 1: Expanding rings (0-400ms) ─────────────────
    Animated.parallel([
      Animated.timing(ringOpacity, {
        toValue: 0.5,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(ringScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Ring 2 delayed
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ring2Opacity, {
          toValue: 0.3,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(ring2Scale, {
          toValue: 1,
          tension: 35,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }, 150);

    // ── Phase 2: Logo icon entrance (200-700ms) ────────────
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 65,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Subtle spin entrance for the scissors icon
        Animated.timing(iconSpin, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // ── Phase 3: Brand name slides up (500ms) ──────────────
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(textSlide, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    // ── Phase 4: Tagline fades in (750ms) ──────────────────
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(taglineSlide, {
          toValue: 0,
          tension: 55,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 750);

    // ── Floating orbs (start immediately, loop) ────────────
    const loopOrb = (anim, duration) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

    loopOrb(orb1, 3000).start();
    loopOrb(orb2, 3800).start();
    loopOrb(orb3, 2600).start();

    // ── Dot pulse loop ─────────────────────────────────────
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ── Progress bar fill (0 → 100% over 2s) ──────────────
    setTimeout(() => {
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, 600);

    // ── Phase 5: Exit transition (at 2400ms) ───────────────
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(exitAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onFinish) onFinish();
      });
    }, 2400);
  }, []);

  // ── Derived transforms ────────────────────────────────────
  const iconRotate = iconSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["-45deg", "0deg"],
  });

  const exitScale = exitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.08, 1],
  });

  const progressBarWidth = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Orb transforms
  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });
  const orb1X = orb1.interpolate({ inputRange: [0, 1], outputRange: [6, -6] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [8, -8] });
  const orb2X = orb2.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] });
  const orb3Y = orb3.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });
  const orb3X = orb3.interpolate({ inputRange: [0, 1], outputRange: [4, -4] });

  // Dot pulse scales
  const dot1Scale = dotPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });
  const dot2Scale = dotPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.6, 1],
  });
  const dot3Scale = dotPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.canvas }}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: exitAnim,
            transform: [{ scale: exitScale }],
          },
        ]}
      >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />

      {/* ── Background floating pastel orbs ──────────────── */}
      <Animated.View
        style={[
          styles.bgOrb,
          styles.bgOrb1,
          { transform: [{ translateY: orb1Y }, { translateX: orb1X }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bgOrb,
          styles.bgOrb2,
          { transform: [{ translateY: orb2Y }, { translateX: orb2X }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bgOrb,
          styles.bgOrb3,
          { transform: [{ translateY: orb3Y }, { translateX: orb3X }] },
        ]}
      />

      {/* ── Center logo composition ──────────────────────── */}
      <View style={styles.centerComposition}>
        {/* Expanding ring 2 (outer) */}
        <Animated.View
          style={[
            styles.ring,
            styles.ringOuter,
            {
              opacity: ring2Opacity,
              transform: [{ scale: ring2Scale }],
            },
          ]}
        />

        {/* Expanding ring 1 */}
        <Animated.View
          style={[
            styles.ring,
            styles.ringInner,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />

        {/* Logo icon circle */}
        <Animated.View
          style={[
            styles.logoCircle,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
            <Ionicons name="cut" size={32} color={COLORS.primary} />
          </Animated.View>
        </Animated.View>

        {/* Brand name */}
        <Animated.View
          style={[
            styles.brandRow,
            {
              opacity: textOpacity,
              transform: [{ translateY: textSlide }],
            },
          ]}
        >
          <Text style={styles.brandName}>SALON LUXE</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineSlide }],
          }}
        >
          <Text style={styles.tagline}>Premium Beauty, Effortlessly Booked</Text>
        </Animated.View>
      </View>

      {/* ── Bottom loading section ───────────────────────── */}
      <View style={styles.bottomSection}>
        {/* Loading dots */}
        <View style={styles.dotsRow}>
          <Animated.View
            style={[
              styles.loadingDot,
              styles.dot1,
              { transform: [{ scale: dot1Scale }] },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              styles.dot2,
              { transform: [{ scale: dot2Scale }] },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              styles.dot3,
              { transform: [{ scale: dot3Scale }] },
            ]}
          />
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressBarWidth },
            ]}
          />
        </View>
      </View>
      </Animated.View>
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Background Orbs ────────────────────────────────────────
  bgOrb: {
    position: "absolute",
    borderRadius: 9999,
  },
  bgOrb1: {
    width: 220,
    height: 220,
    top: height * 0.08,
    right: -60,
    backgroundColor: COLORS.thinking + "18",
  },
  bgOrb2: {
    width: 180,
    height: 180,
    bottom: height * 0.12,
    left: -50,
    backgroundColor: COLORS.edit + "18",
  },
  bgOrb3: {
    width: 120,
    height: 120,
    top: height * 0.35,
    left: width * 0.1,
    backgroundColor: COLORS.grep + "15",
  },

  // ── Center Composition ─────────────────────────────────────
  centerComposition: {
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Expanding Rings ────────────────────────────────────────
  ring: {
    position: "absolute",
    borderRadius: 9999,
    borderWidth: 1,
  },
  ringInner: {
    width: 140,
    height: 140,
    borderColor: COLORS.primary + "20",
    backgroundColor: COLORS.primary + "06",
  },
  ringOuter: {
    width: 200,
    height: 200,
    borderColor: COLORS.primary + "12",
    backgroundColor: COLORS.primary + "03",
  },

  // ── Logo Circle ────────────────────────────────────────────
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.hairline,
    marginBottom: 24,
  },

  // ── Brand Name ─────────────────────────────────────────────
  brandRow: {
    marginBottom: 10,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "400",        // Display weight 400 per DESIGN.md
    color: COLORS.ink,
    letterSpacing: 4,
  },

  // ── Tagline ────────────────────────────────────────────────
  tagline: {
    fontSize: 14,
    fontWeight: "400",
    color: COLORS.muted,
    letterSpacing: 0.3,
    textAlign: "center",
  },

  // ── Bottom Section ─────────────────────────────────────────
  bottomSection: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 60 : 48,
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 60,
  },

  // ── Loading Dots ───────────────────────────────────────────
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dot1: {
    backgroundColor: COLORS.thinking,
  },
  dot2: {
    backgroundColor: COLORS.primary,
  },
  dot3: {
    backgroundColor: COLORS.grep,
  },

  // ── Progress Bar ───────────────────────────────────────────
  progressTrack: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.hairline,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  });
}
