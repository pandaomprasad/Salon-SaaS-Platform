// src/components/SalonCard.jsx
import React, { useRef, memo, useCallback } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useSharedElement } from "../context/SharedElementContext";
import { useFavorites } from "../context/FavoritesContext";
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
  const { isFavorite, toggleFavorite } = useFavorites();

  const rating = (salon.rating || 4.8).toFixed(1);
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
        <BouncyButton style={styles.favBtn} onPress={handleFavPress}>
          <Ionicons
            name={isFav ? "heart" : "heart-outline"}
            size={16}
            color={isFav ? "#EF4444" : C.ink}
          />
        </BouncyButton>

        {/* Distance badge pill per cursor/DESIGN.md */}
        {salon.distanceKm ? (
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate" size={10} color={C.ink} />
            <Text style={styles.distanceText}>{salon.distanceKm} km</Text>
          </View>
        ) : null}
      </View>

      {/* Info Content */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{salon.name}</Text>
          <Ionicons name="checkmark-circle" size={14} color={C.main} />
        </View>

        <Text style={styles.description} numberOfLines={1}>
          {salon.description || "Hair · Skin · Spa · Grooming"}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={12} color="#c08532" />
            <Text style={styles.ratingText}>{rating}</Text>
            <Text style={styles.branchCount}>({branchCount} loc)</Text>
          </View>

          {/* button-primary per cursor/DESIGN.md: Cursor Orange #f54e00, 8px radius */}
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
      overflow: "hidden",
      marginBottom: S.md,
      borderWidth: 1,
      borderColor: C.border,
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
    },
    image: {
      width: "100%",
      height: "100%",
    },
    favBtn: {
      position: "absolute",
      top: S.xs,
      left: S.xs,
      width: 32,
      height: 32,
      borderRadius: R.pill,
      backgroundColor: C.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
      zIndex: 2,
    },
    distanceBadge: {
      position: "absolute",
      top: S.xs,
      right: S.xs,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.surface,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: R.pill,
      gap: 4,
      borderWidth: 1,
      borderColor: C.border,
    },
    distanceText: {
      color: C.ink,
      fontSize: 10,
      fontWeight: FW.medium,
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
      fontSize: FS.titleSm,
      fontWeight: FW.semiBold,
      color: C.ink,
      flex: 1,
    },
    description: {
      fontSize: FS.bodySm,
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
      fontWeight: FW.semiBold,
      color: C.ink,
    },
    branchCount: {
      fontSize: 11,
      color: C.muted,
    },
    bookBtn: {
      backgroundColor: C.main,
      paddingHorizontal: S.sm + 2,
      paddingVertical: 6,
      borderRadius: R.md,
    },
    bookBtnText: {
      color: "#FFFFFF",
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
  });
}