// src/components/TopPromoBanner.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  AppState,
} from "react-native";
import { C, S, R, FF } from "../theme";
import BouncyButton from "./BouncyButton";
import { apiClient } from "../services/apiClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_MARGIN = S.sm;
const ITEM_WIDTH = CARD_WIDTH + CARD_MARGIN;

const AUTO_ADVANCE_INTERVAL = 4500;

const DEFAULT_BANNERS = [
  {
    id: "1",
    tag: "WELCOME OFFER",
    title: "Flat 20% Off Your First Luxury Session",
    subtitle: "Experience master hair styling & luxury spa treatments",
    cta: "Claim discount",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop",
    promoCode: "FIRST20",
  },
  {
    id: "2",
    tag: "BRIDAL EDITION",
    title: "Curated Bridal Hair & Spa Packages",
    subtitle: "Book verified master artists for your special day",
    cta: "Explore packages",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function TopPromoBanner({ onPressBanner, refreshTrigger }) {
  const styles = getStyles();
  const [banners, setBanners] = useState(DEFAULT_BANNERS);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollViewRef = useRef(null);
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  const fetchBanners = useCallback(async () => {
    try {
      const res = await apiClient.get("/banners");
      const list = res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      if (list && list.length > 0) {
        const mapped = list.map((b) => ({
          id: b._id || b.id,
          tag: b.tag || "SPECIAL OFFER",
          title: b.title,
          subtitle: b.subtitle || "",
          cta: b.ctaText || "Claim discount",
          image: b.imageUrl || DEFAULT_BANNERS[0].image,
          promoCode: b.promoCode,
          targetType: b.targetType,
          targetId: b.targetId,
        }));
        setBanners(mapped);
      }
    } catch (err) {
      // Keep fallback banners on error
    }
  }, []);

  useEffect(() => {
    fetchBanners();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchBanners();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchBanners]);

  useEffect(() => {
    if (refreshTrigger) {
      fetchBanners();
    }
  }, [refreshTrigger, fetchBanners]);

  // Handle auto advance timer
  useEffect(() => {
    if (banners.length > 1) {
      startAutoAdvance();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [banners, activeIndex]);

  const startAutoAdvance = () => {
    if (banners.length <= 1) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      let nextIndex = (indexRef.current + 1) % banners.length;
      indexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * ITEM_WIDTH,
        animated: true,
      });
    }, AUTO_ADVANCE_INTERVAL);
  };

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const computedIndex = Math.round(contentOffsetX / ITEM_WIDTH);
    const clampedIndex = Math.max(0, Math.min(computedIndex, banners.length - 1));
    if (clampedIndex !== indexRef.current) {
      indexRef.current = clampedIndex;
      setActiveIndex(clampedIndex);
    }
  };

  const handleBannerClick = (banner) => {
    if (
      banner.id &&
      typeof banner.id === "string" &&
      !banner.id.startsWith("1") &&
      !banner.id.startsWith("2")
    ) {
      apiClient.post(`/banners/${banner.id}/click`).catch(() => {});
    }
    if (onPressBanner) onPressBanner(banner);
  };

  return (
    <View style={styles.container}>
      {/* Bidirectional ScrollView for Swiping Left & Right */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {banners.map((banner, index) => (
          <BouncyButton
            key={`${banner.id}-${index}`}
            style={styles.card}
            onPress={() => handleBannerClick(banner)}
          >
            {/* Rich Photography */}
            <Image source={{ uri: banner.image }} style={styles.image} resizeMode="cover" />

            {/* Dark Gradient Overlay */}
            <View style={styles.gradientOverlay} />

            {/* Banner Content Layer */}
            <View style={styles.contentLayer}>
              {/* Glassmorphic Tag Badge */}
              <View style={styles.glassTagPill}>
                <Text style={styles.glassTagText}>{banner.tag.toUpperCase()}</Text>
              </View>

              <Text style={styles.title} numberOfLines={2}>{banner.title}</Text>
              {banner.subtitle ? (
                <Text style={styles.subtitle} numberOfLines={2}>{banner.subtitle}</Text>
              ) : null}

              <TouchableOpacity activeOpacity={0.88} onPress={() => handleBannerClick(banner)}>
                <View style={styles.luxuryButton}>
                  <Text style={styles.luxuryButtonText}>{banner.cta}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </BouncyButton>
        ))}
      </ScrollView>

      {/* Pagination Indicator Dots */}
      {banners.length > 1 && (
        <View style={styles.paginationRow}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    container: {
      marginTop: S.sm,
      marginBottom: S.md,
      width: SCREEN_WIDTH,
    },
    scrollContent: {
      paddingLeft: S.md,
      paddingRight: S.xs,
    },
    card: {
      width: CARD_WIDTH,
      height: 190,
      borderRadius: R.xl,
      overflow: "hidden",
      marginRight: CARD_MARGIN,
      backgroundColor: "#161618",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.12)",
      position: "relative",
    },
    image: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
      opacity: 0.9,
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(12, 12, 14, 0.55)",
    },
    contentLayer: {
      flex: 1,
      padding: S.lg,
      justifyContent: "flex-end",
      zIndex: 2,
    },
    glassTagPill: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: R.pill,
      backgroundColor: "rgba(255, 255, 255, 0.22)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.35)",
      marginBottom: S.xs,
    },
    glassTagText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#FFFFFF",
      letterSpacing: 1.2,
    },
    title: {
      fontFamily: FF.display || "System",
      fontSize: 19,
      fontWeight: "600",
      color: "#FFFFFF",
      marginBottom: 4,
      lineHeight: 24,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontFamily: FF.body || "System",
      fontSize: 13,
      color: "rgba(255, 255, 255, 0.88)",
      marginBottom: S.md,
      lineHeight: 17,
    },
    luxuryButton: {
      alignSelf: "flex-start",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: S.lg,
      paddingVertical: 9,
      borderRadius: R.pill,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    luxuryButtonText: {
      color: "#121212",
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: -0.1,
    },
    paginationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      gap: 6,
    },
    dot: {
      height: 4,
      borderRadius: 2,
    },
    dotActive: {
      width: 18,
      backgroundColor: C.main || "#C48B36",
    },
    dotInactive: {
      width: 6,
      backgroundColor: "rgba(160, 160, 156, 0.35)",
    },
  });
}