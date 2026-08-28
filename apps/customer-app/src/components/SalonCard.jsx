import React, { memo, useCallback } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import VerifiedBadge from "./VerifiedBadge";
import { C, S, FS, FW, R, SHADOWS, FONT_FAMILY } from "../theme";
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

function formatAddress(address, fallback) {
  if (typeof address === "string" && address.trim()) return address;
  if (address && typeof address === "object") {
    return [address.street, address.city, address.state].filter(Boolean).join(", ") || fallback;
  }
  return fallback;
}

function getLowestServicePrice(salon) {
  if (!salon) return null;

  const candidatePrices = [];

  [salon.minServicePrice, salon.startingPrice, salon.minPrice].forEach((p) => {
    if (typeof p === "number" && p > 0) {
      candidatePrices.push(p >= 1000 ? Math.round(p / 100) : Math.round(p));
    } else if (typeof p === "string" && p.trim()) {
      const parsed = parseFloat(p.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(parsed) && parsed > 0) {
        candidatePrices.push(parsed >= 1000 ? Math.round(parsed / 100) : Math.round(parsed));
      }
    }
  });

  if (Array.isArray(salon.services)) {
    salon.services.forEach((s) => {
      if (typeof s?.price === "number" && s.price > 0) {
        candidatePrices.push(s.price >= 1000 ? Math.round(s.price / 100) : Math.round(s.price));
      }
    });
  }

  if (salon.serviceSummary?.priceRange?.min) {
    const parsed = parseFloat(String(salon.serviceSummary.priceRange.min).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      candidatePrices.push(Math.round(parsed));
    }
  }

  if (candidatePrices.length > 0) {
    return Math.min(...candidatePrices);
  }

  return null;
}

function checkIsOpen(salon) {
  if (!salon) return true;
  if (salon.isActive === false || salon.deactivatedByAdmin === true || salon.isOpen === false || salon.status === "CLOSED") {
    return false;
  }
  const workingHours = salon.workingHours || salon.branches?.[0]?.workingHours;
  if (!Array.isArray(workingHours) || workingHours.length === 0) return true;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayWorking = workingHours.find((w) => w.day === dayOfWeek);
  if (!todayWorking || todayWorking.isOpen === false) return false;

  if (todayWorking.openTime && todayWorking.closeTime) {
    const [openH, openM] = todayWorking.openTime.split(":").map(Number);
    const [closeH, closeM] = todayWorking.closeTime.split(":").map(Number);
    const openMinutes = openH * 60 + (openM || 0);
    const closeMinutes = closeH * 60 + (closeM || 0);

    if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
      return false;
    }
  }

  return true;
}

