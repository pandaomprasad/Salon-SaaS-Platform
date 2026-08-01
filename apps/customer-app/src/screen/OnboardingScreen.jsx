// src/screen/OnboardingScreen.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StatusBar,
  Platform,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../services/storage";

const { width, height } = Dimensions.get("window");

const ONBOARDING_KEY = "@salon_app_has_onboarded";

const SLIDES = [
  {
    id: "1",
    badge: "EXCLUSIVE SANCTUARY",
    title: "Discover Premium\nSalons & Spas",
    subtitle:
      "Explore top-rated luxury studios, handpicked beauty specialists & relaxing spa sanctuaries near you.",
    icon: "sparkles",
    accentColor: "#FFFFFF",
    bgGlow: "rgba(255, 255, 255, 0.06)",
  },
  {
    id: "2",
    badge: "SEAMLESS BOOKING",
    title: "Reserve Slots &\nStylists Effortlessly",
    subtitle:
      "Select your preferred specialist, pick custom time slots, and confirm your appointment in seconds.",
    icon: "calendar",
    accentColor: "#E8E8E8",
    bgGlow: "rgba(232, 232, 232, 0.06)",
  },
  {
    id: "3",
    badge: "VIP PRIVILEGES",
    title: "Track Visits &\nUnlock Royal Perks",
    subtitle:
      "Get live appointment tracking, enjoy exclusive member rewards, and rebook your favorites with one tap.",
    icon: "trophy",
    accentColor: "#D6D6D6",
    bgGlow: "rgba(214, 214, 214, 0.06)",
  },
];

export default function OnboardingScreen({ onFinish, navigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  // Entrance transition: header + footer fade/slide up on first mount
  const mountAnim = useRef(new Animated.Value(0)).current;
  // Micro-interaction: button compresses slightly on press
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      speed: 40,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      speed: 30,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

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

  const renderSlide = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    // Smooth Interpolations for Card Scale and Opacity
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: "clamp",
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [20, 0, 20],
      extrapolate: "clamp",
    });

    // Subtle parallax rotation as cards drift past — makes the paging feel
    // less like a hard cut and more like a continuous motion.
    const rotate = scrollX.interpolate({
      inputRange,
      outputRange: ["6deg", "0deg", "-6deg"],
      extrapolate: "clamp",
    });

    return (
      <View style={[styles.slideContainer, { width }]}>
        <Animated.View
          style={[
            styles.graphicCard,
            {
              transform: [{ scale }, { translateY }, { rotate }],
              opacity,
            },
          ]}
        >
          {/* Subtle Background Glow Circle */}
          <View style={[styles.glowRing, { backgroundColor: item.bgGlow }]} />

          {/* Icon Container with Dual Glass Border */}
          <View style={[styles.iconOuterRing, { borderColor: item.accentColor + "40" }]}>
            <View style={[styles.iconInnerCircle, { backgroundColor: item.accentColor + "12" }]}>
              <Ionicons name={item.icon} size={60} color={item.accentColor} />
            </View>
          </View>

          {/* Glassmorphic Category Badge */}
          <View style={styles.badgeContainer}>
            <Ionicons name="sparkles" size={12} color={item.accentColor} style={{ marginRight: 6 }} />
            <Text style={[styles.badgeText, { color: item.accentColor }]}>{item.badge}</Text>
          </View>
        </Animated.View>

        {/* Text Content */}
        <Animated.View style={[styles.textContainer, { opacity }]}>
          <Text style={styles.titleText}>{item.title}</Text>
          <Text style={styles.subtitleText}>{item.subtitle}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header Bar */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: mountAnim,
            transform: [
              {
                translateY: mountAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.logoRow}>
          <View style={styles.miniLogoCircle}>
            <Ionicons name="cut" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.logoText}>SALON LUXE</Text>
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

      {/* Horizontal Paging Carousel */}
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

      {/* Bottom Footer & Navigation */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: mountAnim,
            transform: [
              {
                translateY: mountAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Animated Expanding Pagination Indicators */}
        <View style={styles.paginationRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 30, 8],
              extrapolate: "clamp",
            });

            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.25, 1, 0.25],
              extrapolate: "clamp",
            });

            const backgroundColor = scrollX.interpolate({
              inputRange,
              outputRange: ["rgba(255, 255, 255, 0.2)", "#FFFFFF", "rgba(255, 255, 255, 0.2)"],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Primary Action Button */}
        <Animated.View style={{ width: "100%", transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleNext}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.88}
          >
            <Text style={styles.actionButtonText}>
              {currentIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
            </Text>
            <View style={styles.arrowCircle}>
              <Ionicons
                name={currentIndex === SLIDES.length - 1 ? "checkmark" : "arrow-forward"}
                size={18}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
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
  miniLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  logoText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2.5,
    marginLeft: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  skipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B8B8B8",
  },
  slideContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  graphicCard: {
    width: width - 56,
    height: height * 0.38,
    borderRadius: 36,
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.14)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 14,
    overflow: "hidden",
  },
  glowRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  iconOuterRing: {
    width: 124,
    height: 124,
    borderRadius: 62,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  iconInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 26,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  textContainer: {
    marginTop: 34,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8A8A8A",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 12,
  },
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
    marginBottom: 28,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionButton: {
    width: "100%",
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 9,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 0.5,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});