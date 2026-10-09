// src/components/ReviewsSection.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme";
import { useTheme } from "../context/ThemeContext";
import SpringTouchable from "./SpringTouchable";

const RATING_LABELS = {
  1: "Poor 😞",
  2: "Fair 😐",
  3: "Good 🙂",
  4: "Very Good 😊",
  5: "Excellent! 🌟",
};

export default function ReviewsSection({
  reviews = [],
  overallRating = "4.8",
  totalReviews = 76,
  onSubmitReview,
  onOpenAddReview,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      if (onSubmitReview) {
        await onSubmitReview({
          rating: userRating || 5,
          comment: commentText,
        });
      }
      setCommentText("");
      setUserRating(0);
    } catch (e) {
      console.warn("Submit review failed:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayCount = reviews.length > 0 ? reviews.length : totalReviews;
  const reviewListToRender = reviews.length > 0 ? reviews : MOCK_REVIEWS;

  return (
    <View style={styles.container}>
      {/* 1. Overall Rating Summary Banner */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryScoreNum}>{overallRating}</Text>
        <View style={styles.summaryStarsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= Math.round(parseFloat(overallRating)) ? "star" : "star-half"}
              size={16}
              color="#F59E0B"
              style={{ marginRight: 3 }}
            />
          ))}
        </View>
        <Text style={styles.summarySubtext}>{displayCount} Verified Reviews</Text>
      </View>

      {/* 2. Write Your Review Card */}
      <View style={styles.writeReviewCard}>
        <View style={styles.writeHeaderRow}>
          <Text style={styles.writeTitle}>Write your review</Text>
          {userRating > 0 && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeText}>{RATING_LABELS[userRating]}</Text>
            </View>
          )}
        </View>

        {/* Interactive Star Rating Bar */}
        <View style={styles.starRatingBar}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setUserRating(star)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <Ionicons
                name={userRating > 0 && star <= userRating ? "star" : "star-outline"}
                size={28}
                color={userRating > 0 && star <= userRating ? "#F59E0B" : isDark ? "#475569" : "#CBD5E1"}
                style={{ marginHorizontal: 4 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Comment Text Input Box */}
        <TextInput
          style={styles.textInputBox}
          placeholder="Leave your experience..."
          placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
          value={commentText}
          onChangeText={setCommentText}
          multiline={true}
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Submit Review Action Button */}
        <View style={styles.submitBtnRow}>
          <SpringTouchable
            style={[
              styles.postReviewBtn,
              !commentText.trim() && styles.postReviewBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!commentText.trim() || isSubmitting}
            scaleTo={0.96}
          >
            <Ionicons name="send" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.postReviewBtnText}>Submit Review</Text>
          </SpringTouchable>
        </View>
      </View>

      {/* 3. All Reviews List Header */}
      <View style={styles.allReviewsHeader}>
        <Text style={styles.allReviewsTitle}>All reviews ({displayCount})</Text>
      </View>

      {/* 4. Reviews List Cards */}
      <ScrollView
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
        style={styles.reviewsScrollBox}
        contentContainerStyle={styles.reviewsListContainer}
      >
        {reviewListToRender.map((rev, index) => {
          const revId = rev._id || rev.id || index;
          const ratingNum = rev.rating || rev.score || 5;
          const dateStr = rev.date || rev.createdAt || rev.time || "Recently";

          return (
            <View key={revId} style={styles.reviewItemCard}>
              <View style={styles.reviewUserRow}>
                <Image
                  source={{
                    uri:
                      rev.avatar ||
                      rev.userAvatar ||
                      rev.customerAvatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop",
                  }}
                  style={styles.avatar}
                />

                <View style={styles.userInfoCol}>
                  <View style={styles.userNameBadgeRow}>
                    <Text style={styles.userName}>
                      {rev.name || rev.userName || rev.customerName || rev.user?.name || "Customer"}
                    </Text>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  </View>

                  <View style={styles.itemStarsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= ratingNum ? "star" : "star-outline"}
                        size={13}
                        color={star <= ratingNum ? "#F59E0B" : isDark ? "#475569" : "#CBD5E1"}
                        style={{ marginRight: 2 }}
                      />
                    ))}
                  </View>
                </View>

                <Text style={styles.reviewTimeAgo}>
                  {typeof dateStr === "string" ? dateStr : "Recently"}
                </Text>
              </View>

              {rev.comment ? <Text style={styles.commentContent}>{rev.comment}</Text> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const MOCK_REVIEWS = [
  {
    id: "m1",
    name: "Pooja Das",
    time: "Recently",
    rating: 5,
    comment: "Loved the hair spa & keratine treatment! Clean ambiance and polite staff.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop",
  },
  {
    id: "m2",
    name: "Rahul Patnaik",
    time: "Recently",
    rating: 5,
    comment: "Top-notch haircut at Royal Cut! Stylist Amit was very attentive to detail. Highly recommend!",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop",
  },
  {
    id: "m3",
    name: "Rina Baldwin",
    time: "1 month ago",
    rating: 4,
    comment: "The place is very clean and beautiful. Amazing staff, very welcoming experience.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop",
  },
];

function getStyles(theme, isDark) {
  const accentColor = C.purple || "#6C5CE7";

  return StyleSheet.create({
    container: {
      paddingVertical: 14,
    },

    // 1. Overall Rating Summary Banner
    summaryCard: {
      backgroundColor: isDark ? "#1E1B2E" : "#F8F7FF",
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: isDark ? "#332D56" : "#EBE7FF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    summaryScoreNum: {
      fontSize: 28,
      fontWeight: "900",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      letterSpacing: -0.5,
    },
    summaryStarsRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    summarySubtext: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#A0A0B8" : "#64748B",
    },

    // 2. Write Review Card
    writeReviewCard: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: isDark ? "#2A2A2C" : "#EBECEF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.25 : 0.04,
      shadowRadius: 10,
      elevation: 3,
      marginBottom: 24,
    },
    writeHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    writeTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      letterSpacing: -0.3,
    },
    ratingBadge: {
      backgroundColor: isDark ? "rgba(108, 92, 231, 0.2)" : "#F0EDFF",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    ratingBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: accentColor,
    },
    starRatingBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      marginBottom: 12,
    },
    textInputBox: {
      backgroundColor: isDark ? "#252528" : "#F8F9FA",
      borderRadius: 16,
      padding: 14,
      fontSize: 14,
      color: isDark ? "#FFFFFF" : "#1A1A24",
      minHeight: 80,
      borderWidth: 1,
      borderColor: isDark ? "#3A3A3D" : "#E2E8F0",
      lineHeight: 20,
      marginBottom: 14,
    },
    submitBtnRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    postReviewBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: accentColor,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 24,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    postReviewBtnDisabled: {
      opacity: 0.4,
    },
    postReviewBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },

    // 3. Header
    allReviewsHeader: {
      marginBottom: 16,
    },
    allReviewsTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      letterSpacing: -0.3,
    },

    reviewsScrollBox: {
      maxHeight: 580,
      paddingRight: 2,
    },
    reviewsListContainer: {
      gap: 16,
      paddingBottom: 24,
    },
    reviewItemCard: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? "#2A2A2C" : "#F0F1F5",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    reviewUserRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: isDark ? "#3A3A3D" : "#E2E8F0",
    },
    userInfoCol: {
      flex: 1,
      marginLeft: 12,
    },
    userNameBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 3,
    },
    userName: {
      fontSize: 15,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      marginRight: 6,
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    verifiedText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#10B981",
      marginLeft: 2,
    },
    itemStarsRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    reviewTimeAgo: {
      fontSize: 11,
      fontWeight: "600",
      color: isDark ? "#64748B" : "#94A3B8",
      backgroundColor: isDark ? "#2A2A2C" : "#F8FAFC",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    commentContent: {
      fontSize: 14,
      fontWeight: "400",
      color: isDark ? "#CBD5E1" : "#475569",
      lineHeight: 22,
    },
  });
}
