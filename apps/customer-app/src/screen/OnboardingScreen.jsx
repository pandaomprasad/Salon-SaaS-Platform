// src/screen/OnboardingScreen.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  Easing,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { storage } from "../services/storage";
import { C } from "../theme";
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

const ONBOARDING_KEY = "@salon_app_has_onboarded";

// ── Design Tokens (Flat Black & White + #BD4444) ──────────────────
const COLORS = {
  canvas: C.bg,
  canvasSoft: C.lifted,
  surface: C.surface,
  ink: C.ink,
  body: C.textSecondary,
  muted: C.muted,
  mutedSoft: C.dustTaupe,
  primary: C.main,
  primaryActive: C.mainDark,
  onPrimary: C.bg,
  hairline: C.border,
  hairlineSoft: C.borderLight,
  hairlineStrong: C.borderDark,
  surfaceStrong: C.bone,
  // Monochrome decorations (hex so alpha suffixes concatenate cleanly)
  thinking: "#E0E0E0",
  grep: "#E0E0E0",
  read: "#E0E0E0",
  edit: "#E0E0E0",
  done: "#BD4444",
};

const SLIDES = [
  {
    id: "1",
    badge: "EXCLUSIVE SANCTUARY",
    title: "Discover Premium\nSalons & Spas",
    subtitle:
      "Explore top-rated luxury studios, handpicked beauty specialists & relaxing spa sanctuaries near you.",
    icon: "sparkles",
    accentPastel: COLORS.thinking,
    secondaryPastel: COLORS.edit,
    tertiaryPastel: COLORS.grep,
    decorIcon: "diamond-outline",
  },
  {
    id: "2",
    badge: "SEAMLESS BOOKING",
    title: "Reserve Slots &\nStylists Effortlessly",
    subtitle:
      "Select your preferred specialist, pick custom time slots, and confirm your appointment in seconds.",
    icon: "calendar",
    accentPastel: COLORS.grep,
    secondaryPastel: COLORS.read,
    tertiaryPastel: COLORS.thinking,
    decorIcon: "time-outline",
  },
  {
    id: "3",
    badge: "VIP PRIVILEGES",
    title: "Track Visits &\nUnlock Royal Perks",
    subtitle:
      "Get live appointment tracking, enjoy exclusive member rewards, and rebook your favorites with one tap.",
    icon: "trophy",
    accentPastel: COLORS.read,
    secondaryPastel: COLORS.done,
    tertiaryPastel: COLORS.edit,
    decorIcon: "gift-outline",
  },
];

