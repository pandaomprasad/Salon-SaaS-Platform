// src/components/AddReviewModal.jsx
import React, { useState } from "react";
import {
  Modal,
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
import { C, S, FS, FW, R, TYPO } from "../theme";

import AppleBottomSheet from "./AppleBottomSheet";
import AppleTouchable from "./AppleTouchable";
import { triggerHaptic } from "../theme/appleMotion";

const REVIEW_TERMS = [
  { id: "service", label: "Service", icon: "cut-outline" },
  { id: "cleanliness", label: "Cleanliness", icon: "sparkles-outline" },
  { id: "ambience", label: "Ambience", icon: "leaf-outline" },
  { id: "punctuality", label: "Punctuality", icon: "time-outline" },
];

export default function AddReviewModal({ visible, onClose, onSubmit, appointment, salonName: propSalonName }) {
  const styles = getStyles();
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
    <AppleBottomSheet visible={visible} onClose={onClose} height="80%">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.sheetInner}>
          <View style={styles.header}>
            <Text style={styles.title}>RATE YOUR EXPERIENCE</Text>
            <AppleTouchable onPress={onClose} style={styles.closeBtn} scaleTo={0.9}>
              <Ionicons name="close" size={18} color={C.ink} />
            </AppleTouchable>
          </View>

          <Text style={styles.subtitle}>
            How was your recent <Text style={styles.salonBold}>{serviceName}</Text> at{" "}
            <Text style={styles.salonBold}>{salonName}</Text>?
          </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
              {/* Aspect Ratings Section */}
              <View style={styles.aspectsContainer}>
                {REVIEW_TERMS.map((item) => {
                  const currentScore = aspects[item.id];
                  return (
                    <View key={item.id} style={styles.aspectRow}>
                      <View style={styles.aspectLabelBox}>
                        <Ionicons name={item.icon} size={16} color={C.main} style={{ marginRight: 6 }} />
                        <Text style={styles.aspectLabel}>{item.label}</Text>
                      </View>

                      <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => handleStarPress(item.id, star)}
                            activeOpacity={0.7}
                            style={styles.starBtn}
                          >
                            <Ionicons
                              name={star <= currentScore ? "star" : "star-outline"}
                              size={20}
                              color={star <= currentScore ? C.main : C.dustTaupe}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Overall Summary Indicator */}
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
                placeholderTextColor={C.dustTaupe}
                multiline
                numberOfLines={3}
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
              />

              {/* Submit Button */}
              <AppleTouchable
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
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
              </AppleTouchable>
            </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </AppleBottomSheet>
  );
}

function getStyles() {
  return StyleSheet.create({
  sheetInner: {
    paddingHorizontal: 20,
    paddingTop: 12,
    flex: 1,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    padding: S.lg,
    borderWidth: 1,
    borderColor: C.border,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: S.xs,
  },
  title: {
    ...TYPO.eyebrow,
    color: C.main,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: R.md,
    backgroundColor: C.lifted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  subtitle: {
    fontSize: FS.bodySm,
    color: C.body,
    marginBottom: S.md,
    lineHeight: 20,
  },
  salonBold: {
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  scrollBody: {
    flexGrow: 0,
  },
  aspectsContainer: {
    backgroundColor: C.bg,
    borderRadius: R.md,
    padding: S.sm,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: S.sm,
    gap: S.xs,
  },
  aspectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  aspectLabelBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  aspectLabel: {
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
    color: C.ink,
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
    backgroundColor: C.mainLight,
    paddingVertical: 8,
    paddingHorizontal: S.sm,
    borderRadius: R.sm,
    marginBottom: S.sm,
    alignItems: "center",
  },
  overallText: {
    fontSize: FS.caption,
    color: C.ink,
    fontWeight: FW.medium,
  },
  overallScoreBold: {
    fontWeight: FW.bold,
    color: C.main,
  },
  textInput: {
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: S.sm,
    fontSize: FS.bodySm,
    color: C.ink,
    borderWidth: 1,
    borderColor: C.border,
    height: 80,
    marginBottom: S.md,
  },
  submitBtn: {
    backgroundColor: C.main,
    paddingVertical: 12,
    borderRadius: R.md,
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: C.bg,
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },
  });
}
