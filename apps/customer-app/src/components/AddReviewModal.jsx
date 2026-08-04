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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";

export default function AddReviewModal({ visible, onClose, onSubmit, appointment, salonName: propSalonName }) {
  const [rating, setRating] = useState(5);
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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ rating, comment: comment.trim() });
      }
      setComment("");
      setRating(5);
      onClose();
    } catch (e) {
      console.warn("Failed to submit review", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>RATE YOUR LAST VISIT</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={C.ink} />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              How was your recent <Text style={styles.salonBold}>{serviceName}</Text> at <Text style={styles.salonBold}>{salonName}</Text>?
            </Text>

            {/* Star Selector */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={32}
                    color={star <= rating ? C.main : C.dustTaupe}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>
              {rating === 5 ? "Exceptional 🌟" : rating === 4 ? "Very Good 😊" : rating === 3 ? "Average 😐" : "Needs Improvement 👎"}
            </Text>

            {/* Comment Input */}
            <TextInput
              style={styles.textInput}
              placeholder="Write your review, feedback or comments..."
              placeholderTextColor={C.dustTaupe}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />

            {/* button-primary per cursor/DESIGN.md: Cursor Orange #f54e00, 8px radius */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(38, 37, 30, 0.5)",
    justifyContent: "center",
    padding: S.md,
  },
  // feature-card per cursor/DESIGN.md: 12px radius, white surface, hairline border
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg, // 12px card radius
    padding: S.lg,
    borderWidth: 1,
    borderColor: C.border,
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
    marginBottom: S.sm,
    lineHeight: 20,
  },
  salonBold: {
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: S.xs,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: "center",
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
    color: C.ink,
    marginBottom: S.sm,
  },
  // text-input per cursor/DESIGN.md: 8px radius
  textInput: {
    backgroundColor: C.surface,
    borderRadius: R.md, // 8px radius
    padding: S.sm,
    fontSize: FS.bodySm,
    color: C.ink,
    borderWidth: 1,
    borderColor: C.border,
    height: 90,
    marginBottom: S.md,
  },
  // button-primary per cursor/DESIGN.md: Cursor Orange #f54e00, 8px radius
  submitBtn: {
    backgroundColor: C.main, // Cursor Orange
    paddingVertical: 12,
    borderRadius: R.md, // 8px radius
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },
});
