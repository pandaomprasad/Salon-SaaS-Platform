// src/components/CancelBookingModal.jsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S } from "../theme";

const REASONS = [
  "Schedule conflict / change of plans",
  "Booked by mistake",
  "Found another salon",
  "Weather / emergency",
  "Other",
];

export default function CancelBookingModal({ visible, onClose, onConfirm, booking }) {
  const styles = getStyles();
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      if (onConfirm) {
        await onConfirm(booking.id || booking._id, selectedReason);
      }
      onClose();
    } catch (e) {
      console.warn("Failed to cancel", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.warningIconBox}>
            <Ionicons name="warning-outline" size={32} color={C.error} />
          </View>

          <Text style={styles.title}>CANCEL APPOINTMENT?</Text>
          <Text style={styles.subtitle}>
            Are you sure you want to cancel your visit for <Text style={styles.bold}>{booking?.serviceName || "Service"}</Text> at <Text style={styles.bold}>{booking?.salonName || "Salon"}</Text>?
          </Text>

          <Text style={styles.reasonHeader}>REASON FOR CANCELLATION</Text>
          {REASONS.map((r) => {
            const isSelected = selectedReason === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.reasonOption, isSelected && styles.reasonSelected]}
                onPress={() => setSelectedReason(r)}
                activeOpacity={0.8}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>{r}</Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.keepBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.keepBtnText}>Keep Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={C.bg} />
              ) : (
                <Text style={styles.cancelBtnText}>Confirm Cancel</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles() {
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: S.lg,
    paddingBottom: 36,
  },
  warningIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.errorBg,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: S.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: C.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: S.md,
    lineHeight: 18,
  },
  bold: {
    fontWeight: "700",
    color: C.ink,
  },
  reasonHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: C.main,
    letterSpacing: 1.1,
    marginBottom: S.xs,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: C.lifted,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  reasonSelected: {
    backgroundColor: C.errorBg,
    borderColor: "rgba(189, 68, 68, 0.25)",
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioActive: {
    borderColor: C.error,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.error,
  },
  reasonText: {
    fontSize: 13,
    color: C.textSecondary,
    fontWeight: "600",
  },
  reasonTextSelected: {
    color: C.errorText,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: S.md,
  },
  keepBtn: {
    flex: 1,
    backgroundColor: C.lifted,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  keepBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: C.textSecondary,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: C.error,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: C.bg,
  },
  });
}
