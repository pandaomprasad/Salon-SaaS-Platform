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
import { C, S } from "../theme";

export default function AddReviewModal({ visible, onClose, onSubmit, salonName }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
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
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>RATE YOUR EXPERIENCE</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#1A1714" />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              How was your visit to <Text style={styles.salonBold}>{salonName || "the salon"}</Text>?
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
                    size={36}
                    color={star <= rating ? "#D97706" : "#D1D5DB"}
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
              placeholder="Write your feedback, stylist appreciation, or tips..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitBtn, (!comment.trim() || submitting) && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={!comment.trim() || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Post Review</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: S.lg,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: S.sm,
  },
  title: {
    fontSize: 11,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1.1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: S.md,
  },
  salonBold: {
    fontWeight: "700",
    color: "#1A1714",
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: S.sm,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: "#B45309",
    marginBottom: S.md,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: "#1A1714",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 110,
    marginBottom: S.lg,
  },
  submitBtn: {
    backgroundColor: "#1A1714",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