function SalonCard({ salon, onPress, isHorizontal = false, index = 0, variant = "default" }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isOpen = checkIsOpen(salon);

  const numericRating = typeof salon.rating === "number" ? salon.rating : parseFloat(salon.rating || 4.8);
  const ratingStr = numericRating.toFixed(1);
  const isTopRated = numericRating >= 4.5;
  const coverImage = salon.coverImage || salon.image || DEMO_IMAGES[index % DEMO_IMAGES.length];
  const branchCount = salon.branches?.length || 1;
  const isFav = isFavorite(salon._id || salon.id);
  const isCompact = variant === "compact";
  const address = formatAddress(
    salon.address || salon.branches?.[0]?.address || salon.location?.address,
    salon.city || salon.branches?.[0]?.address?.city || "Nearby salon"
  );
  const distance = salon.distance || salon.distanceKm || salon.branches?.[0]?.distance || "Nearby";
  const lowestServicePrice = getLowestServicePrice(salon);

  const handlePress = useCallback(() => {
    if (onPress) onPress(salon);
  }, [salon, onPress]);

  const handleFavPress = useCallback(
    (e) => {
      e?.stopPropagation && e.stopPropagation();
      toggleFavorite(salon);
    },
    [toggleFavorite, salon]
  );

  const styles = getStyles();

  if (isCompact) {
    return (
      <BouncyButton
        style={styles.compactCard}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`View ${salon.name}`}
      >
        <View style={styles.compactImageWrap}>
          <Image source={{ uri: coverImage }} style={styles.compactImage} resizeMode="cover" />
          {lowestServicePrice !== null ? (
            <View style={styles.pricePill}>
              <Text style={styles.pricePillIcon}>✦</Text>
              <Text style={styles.pricePillText}>₹{lowestServicePrice}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{salon.name}</Text>
          <Text style={styles.compactAddress} numberOfLines={1}>{address}</Text>
          <View style={styles.compactMeta}>
            <View style={styles.stars}>
              {[0, 1, 2, 3, 4].map((star) => (
                <Ionicons
                  key={star}
                  name={star < Math.round(numericRating) ? "star" : "star-outline"}
                  size={10}
                  color={C.main}
                />
              ))}
            </View>
            <View style={styles.distance}>
              <Ionicons name="location" size={11} color={C.muted} />
              <Text style={styles.distanceText}>{typeof distance === "number" ? `${distance} km` : distance}</Text>
            </View>
          </View>
        </View>
      </BouncyButton>
    );
  }

  return (
    <BouncyButton
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
            color={isFav ? C.heart || "#FF3B30" : C.ink}
          />
        </AppleTouchable>

        {/* Top Rated Badge Pill — Only shown for ratings >= 4.5 */}
        {isTopRated ? (
          <View style={styles.topRatedBadge}>
            <Ionicons name="star" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
            <Text style={styles.topRatedText}>Guest Favorite</Text>
          </View>
        ) : null}

        {/* Lowest Service Price Badge Pill */}
        {lowestServicePrice !== null ? (
          <View style={styles.mainCardPricePill}>
            <Text style={styles.pricePillIcon}>✦</Text>
            <Text style={styles.pricePillText}>₹{lowestServicePrice}</Text>
          </View>
        ) : null}
      </View>

      {/* Info Content */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{salon.name}</Text>
          <VerifiedBadge size={16} color={C.verified} />

          {/* Open / Closed Status Badge */}
          <View style={[styles.cardStatusBadge, isOpen ? styles.cardStatusOpen : styles.cardStatusClosed]}>
            <View style={[styles.cardStatusDot, isOpen ? styles.cardDotOpen : styles.cardDotClosed]} />
            <Text style={[styles.cardStatusText, isOpen ? styles.cardTextOpen : styles.cardTextClosed]}>
              {isOpen ? "Open" : "Closed"}
            </Text>
          </View>
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
    compactCard: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 76,
      paddingVertical: 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    compactImage: {
      width: 58,
      height: 58,
      borderRadius: 12,
      backgroundColor: C.lifted,
    },
    compactImageWrap: {
      width: 58,
      height: 58,
      position: "relative",
    },
    pricePill: {
      position: "absolute",
      right: -8,
      bottom: -6,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "rgba(15, 15, 13, 0.9)",
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: R.pill,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.18)",
      zIndex: 2,
    },
    mainCardPricePill: {
      position: "absolute",
      right: 10,
      bottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(15, 15, 13, 0.84)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: R.pill,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.22)",
      zIndex: 10,
    },
    pricePillIcon: {
      color: C.main || "#C48B36",
      fontSize: 10,
      lineHeight: 12,
    },
    pricePillText: {
      color: "#FFFFFF",
      fontFamily: FONT_FAMILY.bodyBold,
      fontSize: 12,
      fontWeight: FW.bold,
      lineHeight: 14,
    },
    compactInfo: {
      flex: 1,
      minWidth: 0,
      marginLeft: 11,
      justifyContent: "center",
    },
    compactName: {
      color: C.ink,
      fontFamily: FONT_FAMILY.bodyBold,
      fontSize: 14,
      fontWeight: FW.bold,
      marginBottom: 3,
    },
    compactAddress: {
      color: C.muted,
      fontFamily: FONT_FAMILY.body,
      fontSize: 10.5,
      lineHeight: 14,
      marginBottom: 7,
    },
    compactMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    stars: {
      flexDirection: "row",
      alignItems: "center",
      gap: 1,
    },
    distance: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginLeft: S.sm,
    },
    distanceText: {
      color: C.muted,
      fontFamily: FONT_FAMILY.bodyMedium,
      fontSize: 10,
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
      flexShrink: 1,
    },
    cardStatusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: R.pill,
      gap: 4,
      marginLeft: "auto",
    },
    cardStatusOpen: {
      backgroundColor: "#E8F8EE",
      borderWidth: 1,
      borderColor: "#C3F0D3",
    },
    cardStatusClosed: {
      backgroundColor: "#FEE2E2",
      borderWidth: 1,
      borderColor: "#FECACA",
    },
    cardStatusDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    cardDotOpen: {
      backgroundColor: "#22C55E",
    },
    cardDotClosed: {
      backgroundColor: "#EF4444",
    },
    cardStatusText: {
      fontSize: 9.5,
      fontWeight: FW.bold,
    },
    cardTextOpen: {
      color: "#15803D",
    },
    cardTextClosed: {
      color: "#B91C1C",
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
      backgroundColor: C.blue,
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