export default function OnboardingScreen({ onFinish, navigate }) {
  const styles = getStyles();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const topInset = Math.max(insets.top, isAndroid ? (StatusBar.currentHeight || 24) : 12) + 8;
  const bottomInset = isAndroid ? Math.max(insets.bottom, 36) + 16 : Math.max(insets.bottom, 20) + 12;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  // ── Staggered entrance animations ──────────────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  // ── Continuous ambient loops ───────────────────────────────
  const orbFloat1 = useRef(new Animated.Value(0)).current;
  const orbFloat2 = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  // ── Micro-interactions ────────────────────────────────────
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entrance sequence — each element cascades in
    Animated.stagger(120, [
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(textAnim, {
        toValue: 1,
        tension: 55,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.spring(footerAnim, {
        toValue: 1,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();

    // Orb 1: slow dreamy float (Y + slight rotation feel via X)
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbFloat1, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbFloat1, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Orb 2: offset phase for organic feel
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbFloat2, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbFloat2, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Icon ring breathing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer sweep on CTA button — continuous subtle highlight
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ── Button press micro-interaction ─────────────────────────
  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 0.94,
        speed: 50,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      speed: 18,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await storage.setItem(ONBOARDING_KEY, "true");
    } catch (e) {
      console.log("Could not save onboarding state:", e);
    }
    if (onFinish) {
      onFinish();
    } else if (navigate) {
      navigate("Home");
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  // ── Slide Renderer ────────────────────────────────────────
  const renderSlide = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    // Card: scale + vertical float + subtle tilt
    const cardScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.82, 1, 0.82],
      extrapolate: "clamp",
    });

    const cardOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    const cardTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [40, 0, 40],
      extrapolate: "clamp",
    });

    const cardRotate = scrollX.interpolate({
      inputRange,
      outputRange: ["4deg", "0deg", "-4deg"],
      extrapolate: "clamp",
    });

    // Text: parallax counter-slide (text drifts opposite to scroll for depth)
    const textTranslateX = scrollX.interpolate({
      inputRange,
      outputRange: [60, 0, -60],
      extrapolate: "clamp",
    });

    const textOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    const textTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [20, 0, 20],
      extrapolate: "clamp",
    });

    // Subtitle lags slightly behind title for staggered depth
    const subtitleTranslateX = scrollX.interpolate({
      inputRange,
      outputRange: [90, 0, -90],
      extrapolate: "clamp",
    });

    // Badge parallax (drifts with card but delayed)
    const badgeTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [14, 0, 14],
      extrapolate: "clamp",
    });

    const badgeScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: "clamp",
    });

    // ── Ambient orb transforms ───────────────────────────────
    const orb1Y = orbFloat1.interpolate({
      inputRange: [0, 1],
      outputRange: [-8, 8],
    });
    const orb1X = orbFloat1.interpolate({
      inputRange: [0, 1],
      outputRange: [5, -5],
    });
    const orb1Scale = orbFloat1.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.08, 1],
    });

    const orb2Y = orbFloat2.interpolate({
      inputRange: [0, 1],
      outputRange: [6, -6],
    });
    const orb2X = orbFloat2.interpolate({
      inputRange: [0, 1],
      outputRange: [-4, 4],
    });
    const orb2Scale = orbFloat2.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.12, 1],
    });

    // Third orb — cross-phase for richness
    const orb3Y = orbFloat1.interpolate({
      inputRange: [0, 1],
      outputRange: [4, -4],
    });
    const orb3X = orbFloat2.interpolate({
      inputRange: [0, 1],
      outputRange: [3, -3],
    });

    // Icon pulse: gentle scale breathing
    const iconScale = iconPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.06],
    });

    // Icon ring outer pulse
    const ringScale = iconPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.04],
    });

    const ringOpacity = iconPulse.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 1, 0.6],
    });

    return (
      <View style={[styles.slideContainer, { width }]}>
        {/* ── Graphic Card ──────────────────────────────────── */}
        <Animated.View
          style={[
            styles.graphicCard,
            {
              transform: [{ scale: cardScale }, { translateY: cardTranslateY }, { rotate: cardRotate }],
              opacity: cardOpacity,
            },
          ]}
        >
          {/* Floating pastel orbs with scale breathing */}
          <Animated.View
            style={[
              styles.decorOrb,
              styles.decorOrbLarge,
              {
                backgroundColor: item.accentPastel + "28",
                transform: [
                  { translateY: orb1Y },
                  { translateX: orb1X },
                  { scale: orb1Scale },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.decorOrb,
              styles.decorOrbMed,
              {
                backgroundColor: item.secondaryPastel + "35",
                transform: [
                  { translateY: orb2Y },
                  { translateX: orb2X },
                  { scale: orb2Scale },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.decorOrb,
              styles.decorOrbTiny,
              {
                backgroundColor: item.tertiaryPastel + "30",
                transform: [
                  { translateY: orb3Y },
                  { translateX: orb3X },
                ],
              },
            ]}
          />

          {/* Pulsing accent ring behind icon */}
          <Animated.View
            style={[
              styles.iconAccentRing,
              {
                borderColor: item.accentPastel + "55",
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.iconInnerCircle,
                {
                  backgroundColor: item.accentPastel + "15",
                  transform: [{ scale: iconScale }],
                },
              ]}
            >
              <Ionicons name={item.icon} size={48} color={COLORS.ink} />
            </Animated.View>
          </Animated.View>

          {/* Floating decor badge with orbit float */}
          <Animated.View
            style={[
              styles.floatingDecorBadge,
              {
                backgroundColor: item.secondaryPastel + "22",
                borderColor: item.secondaryPastel + "45",
                transform: [
                  {
                    translateY: orbFloat2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, -4],
                    }),
                  },
                  {
                    translateX: orbFloat1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-2, 2],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name={item.decorIcon} size={15} color={COLORS.muted} />
          </Animated.View>

          {/* Second floating decor — bottom-left corner */}
          <Animated.View
            style={[
              styles.floatingDecorBadge2,
              {
                backgroundColor: item.tertiaryPastel + "20",
                borderColor: item.tertiaryPastel + "40",
                transform: [
                  {
                    translateY: orbFloat1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-3, 3],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="star-outline" size={12} color={COLORS.mutedSoft} />
          </Animated.View>

          {/* Badge pill with bounce entrance */}
          <Animated.View
            style={[
              styles.badgePill,
              {
                backgroundColor: item.accentPastel + "18",
                borderColor: item.accentPastel + "38",
                transform: [{ translateY: badgeTranslateY }, { scale: badgeScale }],
              },
            ]}
          >
            <Ionicons name="sparkles" size={10} color={COLORS.ink} style={{ marginRight: 5 }} />
            <Text style={styles.badgeText}>{item.badge}</Text>
          </Animated.View>
        </Animated.View>

        {/* ── Text Content with parallax depth ──────────────── */}
        <View style={styles.textContainer}>
          <Animated.Text
            style={[
              styles.titleText,
              {
                opacity: textOpacity,
                transform: [{ translateX: textTranslateX }, { translateY: textTranslateY }],
              },
            ]}
          >
            {item.title}
          </Animated.Text>
          <Animated.Text
            style={[
              styles.subtitleText,
              {
                opacity: textOpacity,
                transform: [{ translateX: subtitleTranslateX }, { translateY: textTranslateY }],
              },
            ]}
          >
            {item.subtitle}
          </Animated.Text>
        </View>
      </View>
    );
  };

  // ── CTA shimmer overlay position ──────────────────────────
  const shimmerTranslateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={COLORS.canvas} />

      {/* ── Header (staggered entrance: slide down + fade) ──── */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: topInset,
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.logoRow}>
          <Image
            source={require("../../assets/logo.png")}
            style={{ width: 36, height: 36, borderRadius: 8, marginRight: 8 }}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>ST CUT</Text>
        </View>

        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity
            onPress={completeOnboarding}
            style={styles.skipButton}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Carousel (staggered entrance: scale up) ──────── */}
      <Animated.View
        style={[
          styles.carouselWrapper,
          {
            opacity: cardAnim,
            transform: [
              {
                scale: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1],
                }),
              },
            ],
          },
        ]}
      >
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        />
      </Animated.View>

      {/* ── Footer (staggered entrance: slide up + fade) ──── */}
      <Animated.View
        style={[
          styles.footer,
          {
            paddingBottom: bottomInset,
            opacity: footerAnim,
            transform: [
              {
                translateY: footerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Animated expanding pagination dots */}
        <View style={styles.paginationRow}>
          {SLIDES.map((slide, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 32, 8],
              extrapolate: "clamp",
            });

            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.25, 1, 0.25],
              extrapolate: "clamp",
            });

            const dotHeight = scrollX.interpolate({
              inputRange,
              outputRange: [6, 6, 6],
              extrapolate: "clamp",
            });

            const backgroundColor = scrollX.interpolate({
              inputRange,
              outputRange: [COLORS.hairlineStrong, COLORS.primary, COLORS.hairlineStrong],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    height: dotHeight,
                    opacity: dotOpacity,
                    backgroundColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* CTA button with shimmer sweep + scale micro-interaction */}
        <Animated.View style={{ width: "100%", transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleNext}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.92}
          >
            {/* Shimmer sweep overlay */}
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX: shimmerTranslateX }],
                },
              ]}
            />

            <Text style={styles.ctaButtonText}>
              {currentIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
            </Text>
            <View style={styles.ctaArrowCircle}>
              <Ionicons
                name={currentIndex === SLIDES.length - 1 ? "checkmark" : "arrow-forward"}
                size={17}
                color={COLORS.onPrimary}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Terms hint on last slide */}
        {currentIndex === SLIDES.length - 1 && (
          <Text style={styles.termsHint}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
  // ── Root ──────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 16 : 8,
    height: 64,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  logoText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.ink,
    letterSpacing: 2,
    marginLeft: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
  },

  // ── Carousel Wrapper ──────────────────────────────────────
  carouselWrapper: {
    flex: 1,
  },

  // ── Slide ─────────────────────────────────────────────────
  slideContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  // ── Graphic Card ──────────────────────────────────────────
  graphicCard: {
    width: width - 56,
    height: height * 0.38,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.hairline,
    overflow: "hidden",
  },

  // ── Decorative Floating Orbs ──────────────────────────────
  decorOrb: {
    position: "absolute",
    borderRadius: 9999,
  },
  decorOrbLarge: {
    width: 170,
    height: 170,
    top: -35,
    right: -45,
  },
  decorOrbMed: {
    width: 110,
    height: 110,
    bottom: -25,
    left: -30,
  },
  decorOrbTiny: {
    width: 60,
    height: 60,
    top: 20,
    left: 30,
  },

  // ── Icon Ring ─────────────────────────────────────────────
  iconAccentRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  iconInnerCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Floating Decor Badges ─────────────────────────────────
  floatingDecorBadge: {
    position: "absolute",
    top: 18,
    right: 22,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  floatingDecorBadge2: {
    position: "absolute",
    bottom: 18,
    left: 22,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  // ── Badge Pill ────────────────────────────────────────────
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.ink,
    letterSpacing: 1.2,
  },

  // ── Text Content ──────────────────────────────────────────
  textContainer: {
    marginTop: 30,
    alignItems: "center",
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  titleText: {
    fontSize: 28,
    fontWeight: "400",
    color: COLORS.ink,
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: "400",
    color: COLORS.body,
    textAlign: "center",
    lineHeight: 23,
    marginTop: 12,
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 36 : 28,
    alignItems: "center",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 16,
    marginBottom: 24,
  },
  dot: {
    borderRadius: 3,
    marginHorizontal: 4,
  },

  // ── CTA Button ────────────────────────────────────────────
  ctaButton: {
    width: "100%",
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 80,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    // Angled via skew not available natively — use a wide band
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.onPrimary,
    letterSpacing: 0.2,
  },
  ctaArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryActive,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  // ── Terms Hint ────────────────────────────────────────────
  termsHint: {
    fontSize: 11,
    fontWeight: "400",
    color: COLORS.mutedSoft,
    textAlign: "center",
    marginTop: 14,
    letterSpacing: 0.1,
  },
  });
}