import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { S } from "../theme";
import BouncyButton from "./BouncyButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - 32;

const BANNERS = [
  {
    id: "1",
    tag: "SPECIAL WELCOME PERK",
    title: "20% Off First Booking",
    subtitle: "Use promo code LUXE20 at checkout",
    buttonText: "Claim Offer →",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "2",
    tag: "BRIDAL & EVENT SPECIAL",
    title: "VIP Bridal Glam Suite",
    subtitle: "Exclusive package with top makeup artists",
    buttonText: "Explore Package →",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "3",
    tag: "SEASONAL SPA PERK",
    title: "Organic Hair & Scalp Spa",
    subtitle: "Complimentary head massage with haircut",
    buttonText: "Book Now →",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop",
  },
];

export default function TopPromoBanner({ onPressBanner }) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_WIDTH + 16}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
      >
        {BANNERS.map((banner, index) => (
          <TouchableOpacity
            key={banner.id}
            style={[
              styles.bannerCard,
              index === BANNERS.length - 1 && { marginRight: 0 },
            ]}
            onPress={() => onPressBanner && onPressBanner(banner)}
            activeOpacity={0.9}
          >
            {/* Background Cover Image */}
            <Image source={{ uri: banner.image }} style={styles.bannerImage} resizeMode="cover" />

            {/* Dark Gradient Overlay */}
            <LinearGradient
              colors={["rgba(10, 8, 15, 0.1)", "rgba(10, 8, 15, 0.65)", "rgba(8, 6, 12, 0.92)"]}
              locations={[0, 0.45, 0.88]}
              style={styles.overlay}
            >
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{banner.tag}</Text>
              </View>

              <Text style={styles.title}>{banner.title}</Text>
              <Text style={styles.subtitle}>{banner.subtitle}</Text>

              <BouncyButton
                style={styles.actionBtn}
                onPress={() => onPressBanner && onPressBanner(banner)}
              >
                <Text style={styles.actionBtnText}>{banner.buttonText}</Text>
              </BouncyButton>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: S.md,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: 195,
    borderRadius: 28,
    overflow: "hidden",
    marginRight: 16,
    backgroundColor: "#1A1A1A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: "flex-end",
  },
  tagBadge: {
    backgroundColor: "#1A1A1A",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  tagText: {
    color: "#E6CA65",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
    marginBottom: 12,
    fontWeight: "400",
  },
  actionBtn: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  actionBtnText: {
    color: "#1A1A1A",
    fontSize: 12,
    fontWeight: "800",
  },
});
