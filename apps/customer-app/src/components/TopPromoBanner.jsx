// src/components/TopPromoBanner.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  TouchableOpacity,
  AppState,
} from "react-native";
import { C, S, FS, FW, R } from "../theme";
import BouncyButton from "./BouncyButton";
import { apiClient } from "../services/apiClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_MARGIN = S.sm;
const ITEM_WIDTH = CARD_WIDTH + CARD_MARGIN;

const AUTO_ADVANCE_INTERVAL = 3500; // ms between slides
const SLIDE_DURATION = 500; // ms for slide animation

const DEFAULT_BANNERS = [
  {
    id: "1",
    tag: "SPECIAL OFFER",
    title: "20% off your first luxury salon session",
    subtitle: "Use code FIRST20 on checkout",
    cta: "Claim discount",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop",
    promoCode: "FIRST20",
  },
  {
    id: "2",
    tag: "BRIDAL EDITION",
    title: "Curated bridal makeup & spa packages",
    subtitle: "Book verified master artists",
    cta: "Explore packages",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
  },
];

export default function TopPromoBanner({ onPressBanner, refreshTrigger }) {
  const styles = getStyles();
  const [banners, setBanners] = useState(DEFAULT_BANNERS);
  const translateX = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  const fetchBanners = useCallback(async () => {
    try {
      const res = await apiClient.get("/banners");
      const list = res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      if (list && list.length > 0) {
        const mapped = list.map((b) => ({
          id: b._id || b.id,
          tag: b.tag || "PROMO",
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
      // Keep existing banners on network glitch
    }
  }, []);

  useEffect(() => {
    fetchBanners();

    // Re-fetch when app resumes from background
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchBanners();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchBanners]);

  // Re-fetch when parent passes pull-to-refresh trigger
  useEffect(() => {
    if (refreshTrigger) {
      fetchBanners();
    }
  }, [refreshTrigger, fetchBanners]);

  const loopedBanners = banners.length > 1 ? [...banners, ...banners] : banners;

  useEffect(() => {
    if (banners.length > 1) {
      startAutoAdvance();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      translateX.setValue(0);
      indexRef.current = 0;
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [banners]);

  function startAutoAdvance() {
    if (banners.length <= 1) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      advance();
    }, AUTO_ADVANCE_INTERVAL);
  }

  function advance() {
    if (banners.length <= 1) return;
    const nextIndex = indexRef.current + 1;

    Animated.timing(translateX, {
      toValue: -nextIndex * ITEM_WIDTH,
      duration: SLIDE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      indexRef.current = nextIndex;

      if (indexRef.current >= banners.length) {
        indexRef.current = 0;
        translateX.setValue(0);
      }

      startAutoAdvance();
    });
  }

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
      <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
        {loopedBanners.map((banner, index) => (
          <BouncyButton
            key={`${banner.id}-${index}`}
            style={styles.card}
            onPress={() => handleBannerClick(banner)}
          >
            <Image source={{ uri: banner.image }} style={styles.image} resizeMode="cover" />

            <View style={styles.overlay}>
              <View
                style={[
                  styles.tagPill,
                  {
                    backgroundColor:
                      C[banner.tag?.toLowerCase().includes("bridal") ? "edit" : "grep"] ||
                      C.grep,
                  },
                ]}
              >
                <Text style={styles.tagText}>{banner.tag}</Text>
              </View>

              <Text style={styles.title}>{banner.title}</Text>
              {banner.subtitle ? <Text style={styles.sub}>{banner.subtitle}</Text> : null}

              <TouchableOpacity activeOpacity={0.88} onPress={() => handleBannerClick(banner)}>
                <View style={styles.primaryCta}>
                  <Text style={styles.primaryCtaText}>{banner.cta}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </BouncyButton>
        ))}
      </Animated.View>
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    container: {
      marginTop: S.sm,
      marginBottom: S.md,
      width: SCREEN_WIDTH,
      overflow: "hidden",
      paddingLeft: S.md,
    },
    row: {
      flexDirection: "row",
    },
    card: {
      width: CARD_WIDTH,
      height: 175,
      borderRadius: R.lg,
      overflow: "hidden",
      marginRight: CARD_MARGIN,
      backgroundColor: "#141414",
      borderWidth: 1,
      borderColor: C.border,
    },
    image: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
      opacity: 0.45,
    },
    overlay: {
      flex: 1,
      padding: S.md,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.55)",
    },
    tagPill: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: R.pill,
      marginBottom: S.xs,
    },
    tagText: {
      fontSize: 10,
      fontWeight: FW.semiBold,
      color: C.ink,
      letterSpacing: 0.88,
    },
    title: {
      fontSize: FS.title,
      fontWeight: "400",
      color: "#FFFFFF",
      marginBottom: 2,
      letterSpacing: -0.32,
    },
    sub: {
      fontSize: FS.bodySm,
      color: "rgba(255, 255, 255, 0.85)",
      marginBottom: S.sm,
    },
    primaryCta: {
      alignSelf: "flex-start",
      backgroundColor: C.main,
      paddingHorizontal: S.md,
      paddingVertical: 6,
      borderRadius: R.md,
    },
    primaryCtaText: {
      color: "#FFFFFF",
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
  });
}