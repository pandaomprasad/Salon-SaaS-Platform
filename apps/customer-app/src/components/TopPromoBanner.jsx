import React from "react";
import { View, Text, Image, StyleSheet, Dimensions, ScrollView } from "react-native";
import { C, S, FS, FW, R } from "../theme";
import BouncyButton from "./BouncyButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

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

export default function TopPromoBanner({ onPressBanner }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + 12}
      decelerationRate="fast"
      snapToAlignment="start"
      contentContainerStyle={{ paddingHorizontal: S.md }}
      style={styles.container}
    >
      {BANNERS.map((banner, index) => (
        <BouncyButton
          key={banner.id}
          style={[styles.card, index === BANNERS.length - 1 && { marginRight: 0 }]}
          onPress={() => onPressBanner && onPressBanner(banner)}
        >
          {/* Card Image */}
          <Image source={{ uri: banner.image }} style={styles.image} resizeMode="cover" />

          {/* Card Overlay Content */}
          <View style={styles.overlay}>
            {/* Timeline Tag Pill per cursor/DESIGN.md */}
            <View style={[styles.tagPill, { backgroundColor: banner.tagColor }]}>
              <Text style={styles.tagText}>{banner.tag}</Text>
            </View>

            <Text style={styles.title}>{banner.title}</Text>
            <Text style={styles.sub}>{banner.subtitle}</Text>

            {/* button-primary per cursor/DESIGN.md: Cursor Orange #f54e00, 8px radius */}
            <View style={styles.primaryCta}>
              <Text style={styles.primaryCtaText}>{banner.cta}</Text>
            </View>
          </View>
        </BouncyButton>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: S.sm,
    marginBottom: S.md,
  },
  // feature-card per cursor/DESIGN.md: 12px radius, hairline border, no shadows
  card: {
    width: CARD_WIDTH,
    height: 175,
    borderRadius: R.lg, // 12px radius
    overflow: "hidden",
    marginRight: S.sm,
    backgroundColor: C.ink,
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
    paddingVertical: 2,
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
    fontWeight: "400", // Display 400
    color: "#FFFFFF",
    letterSpacing: -0.32,
    lineHeight: 22,
  },
  sub: {
    fontSize: FS.bodySm,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
    marginBottom: S.sm,
  },
  // button-primary: Cursor Orange #f54e00, 8px radius, 40px height
  primaryCta: {
    alignSelf: "flex-start",
    backgroundColor: C.main, // Cursor Orange
    paddingHorizontal: S.md,
    paddingVertical: 8,
    borderRadius: R.md, // 8px radius
  },
  primaryCtaText: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },
});
