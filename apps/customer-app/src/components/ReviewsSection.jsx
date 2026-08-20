// src/components/ReviewsSection.jsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO, FONT_FAMILY } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 5; // Number of reviews per page inside full-screen modal

export default function ReviewsSection({
  reviews = [],
  overallRating = "0.0",
  totalReviews = 0,
  onOpenAddReview,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const hasReviews = reviews.length > 0;
  const roundedRating = hasReviews ? Math.round(Number(overallRating)) : 0;

  // Inline display: only latest 3 reviews
  const inlineReviews = reviews.slice(0, 3);
  const totalCount = reviews.length || totalReviews;

  // Rating Distribution (5★ to 1★ counts)
  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const score = Math.min(5, Math.max(1, Math.round(r.rating || r.score || 5)));
      counts[score] = (counts[score] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  // Pagination for full screen modal
  const totalPages = Math.ceil(reviews.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedReviews = reviews.slice(startIndex, startIndex + PAGE_SIZE);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const renderScoreBanner = () => (
    <View style={styles.scoreBanner}>
      {/* Left Column: Big Rating & Star Row */}
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
        <Text style={styles.totalText}>
          {totalCount} verified review{totalCount === 1 ? "" : "s"}
        </Text>
      </View>

      {/* Vertical Divider Line */}
      <View style={styles.scoreDivider} />

      {/* Right Column: Star Rating Distribution Progress Bars */}
      <View style={styles.scoreRight}>
        {[5, 4, 3, 2, 1].map((starNum) => {
          const count = starCounts[starNum] || 0;
          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
          return (
            <View key={starNum} style={styles.breakdownRow}>
              <Text style={styles.starNumLabel}>{starNum}★</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.max(pct, count > 0 ? 12 : 0)}%` },
                  ]}
                />
              </View>
              <Text style={styles.countLabel}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0);
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
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
          {/* Refined Overall Score & Distribution Banner */}
          {renderScoreBanner()}

          {/* Inline Reviews List (Only last 3) */}
          <View style={styles.reviewsList}>
            {inlineReviews.map((rev) => (
              <View key={rev.id || rev._id} style={styles.reviewCard}>
                <View style={styles.cardHeader}>
                  <Image
                    source={{
                      uri:
                        rev.userAvatar ||
                        rev.customerAvatar ||
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop",
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.headerMeta}>
                    <Text style={styles.userName}>
                      {rev.userName || rev.customerName || rev.user?.name || "Verified Client"}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {rev.date || rev.ratedAt ? "Recently rated" : "Recent"}
                    </Text>
                  </View>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={11} color={C.main} />
                    <Text style={styles.ratingNum}>{rev.rating || rev.score || 5}</Text>
                  </View>
                </View>

                {rev.serviceName || rev.comment ? (
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

          {/* View All Reviews Button (if > 3 reviews) */}
          {reviews.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => {
                setCurrentPage(1);
                setModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.viewAllBtnText}>View All {reviews.length} Reviews</Text>
              <Ionicons name="arrow-forward" size={16} color={C.main} />
            </TouchableOpacity>
          )}
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

      {/* Full-Screen All Reviews Modal with Pagination */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { paddingTop: topInset + 10 }]}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={22} color={C.ink} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalEyebrow}>ALL REVIEWS</Text>
              <Text style={styles.modalTitle}>Client Feedback ({reviews.length})</Text>
            </View>
          </View>

          {/* Modal Body Scroll */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderScoreBanner()}

            {/* Paginated Reviews List */}
            <View style={styles.reviewsList}>
              {paginatedReviews.map((rev) => (
                <View key={rev.id || rev._id} style={styles.reviewCard}>
                  <View style={styles.cardHeader}>
                    <Image
                      source={{
                        uri:
                          rev.userAvatar ||
                          rev.customerAvatar ||
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop",
                      }}
                      style={styles.avatar}
                    />
                    <View style={styles.headerMeta}>
                      <Text style={styles.userName}>
                        {rev.userName || rev.customerName || rev.user?.name || "Verified Client"}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {rev.date || rev.ratedAt ? "Recently rated" : "Recent"}
                      </Text>
                    </View>
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={11} color={C.main} />
                      <Text style={styles.ratingNum}>{rev.rating || rev.score || 5}</Text>
                    </View>
                  </View>

                  {rev.serviceName || rev.comment ? (
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
          </ScrollView>

          {/* Bottom Pagination Bar */}
          {totalPages > 1 && (
            <View style={[styles.paginationBar, { paddingBottom: bottomInset + 10 }]}>
              <TouchableOpacity
                style={[
                  styles.pageBtn,
                  currentPage === 1 && styles.pageBtnDisabled,
                ]}
                onPress={handlePrevPage}
                disabled={currentPage === 1}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={currentPage === 1 ? C.muted : C.ink}
                />
                <Text
                  style={[
                    styles.pageBtnText,
                    currentPage === 1 && styles.pageBtnTextDisabled,
                  ]}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageIndicator}>
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[
                  styles.pageBtn,
                  currentPage === totalPages && styles.pageBtnDisabled,
                ]}
                onPress={handleNextPage}
                disabled={currentPage === totalPages}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pageBtnText,
                    currentPage === totalPages && styles.pageBtnTextDisabled,
                  ]}
                >
                  Next
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={currentPage === totalPages ? C.muted : C.ink}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

function getStyles(theme, isDark) {
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
    addReviewBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.surface,
      paddingHorizontal: S.sm,
      paddingVertical: 6,
      borderRadius: R.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    addReviewText: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
      color: C.ink,
      marginLeft: 4,
    },

    // Redesigned Overall Score Banner with Rating Breakdown Bars
    scoreBanner: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.md,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: S.md,
    },
    scoreLeft: {
      alignItems: "center",
      justifyContent: "center",
      paddingRight: S.sm,
      minWidth: 105,
    },
    bigScore: {
      fontSize: 34,
      fontWeight: "400",
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
      textAlign: "center",
    },
    scoreDivider: {
      width: 1,
      height: "85%",
      backgroundColor: C.border,
      marginRight: S.sm,
      marginLeft: 4,
    },
    scoreRight: {
      flex: 1,
      gap: 4,
    },
    breakdownRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    starNumLabel: {
      fontSize: 10,
      fontWeight: FW.bold,
      color: C.muted,
      width: 18,
      textAlign: "right",
    },
    barTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: C.main,
    },
    countLabel: {
      fontSize: 10,
      fontWeight: FW.medium,
      color: C.muted,
      width: 16,
      textAlign: "left",
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
    reviewsList: {
      gap: S.xs,
    },
    reviewCard: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
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
    viewAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.surface,
      paddingVertical: 12,
      borderRadius: R.md,
      borderWidth: 1,
      borderColor: C.border,
      marginTop: S.sm,
      gap: 6,
    },
    viewAllBtnText: {
      fontSize: FS.bodySm,
      fontWeight: FW.bold,
      color: C.main,
    },

    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: C.bg,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: Platform.OS === "ios" ? 10 : 20,
      paddingHorizontal: S.md,
      paddingBottom: S.sm,
      borderBottomWidth: 1,
      borderColor: C.border,
    },
    modalCloseBtn: {
      width: 38,
      height: 38,
      borderRadius: R.md,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: S.sm,
    },
    modalEyebrow: {
      ...TYPO.eyebrow,
      color: C.main,
      fontSize: 10,
    },
    modalTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 20,
      fontWeight: FW.bold,
      color: C.ink,
    },
    modalScroll: {
      flex: 1,
    },
    modalScrollContent: {
      padding: S.md,
    },
    paginationBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: S.md,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
    },
    pageBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: R.md,
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.border,
      gap: 4,
    },
    pageBtnDisabled: {
      opacity: 0.5,
    },
    pageBtnText: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
      color: C.ink,
    },
    pageBtnTextDisabled: {
      color: C.muted,
    },
    pageIndicator: {
      fontSize: FS.bodySm,
      fontWeight: FW.bold,
      color: C.ink,
    },
  });
}
