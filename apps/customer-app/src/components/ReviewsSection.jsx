// src/components/ReviewsSection.jsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";

export default function ReviewsSection({ reviews = [], overallRating = "0.0", totalReviews = 0, onOpenAddReview }) {
  const styles = getStyles();
  const hasReviews = reviews.length > 0;
  const roundedRating = hasReviews ? Math.round(Number(overallRating)) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>CLIENT REVIEWS</Text>
          <Text style={styles.reviewSub}>Verified ratings & experiences</Text>
        </View>
        {onOpenAddReview ? (
          <TouchableOpacity
            style={styles.addReviewBtn}
            onPress={onOpenAddReview}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={14} color={C.ink} />
            <Text style={styles.addReviewText}>Write Review</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {hasReviews ? (
        <>
          {/* Overall Score Banner */}
          <View style={styles.scoreBanner}>
            <View style={styles.scoreLeft}>
              <Text style={styles.bigScore}>{overallRating}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= roundedRating ? "star" : "star-outline"}
                    size={14}
                    color={C.main}
                  />
                ))}
              </View>
              <Text style={styles.totalText}>{totalReviews} verified review{totalReviews === 1 ? "" : "s"}</Text>
            </View>
          </View>

          {/* Review List Cards */}
          <View style={styles.reviewsList}>
            {reviews.map((rev) => (
              <View key={rev.id || rev._id} style={styles.reviewCard}>
                <View style={styles.cardHeader}>
                  <Image source={{ uri: rev.userAvatar || rev.customerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop" }} style={styles.avatar} />
                  <View style={styles.headerMeta}>
                    <Text style={styles.userName}>{rev.userName || rev.customerName || rev.user?.name || "Verified Client"}</Text>
                    <Text style={styles.reviewDate}>{rev.date || rev.ratedAt ? "Recently rated" : "Recent"}</Text>
                  </View>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={11} color={C.main} />
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
        </>
      ) : (
        <View style={styles.emptyBox}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color={C.muted} />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptySub}>
            Reviews appear here after customers complete verified appointments.
          </Text>
        </View>
      )}
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
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

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: S.lg,
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
  },
  emptyTitle: {
    fontSize: FS.body,
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  emptySub: {
    fontSize: FS.caption,
    color: C.muted,
    textAlign: "center",
    lineHeight: 16,
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
}
