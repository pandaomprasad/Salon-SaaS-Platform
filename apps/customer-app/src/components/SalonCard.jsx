// src/components/SalonCard.jsx
import React, { useRef, memo, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { S } from "../theme";
import { useSharedElement } from "../context/SharedElementContext";
import BouncyButton from "./BouncyButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=800&auto=format&fit=crop",
];

function SalonCard({ salon, onPress, isHorizontal = false, index = 0 }) {
  const cardRef = useRef(null);
  const layoutBoundsRef = useRef(null);
  const { startSharedTransition } = useSharedElement();

  const branchCount = salon.branches?.length || 1;
  const rating = (salon.rating || 4.8).toFixed(1);
  const coverImage = salon.coverImage || salon.image || DEMO_IMAGES[index % DEMO_IMAGES.length];

  const measureCard = useCallback(() => {
    if (cardRef.current && cardRef.current.measureInWindow) {
      cardRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          layoutBoundsRef.current = { x, y, width, height };
        }
      });
    }
  }, []);

  const handlePress = useCallback(() => {
    const bounds = layoutBoundsRef.current;
    if (startSharedTransition) {
      startSharedTransition(
        {
          image: coverImage,
          name: salon.name,
        },
        bounds || { x: 16, y: 120, width: SCREEN_WIDTH - 32, height: 380 }
      );
    }
    if (onPress) onPress(salon);
    measureCard();
  }, [salon, onPress, coverImage, startSharedTransition, measureCard]);

  const handleCall = useCallback((e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const phone = salon.phone || salon.contactPhone || salon.branches?.[0]?.phone || "+919876543210";
    Linking.openURL(`tel:${phone}`);
  }, [salon]);

  return (
    <View
      ref={cardRef}
      onLayout={measureCard}
      style={[
        styles.outerFrame,
        isHorizontal ? styles.horizontalCard : styles.fullWidthCard,
      ]}
    >
      {/* Inner Image Container */}
      <TouchableOpacity
        activeOpacity={0.94}
        onPress={handlePress}
        style={styles.innerImageContainer}
      >
        <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />

        {/* Bottom Gradient Panel */}
        <LinearGradient
          colors={[
            "rgba(10, 8, 15, 0)",
            "rgba(10, 8, 15, 0.55)",
            "rgba(8, 6, 12, 0.94)",
          ]}
          locations={[0, 0.35, 0.8]}
          style={styles.glassSheet}
        >
          {/* Title & Verified Badge Row */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {salon.name}
            </Text>
            <Ionicons name="checkmark-circle" size={17} color="#3B82F6" style={styles.verifiedIcon} />
          </View>

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {salon.description || "Premier luxury hair styling, facial glow treatments and spa therapy."}
          </Text>

          {/* Plain 3-Column Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <View style={styles.statValRow}>
                <Ionicons name="star" size={13} color="#E6CA65" style={{ marginRight: 3 }} />
                <Text style={styles.statValue}>{rating}</Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statValue}>{branchCount} Studio{branchCount > 1 ? "s" : ""}</Text>
              <Text style={styles.statLabel}>Locations</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statValue}>₹800+</Text>
              <Text style={styles.statLabel}>Starts From</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            {/* White Pill Button */}
            <BouncyButton style={styles.primaryBtn} onPress={handlePress}>
              <Ionicons name="sparkles" size={15} color="#D4AF37" style={{ marginRight: 6 }} />
              <Text style={styles.primaryBtnText}>View Services</Text>
              <Ionicons name="arrow-forward" size={14} color="#121016" style={{ marginLeft: 6 }} />
            </BouncyButton>

            {/* Glass Call Button */}
            <TouchableOpacity
              style={styles.callBtn}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

export default memo(SalonCard);

const styles = StyleSheet.create({
  outerFrame: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 32,
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  horizontalCard: {
    width: SCREEN_WIDTH * 0.78,
    marginRight: 16,
  },
  fullWidthCard: {
    width: "100%",
  },
  innerImageContainer: {
    height: 420,
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  glassSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 70,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255, 255, 255, 0.75)",
    marginBottom: 14,
    fontWeight: "400",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statValRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 3,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryBtnText: {
    color: "#121016",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  callBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
});