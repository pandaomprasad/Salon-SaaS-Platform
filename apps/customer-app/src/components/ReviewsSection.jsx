// src/components/ReviewsSection.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme";
import { useTheme } from "../context/ThemeContext";
import SpringTouchable from "./SpringTouchable";

export default function ReviewsSection({
  reviews = [],
  overallRating = "4.8",
  totalReviews = 76,
  onSubmitReview,
  onOpenAddReview,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  const [userRating, setUserRating] = useState(5);
  const [commentText, setCommentText] = useState("");
  const [attachedPhotos, setAttachedPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock sample photos for demonstration when user clicks image upload icon
  const SAMPLE_PHOTOS = [
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=300&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300&auto=format&fit=crop",
  ];

  const handleAddPhoto = () => {
    if (attachedPhotos.length < 3) {
      const nextPhoto = SAMPLE_PHOTOS[attachedPhotos.length % SAMPLE_PHOTOS.length];
      setAttachedPhotos((prev) => [...prev, nextPhoto]);
    }
  };

  const handleRemovePhoto = (index) => {
    setAttachedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      if (onSubmitReview) {
        await onSubmitReview({
          rating: userRating,
          comment: commentText,
          photos: attachedPhotos,
        });
      }
      setCommentText("");
      setAttachedPhotos([]);
    } catch (e) {
      console.warn("Submit review failed:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayCount = reviews.length > 0 ? reviews.length : totalReviews;

  return (
    <View style={styles.container}>
      {/* 1. Write Your Review Header & Star Picker */}
      <View style={styles.writeReviewBlock}>
        <View style={styles.writeHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.writeTitle}>Write your review</Text>
            {onOpenAddReview ? (
              <TouchableOpacity
                onPress={onOpenAddReview}
                activeOpacity={0.7}
                style={{ marginTop: 2 }}
              >
                <Text style={styles.rateAspectsLinkText}>
                  ✦ Rate specific aspects (Service, Cleanliness...)
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Interactive Star Rating Selector */}
          <View style={styles.overallStarRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setUserRating(star)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}
              >
                <Ionicons
                  name={star <= userRating ? "star" : "star-outline"}
                  size={18}
                  color={star <= userRating ? "#FFC107" : isDark ? "#4A4A4D" : "#D1D5DB"}
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Clean Input Card matching reference screenshot exactly */}
        <View style={styles.inputCard}>
          <View style={styles.inputTopRow}>
            <TouchableOpacity
              style={styles.imagePickBtn}
              onPress={handleAddPhoto}
              activeOpacity={0.8}
            >
              <Ionicons name="image-outline" size={20} color={isDark ? "#94A3B8" : "#4A4A5A"} />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Leave your experience..."
              placeholderTextColor={isDark ? "#64748B" : "#A0A4B0"}
              value={commentText}
              onChangeText={setCommentText}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />

            <SpringTouchable
              style={[
                styles.sendBtn,
                !commentText.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!commentText.trim() || isSubmitting}
              scaleTo={0.9}
            >
              <Ionicons
                name="send"
                size={16}
                color="#FFFFFF"
                style={{ marginLeft: 2 }}
              />
            </SpringTouchable>
          </View>

          {/* Attached Photo Thumbnails */}
          {attachedPhotos.length > 0 && (
            <View style={styles.photosRow}>
              {attachedPhotos.map((imgUri, index) => (
                <View key={index} style={styles.thumbWrapper}>
                  <Image source={{ uri: imgUri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={styles.removePhotoBadge}
                    onPress={() => handleRemovePhoto(index)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* 2. All Reviews List Header */}
      <View style={styles.allReviewsHeader}>
        <Text style={styles.allReviewsTitle}>
          All reviews({displayCount})
        </Text>
      </View>

      {/* 3. Reviews List Items */}
      {reviews.length > 0 ? (
        <View style={styles.reviewsListContainer}>
          {reviews.slice(0, 5).map((rev, index) => {
            const ratingNum = rev.rating || rev.score || 5;
            const dateStr = rev.date || rev.createdAt || "Recently";

            return (
              <ReviewCardItem
                key={rev._id || rev.id || index}
                rev={rev}
                ratingNum={ratingNum}
                dateStr={dateStr}
                styles={styles}
                isDark={isDark}
              />
            );
          })}
        </View>
      ) : (
        /* Default Mock Reviews matching reference screenshot exactly */
        <View style={styles.reviewsListContainer}>
          <DefaultMockReviewItem
            name="Vicky Pirachel"
            time="2 days ago"
            rating={5}
            comment="The people working here are just so nice and helpful and make you feel so comfortable!"
            avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
            styles={styles}
            isDark={isDark}
          />
          <DefaultMockReviewItem
            name="Natalia Wierz"
            time="5 days ago"
            rating={4}
            comment="The actual salon is very nice and the workers are professional."
            avatar="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120&auto=format&fit=crop"
            styles={styles}
            isDark={isDark}
          />
          <DefaultMockReviewItem
            name="Rina Baldwin"
            time="1 month ago"
            rating={4}
            comment="The place is very clean and beautiful. Amazing stuff very welcoming."
            avatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop"
            styles={styles}
            isDark={isDark}
          />
        </View>
      )}
    </View>
  );
}

function ReviewCardItem({ rev, ratingNum, dateStr, styles, isDark }) {
  return (
    <View style={styles.reviewItemCard}>
      <View style={styles.reviewUserRow}>
        <Image
          source={{
            uri:
              rev.userAvatar ||
              rev.customerAvatar ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop",
          }}
          style={styles.avatar}
        />

        <View style={styles.userInfoCol}>
          <Text style={styles.userName}>
            {rev.userName || rev.customerName || rev.user?.name || "Customer"}
          </Text>
          <View style={styles.itemStarsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= ratingNum ? "star" : "star-outline"}
                size={13}
                color={star <= ratingNum ? "#FFC107" : isDark ? "#4A4A4D" : "#D1D5DB"}
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

      {Array.isArray(rev.photos) && rev.photos.length > 0 && (
        <View style={styles.reviewPhotosRow}>
          {rev.photos.map((pUrl, pIdx) => (
            <Image key={pIdx} source={{ uri: pUrl }} style={styles.reviewPhotoThumb} />
          ))}
        </View>
      )}
    </View>
  );
}

function DefaultMockReviewItem({ name, time, rating, comment, avatar, styles, isDark }) {
  return (
    <View style={styles.reviewItemCard}>
      <View style={styles.reviewUserRow}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.userInfoCol}>
          <Text style={styles.userName}>{name}</Text>
          <View style={styles.itemStarsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= rating ? "star" : "star-outline"}
                size={13}
                color={star <= rating ? "#FFC107" : isDark ? "#4A4A4D" : "#D1D5DB"}
                style={{ marginRight: 2 }}
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewTimeAgo}>{time}</Text>
      </View>
      <Text style={styles.commentContent}>{comment}</Text>
    </View>
  );
}

function getStyles(theme, isDark) {
  const accentColor = C.purple || "#6C5CE7";

  return StyleSheet.create({
    container: {
      paddingVertical: 12,
    },

    // Write Review Block
    writeReviewBlock: {
      marginBottom: 24,
    },
    writeHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    writeTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      letterSpacing: -0.3,
    },
    rateAspectsLinkText: {
      fontSize: 12,
      fontWeight: "600",
      color: accentColor,
    },
    overallStarRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    // Input Card Container
    inputCard: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 28,
      padding: 20,
      minHeight: 110,
      borderWidth: 1,
      borderColor: isDark ? "#2A2A2C" : "#EBECEF",
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.2 : 0.08,
      shadowRadius: 18,
      elevation: 5,
    },
    inputTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    imagePickBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: isDark ? "#2A2A2C" : "#F4F5F8",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    textInput: {
      flex: 1,
      fontSize: 15,
      color: isDark ? "#FFFFFF" : "#1A1A24",
      minHeight: 70,
      paddingTop: 6,
      paddingBottom: 6,
      lineHeight: 22,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: accentColor,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
      marginTop: 2,
    },
    sendBtnDisabled: {
      opacity: 0.4,
    },
    photosRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#2A2A2C" : "#EBECEF",
    },
    thumbWrapper: {
      position: "relative",
    },
    photoThumb: {
      width: 58,
      height: 58,
      borderRadius: 16,
      backgroundColor: isDark ? "#2A2A2C" : "#E2E8F0",
    },
    removePhotoBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#1A1A24",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: "#FFFFFF",
    },

    // All Reviews List Header
    allReviewsHeader: {
      marginBottom: 16,
    },
    allReviewsTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      letterSpacing: -0.3,
    },

    // Reviews List
    reviewsListContainer: {
      gap: 20,
    },
    reviewItemCard: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? "#2A2A2C" : "#F0F1F5",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    reviewUserRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? "#2A2A2C" : "#E2E8F0",
    },
    userInfoCol: {
      flex: 1,
      marginLeft: 12,
    },
    userName: {
      fontSize: 15,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      marginBottom: 2,
    },
    itemStarsRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    reviewTimeAgo: {
      fontSize: 12,
      fontWeight: "500",
      color: isDark ? "#94A3B8" : "#A0A4B0",
    },
    commentContent: {
      fontSize: 14,
      fontWeight: "400",
      color: isDark ? "#CBD5E1" : "#4A4A5A",
      lineHeight: 21,
    },
    reviewPhotosRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 12,
    },
    reviewPhotoThumb: {
      width: 64,
      height: 64,
      borderRadius: 16,
    },
  });
}
