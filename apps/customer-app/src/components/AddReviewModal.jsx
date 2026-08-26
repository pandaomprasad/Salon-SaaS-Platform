// src/components/AddReviewModal.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme";
import { useTheme } from "../context/ThemeContext";

import AppleBottomSheet from "./AppleBottomSheet";
import SpringTouchable from "./SpringTouchable";
import { triggerHaptic } from "../theme/appleMotion";

const REVIEW_TERMS = [
  { id: "service", label: "Service", icon: "cut-outline" },
  { id: "cleanliness", label: "Cleanliness", icon: "sparkles-outline" },
  { id: "ambience", label: "Ambience & Vibe", icon: "leaf-outline" },
  { id: "punctuality", label: "Punctuality & Staff", icon: "time-outline" },
];

export default function AddReviewModal({
  visible,
  onClose,
  onSubmit,
  appointment,
  salonName: propSalonName,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  const [aspects, setAspects] = useState({
    service: 5,
    cleanliness: 5,
    ambience: 5,
    punctuality: 5,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const salonName =
    propSalonName ||
    appointment?.salon?.name ||
    (typeof appointment?.salonId === "object" ? appointment.salonId?.name : null) ||
    "Salon Studio";

  const serviceName =
    appointment?.service?.name ||
    (typeof appointment?.serviceId === "object" ? appointment.serviceId?.name : null) ||
    "your appointment";

  const handleStarPress = (termId, starVal) => {
    triggerHaptic("selection");
    setAspects((prev) => ({
      ...prev,
      [termId]: starVal,
    }));
  };

  const calculateOverallRating = () => {
    const total = aspects.service + aspects.cleanliness + aspects.ambience + aspects.punctuality;
    return Math.round(total / 4);
  };

  const handleSubmit = async () => {
    triggerHaptic("success");
    setSubmitting(true);
    const overallScore = calculateOverallRating();
    try {
      if (onSubmit) {
        await onSubmit({
          rating: overallScore,
          score: overallScore,
          comment: comment.trim(),
          aspects,
        });
      }
      setComment("");
      setAspects({ service: 5, cleanliness: 5, ambience: 5, punctuality: 5 });
      onClose();
    } catch (e) {
      console.warn("Failed to submit review", e);
    } finally {
      setSubmitting(false);
    }
  };

  const overallScore = calculateOverallRating();

  return (
    <AppleBottomSheet visible={visible} onClose={onClose} height="82%">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.sheetInner}>
          {/* Header Bar */}
          <View style={styles.header}>
            <Text style={styles.title}>RATE YOUR EXPERIENCE</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={isDark ? "#94A3B8" : "#64748B"} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            How was your recent <Text style={styles.salonBold}>{serviceName}</Text> at{" "}
            <Text style={styles.salonBold}>{salonName}</Text>?
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Aspect Ratings Container */}
            <View style={styles.aspectsContainer}>
              {REVIEW_TERMS.map((item) => {
                const currentScore = aspects[item.id];
                return (
                  <View key={item.id} style={styles.aspectRow}>
                    <View style={styles.aspectLabelBox}>
                      <Ionicons
                        name={item.icon}
                        size={16}
                        color={C.purple || "#6C5CE7"}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.aspectLabel}>{item.label}</Text>
                    </View>

                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => handleStarPress(item.id, star)}
                          activeOpacity={0.7}
                          style={styles.starBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
                        >
                          <Ionicons
                            name={star <= currentScore ? "star" : "star-outline"}
                            size={20}
                            color={star <= currentScore ? "#FFC107" : isDark ? "#3A3A3D" : "#D1D5DB"}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Overall Summary Pill Badge */}
            <View style={styles.overallBadge}>
              <Text style={styles.overallText}>
                Overall Score: <Text style={styles.overallScoreBold}>{overallScore} / 5</Text>
                {"  "}
                {overallScore === 5
                  ? "🌟 Exceptional"
                  : overallScore === 4
                  ? "😊 Very Good"
                  : overallScore === 3
                  ? "😐 Average"
                  : "👎 Needs Improvement"}
              </Text>
            </View>

            {/* Comment Input */}
            <TextInput
              style={styles.textInput}
              placeholder="Share more feedback about cleanliness, ambience, service..."
              placeholderTextColor={isDark ? "#64748B" : "#A0A4B0"}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />

            {/* Primary Action Button: Submit Review in Theme Purple */}
            <SpringTouchable
              style={[styles.submitBtn, submitting && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={submitting}
              scaleTo={0.96}
              hapticType="success"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Review</Text>
              )}
            </SpringTouchable>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </AppleBottomSheet>
  );
}

function getStyles(theme, isDark) {
  const accentColor = C.purple || "#6C5CE7";

  return StyleSheet.create({
    sheetInner: {
      paddingHorizontal: 20,
      paddingTop: 12,
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    title: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1.2,
      color: accentColor,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "#2A2A2C" : "#F0F1F5",
      alignItems: "center",
      justifyContent: "center",
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? "#94A3B8" : "#71717A",
      marginBottom: 18,
      lineHeight: 20,
    },
    salonBold: {
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#1A1A24",
    },
    scrollBody: {
      flexGrow: 0,
    },
    aspectsContainer: {
      backgroundColor: isDark ? "#1C1C1E" : "#F6F7FA",
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? "#2A2A2C" : "#EBECEF",
      marginBottom: 16,
      gap: 12,
    },
    aspectRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 2,
    },
    aspectLabelBox: {
      flexDirection: "row",
      alignItems: "center",
    },
    aspectLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#1A1A24",
    },
    starRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    starBtn: {
      padding: 2,
    },
    overallBadge: {
      backgroundColor: isDark ? "rgba(108, 92, 231, 0.15)" : "#F0EEFF",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 14,
      marginBottom: 16,
      alignItems: "center",
    },
    overallText: {
      fontSize: 13,
      color: isDark ? "#E2E8F0" : "#4A4A5A",
      fontWeight: "600",
    },
    overallScoreBold: {
      fontWeight: "800",
      color: accentColor,
    },
    textInput: {
      backgroundColor: isDark ? "#1C1C1E" : "#F6F7FA",
      borderRadius: 20,
      padding: 16,
      fontSize: 14,
      color: isDark ? "#FFFFFF" : "#1A1A24",
      borderWidth: 1,
      borderColor: isDark ? "#2A2A2C" : "#EBECEF",
      height: 100,
      marginBottom: 20,
      lineHeight: 20,
    },
    submitBtn: {
      height: 52,
      backgroundColor: accentColor,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
      marginBottom: 24,
    },
    disabledBtn: {
      opacity: 0.5,
    },
    submitBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
  });
}
