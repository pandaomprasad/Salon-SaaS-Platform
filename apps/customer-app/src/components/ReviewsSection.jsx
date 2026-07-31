// src/components/ReviewsSection.jsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S } from "../theme";

const DUMMY_REVIEWS = [
  {
    id: "r1",
    userName: "Sophia Martinez",
    userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop",
    rating: 5,
    date: "2 days ago",
    serviceName: "Balayage & Styling",
    comment: "Absolutely in love with my new hair color! Alexander is a master artist. The ambiance and service were top notch.",
  },
  {
    id: "r2",
    userName: "David Chen",
    userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=120&auto=format&fit=crop",
    rating: 5,
    date: "1 week ago",
    serviceName: "Executive Beard & Cut",
    comment: "Clean lines, great espresso while waiting, and zero delay. Will definitely return!",
  },
  {
    id: "r3",
    userName: "Emily Watson",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop",
    rating: 4.8,
    date: "2 weeks ago",
    serviceName: "Gel Manicure Deluxe",
    comment: "Super smooth nails and lovely relaxing hand massage. Highly recommend booking in advance.",
  },
];

export default function ReviewsSection({ reviews = [], overallRating = "4.9", totalReviews = 128, onOpenAddReview }) {
  const displayReviews = reviews.length > 0 ? reviews : DUMMY_REVIEWS;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>CLIENT REVIEWS</Text>
          <Text style={styles.reviewSub}>Verified ratings & experiences</Text>
        </View>
        <TouchableOpacity
          style={styles.addReviewBtn}
          onPress={onOpenAddReview}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={14} color="#1A1714" />
          <Text style={styles.addReviewText}>Write Review</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Score Banner */}
      <View style={styles.scoreBanner}>
        <View style={styles.scoreLeft}>
          <Text style={styles.bigScore}>{overallRating}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons key={star} name="star" size={16} color="#D97706" />
            ))}
          </View>
          <Text style={styles.totalText}>{totalReviews} verified reviews</Text>
        </View>

        <View style={styles.scoreRight}>
          {[
            { label: "Service", score: "4.9" },
            { label: "Cleanliness", score: "5.0" },
            { label: "Ambience", score: "4.8" },
            { label: "Punctuality", score: "4.9" },
          ].map((item) => (
            <View key={item.label} style={styles.subScoreRow}>
              <Text style={styles.subLabel}>{item.label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(parseFloat(item.score) / 5) * 100}%` }]} />
              </View>
              <Text style={styles.subVal}>{item.score}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Review List Cards */}
      <View style={styles.reviewsList}>
        {displayReviews.map((rev) => (
          <View key={rev.id || rev._id} style={styles.reviewCard}>
            <View style={styles.cardHeader}>
              <Image source={{ uri: rev.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop" }} style={styles.avatar} />
              <View style={styles.headerMeta}>
                <Text style={styles.userName}>{rev.userName || rev.user?.name || "Verified Client"}</Text>
                <Text style={styles.reviewDate}>{rev.date || "Recent"}</Text>
              </View>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={11} color="#D97706" />
                <Text style={styles.ratingNum}>{rev.rating}</Text>
              </View>
            </View>

            {rev.serviceName && (
              <View style={styles.serviceBadge}>
                <Text style={styles.serviceBadgeText}>✂️ {rev.serviceName}</Text>
              </View>
            )}

            <Text style={styles.commentText}>{rev.comment}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: S.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: S.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1.1,
  },
  reviewSub: {
    fontSize: 12,
    color: "#8E8880",
    marginTop: 2,
  },
  addReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3EFE6",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  addReviewText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1714",
    marginLeft: 4,
  },

  // Score Banner
  scoreBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: S.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    marginBottom: S.md,
  },
  scoreLeft: {
    alignItems: "center",
    paddingRight: S.md,
    borderRightWidth: 1,
    borderRightColor: "rgba(0, 0, 0, 0.06)",
    minWidth: 110,
  },
  bigScore: {
    fontSize: 34,
    fontWeight: "900",
    color: "#1A1714",
    letterSpacing: -1,
  },
  starsRow: {
    flexDirection: "row",
    marginVertical: 4,
  },
  totalText: {
    fontSize: 10,
    color: "#8E8880",
    fontWeight: "600",
  },
  scoreRight: {
    flex: 1,
    paddingLeft: S.md,
  },
  subScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  subLabel: {
    width: 68,
    fontSize: 10,
    fontWeight: "600",
    color: "#5C564E",
  },
  barTrack: {
    flex: 1,
    height: 5,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    marginHorizontal: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#D97706",
    borderRadius: 3,
  },
  subVal: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1A1714",
    width: 22,
    textAlign: "right",
  },

  // Cards
  reviewsList: {
    gap: 10,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
  },
  headerMeta: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1714",
  },
  reviewDate: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 1,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingNum: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
    marginLeft: 3,
  },
  serviceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4B5563",
  },
  commentText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
});
