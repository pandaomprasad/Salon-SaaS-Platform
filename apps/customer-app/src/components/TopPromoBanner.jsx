import React, { useRef, useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, Dimensions, Animated, Easing } from "react-native";
import { C, S, FS, FW, R } from "../theme";
import BouncyButton from "./BouncyButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_MARGIN = S.sm;
const ITEM_WIDTH = CARD_WIDTH + CARD_MARGIN;

const AUTO_ADVANCE_INTERVAL = 2000;//s between slides
const SLIDE_DURATION = 500; // ms for the slide animation itself

const BANNERS = [
  {
    id: "1",
    tag: "SPECIAL OFFER",
    tagColor: C.grep,
    title: "20% off your first luxury salon session",
    subtitle: "Use code FIRST20 on checkout",
    cta: "Claim discount",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "2",
    tag: "BRIDAL EDITION",
    tagColor: C.edit,
    title: "Curated bridal makeup & spa packages",
    subtitle: "Book verified master artists",
    cta: "Explore packages",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
  },
];

// Duplicate list so we always have a "next" card to slide to, even at the end
const LOOPED_BANNERS = [...BANNERS, ...BANNERS];

export default function TopPromoBanner({ onPressBanner }) {
  const styles = getStyles();
  const translateX = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0); // real index into LOOPED_BANNERS
  const timerRef = useRef(null);

  useEffect(() => {
    startAutoAdvance();
    return () => clearTimeout(timerRef.current);
  }, []);

  function startAutoAdvance() {
    timerRef.current = setTimeout(() => {
      advance();
    }, AUTO_ADVANCE_INTERVAL);
  }

  function advance() {
    const nextIndex = indexRef.current + 1;

    Animated.timing(translateX, {
      toValue: -nextIndex * ITEM_WIDTH,
      duration: SLIDE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      indexRef.current = nextIndex;

      // Once we've slid onto the duplicated set, snap back to the real
      // start with no animation (identical card underneath = invisible)
      if (indexRef.current >= BANNERS.length) {
        indexRef.current = 0;
        translateX.setValue(0);
      }

      startAutoAdvance();
    });
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
        {LOOPED_BANNERS.map((banner, index) => (
          <BouncyButton
            key={`${banner.id}-${index}`}
            style={styles.card}
            onPress={() => onPressBanner && onPressBanner(banner)}
          >
            <Image source={{ uri: banner.image }} style={styles.image} resizeMode="cover" />

            <View style={styles.overlay}>
              <View
                style={[
                  styles.tagPill,
                  { backgroundColor: C[banner.tag.toLowerCase().includes("bridal") ? "edit" : "grep"] || C.grep },
                ]}
              >
                <Text style={styles.tagText}>{banner.tag}</Text>
              </View>

              <Text style={styles.title}>{banner.title}</Text>
              <Text style={styles.sub}>{banner.subtitle}</Text>

              <View style={styles.primaryCta}>
                <Text style={styles.primaryCtaText}>{banner.cta}</Text>
              </View>
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
      backgroundColor: "#161614",
      borderWidth: 1,
      borderColor: C.border,
    },
    image: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
      opacity: 0.4,
    },
    overlay: {
      flex: 1,
      padding: S.md,
      justifyContent: "flex-end",
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
      color: "#26251e",
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
      color: "rgba(255, 255, 255, 0.8)",
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