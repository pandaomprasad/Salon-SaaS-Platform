// src/components/ReviewsSection.jsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";

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
          <Ionicons name="create-outline" size={14} color={C.ink} />
          <Text style={styles.addReviewText}>Write Review</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Score Banner per cursor/DESIGN.md */}
      <View style={styles.scoreBanner}>
        <View style={styles.scoreLeft}>
          <Text style={styles.bigScore}>{overallRating}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons key={star} name="star" size={14} color="#c08532" />
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
              <Image source={{ uri: rev.userAvatar || rev.customerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop" }} style={styles.avatar} />
              <View style={styles.headerMeta}>
                <Text style={styles.userName}>{rev.userName || rev.customerName || rev.user?.name || "Verified Client"}</Text>
                <Text style={styles.reviewDate}>{rev.date || rev.ratedAt ? "Recently rated" : "Recent"}</Text>
              </View>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={11} color="#c08532" />
                <Text style={styles.ratingNum}>{rev.rating || rev.score || 5}</Text>
              </View>
            </View>

            {(rev.serviceName || rev.comment) ? (
              <>
                {rev.serviceName ? (
                  <View style={styles.serviceBadge}>
                    <Text style={styles.serviceBadgeText}>✂️ {rev.serviceName}</Text>
                  </View>
                ) : null}
                {rev.comment ? (
                  <Text style={styles.commentText}>{rev.comment}</Text>
                ) : null}
              </>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: S.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: S.sm,
  },
  sectionTitle: {
    ...TYPO.eyebrow,
    color: C.main,
  },
  reviewSub: {
    fontSize: FS.caption,
    color: C.muted,
    marginTop: 2,
  },
  // button-secondary spec per cursor/DESIGN.md: white surface, 1px hairline border, 8px radius
  addReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    paddingHorizontal: S.sm,
    paddingVertical: 6,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.borderDark,
  },
  addReviewText: {
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
    color: C.ink,
    marginLeft: 4,
  },

  // feature-card per cursor/DESIGN.md: 12px radius, white surface, hairline border
  scoreBanner: {
    backgroundColor: C.surface,
    borderRadius: R.lg, // 12px card radius
    padding: S.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: S.md,
  },
  scoreLeft: {
    alignItems: "center",
    paddingRight: S.md,
    borderRightWidth: 1,
    borderRightColor: C.borderLight,
    minWidth: 100,
  },
  bigScore: {
    fontSize: 32,
    fontWeight: "400", // Display 400
    color: C.ink,
    letterSpacing: -0.72,
  },
  starsRow: {
    flexDirection: "row",
    marginVertical: 2,
  },
  totalText: {
    fontSize: 10,
    color: C.muted,
    fontWeight: FW.medium,
  },
  scoreRight: {
    flex: 1,
    paddingLeft: S.md,
  },
  subScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  subLabel: {
    width: 66,
    fontSize: 10,
    fontWeight: FW.medium,
    color: C.body,
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: C.lifted,
    borderRadius: 2,
    marginHorizontal: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#c08532",
    borderRadius: 2,
  },
  subVal: {
    fontSize: 10,
    fontWeight: FW.semiBold,
    color: C.ink,
    width: 20,
    textAlign: "right",
  },

  // Cards
  reviewsList: {
    gap: S.xs,
  },
  reviewCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg, // 12px card radius
    padding: S.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: S.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.bone,
  },
  headerMeta: {
    flex: 1,
    marginLeft: S.xs,
  },
  userName: {
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  reviewDate: {
    fontSize: 10,
    color: C.muted,
    marginTop: 1,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.lifted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: R.pill,
    gap: 3,
  },
  ratingNum: {
    fontSize: 11,
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  serviceBadge: {
    alignSelf: "flex-start",
    backgroundColor: C.lifted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: R.pill,
    marginBottom: S.xs,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: FW.medium,
    color: C.body,
  },
  commentText: {
    fontSize: FS.bodySm,
    color: C.body,
    lineHeight: 18,
  },
});
