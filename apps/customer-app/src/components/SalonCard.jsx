import React, { useRef, memo, useCallback } from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import VerifiedBadge from "./VerifiedBadge";
import { C, S, FS, FW, R, TYPO, SHADOWS, FONT_FAMILY } from "../theme";
import { useSharedElement } from "../context/SharedElementContext";
import { useFavorites } from "../context/FavoritesContext";
import BouncyButton from "./BouncyButton";
import AppleTouchable from "./AppleTouchable";

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
  const { isFavorite, toggleFavorite } = useFavorites();

  const numericRating = typeof salon.rating === "number" ? salon.rating : parseFloat(salon.rating || 4.8);
  const ratingStr = numericRating.toFixed(1);
  const isTopRated = numericRating >= 4.5;
  const coverImage = salon.coverImage || salon.image || DEMO_IMAGES[index % DEMO_IMAGES.length];
  const branchCount = salon.branches?.length || 1;
  const isFav = isFavorite(salon._id || salon.id);

  const measureCard = useCallback(() => {
    if (cardRef.current && cardRef.current.measureInWindow) {
      cardRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) layoutBoundsRef.current = { x, y, width, height };
      });
    }
  }, []);

  const handlePress = useCallback(() => {
    const bounds = layoutBoundsRef.current;
    if (startSharedTransition) {
      startSharedTransition({ image: coverImage, name: salon.name }, bounds || { x: 16, y: 120, width: SCREEN_WIDTH - 32, height: 320 });
    }
    if (onPress) onPress(salon);
    measureCard();
  }, [salon, onPress, coverImage, startSharedTransition, measureCard]);

  const handleFavPress = useCallback(
    (e) => {
      e?.stopPropagation && e.stopPropagation();
      toggleFavorite(salon);
    },
    [toggleFavorite, salon]
  );

  const styles = getStyles();

  return (
    <BouncyButton
      ref={cardRef}
      onLayout={measureCard}
      style={[styles.card, isHorizontal ? styles.horizontal : styles.full]}
      onPress={handlePress}
    >
      {/* Image container */}
      <View style={styles.imageFrame}>
        <Image source={{ uri: coverImage }} style={styles.image} resizeMode="cover" />

        {/* Favorite Heart Button */}
        <AppleTouchable style={styles.favBtn} onPress={handleFavPress} scaleTo={0.88} hapticType="medium">
          <Ionicons
            name={isFav ? "heart" : "heart-outline"}
            size={16}
            color={isFav ? C.herat : C.ink}
          />
        </AppleTouchable>

        {/* Top Rated Badge Pill — Only shown for ratings >= 4.5 */}
        {isTopRated ? (
          <View style={styles.topRatedBadge}>
            <Ionicons name="star" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
            <Text style={styles.topRatedText}>Guest Favorite</Text>
          </View>
        ) : null}
      </View>

      {/* Info Content */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{salon.name}</Text>
          <VerifiedBadge size={16} color={C.verified} />
        </View>

        <Text style={styles.description} numberOfLines={1}>
          {salon.description || "Hair · Skin · Spa · Grooming"}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={12} color={C.main} />
            <Text style={styles.ratingText}>{ratingStr}</Text>
            <Text style={styles.branchCount}>({branchCount} loc)</Text>
          </View>

          {/* button-primary per cursor/DESIGN.md: 8px radius */}
          <View style={styles.bookBtn}>
            <Text style={styles.bookBtnText}>Book</Text>
          </View>
        </View>
      </View>
    </BouncyButton>
  );
}

export default memo(SalonCard);

function getStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      marginBottom: S.md,
      borderWidth: 1,
      borderColor: C.border,
      ...SHADOWS.md,
    },
    horizontal: {
      width: SCREEN_WIDTH * 0.72,
      marginRight: S.md,
    },
    full: {
      width: "100%",
    },
    imageFrame: {
      height: 160,
      backgroundColor: C.lifted,
      position: "relative",
      borderTopLeftRadius: R.lg,
      borderTopRightRadius: R.lg,
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    favBtn: {
      position: "absolute",
      top: 10,
      left: 10,
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: C.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
      zIndex: 10,
    },
    topRatedBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(18, 18, 18, 0.72)",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: R.pill,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    topRatedText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: FW.bold,
      letterSpacing: 0.2,
    },
    info: {
      padding: S.md,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 2,
    },
    name: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 18,
      fontWeight: FW.bold,
      color: C.ink,
      flex: 1,
    },
    description: {
      fontSize: FS.xs + 1,
      color: C.body,
      marginBottom: S.sm,
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    ratingBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    ratingText: {
      fontSize: FS.bodySm,
      fontWeight: FW.bold,
      color: C.ink,
    },
    branchCount: {
      fontSize: 11,
      color: C.muted,
    },
    bookBtn: {
      backgroundColor: C.main,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: R.button,
    },
    bookBtnText: {
      color: "#FFFFFF",
      fontSize: FS.xs + 1,
      fontWeight: FW.bold,
    },
  });
}