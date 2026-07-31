// src/components/ConflictModal.jsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, SHADOWS } from "../theme";

export default function ConflictModal({
  visible,
  conflictData,
  onClose,
  onViewAppointments,
}) {
  if (!visible) return null;

  const salonName = conflictData?.salonName || "Salon Luxe";
  const serviceName = conflictData?.serviceName || "Existing Service";
  const staffName = conflictData?.staffName || "Specialist";
  const dateStr = conflictData?.date || "Today";
  const timeStr = conflictData?.startTime
    ? `${conflictData.startTime}${conflictData.endTime ? ` - ${conflictData.endTime}` : ""}`
    : "Scheduled Time";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={32} color="#D97706" />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>Time Slot Conflict</Text>
          <Text style={styles.subtitle}>
            You already have an active appointment scheduled at this exact time.
          </Text>

          {/* Conflicting Appointment Summary Card */}
          <View style={styles.conflictCard}>
            <View style={styles.cardHeader}>
              <View style={styles.statusDot} />
              <Text style={styles.cardHeaderTitle}>EXISTING BOOKING</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="business" size={16} color="#8E8880" />
              <Text style={styles.infoLabel}>Salon:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {salonName}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="cut" size={16} color="#8E8880" />
              <Text style={styles.infoLabel}>Service:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {serviceName}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person" size={16} color="#8E8880" />
              <Text style={styles.infoLabel}>Staff:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {staffName}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-clear" size={16} color="#8E8880" />
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={[styles.infoValue, styles.highlightTime]}>
                {dateStr} ({timeStr})
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.btnContainer}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                onClose();
                if (onViewAppointments) onViewAppointments();
              }}
              activeOpacity={0.88}
            >
              <Ionicons name="calendar" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>View My Appointments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Choose Another Time</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: S.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    ...SHADOWS.card,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1714",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#8E8880",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  conflictCard: {
    width: "100%",
    backgroundColor: "#FAF8F5",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#D97706",
    marginRight: 6,
  },
  cardHeaderTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8880",
    width: 58,
    marginLeft: 6,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1714",
    flex: 1,
  },
  highlightTime: {
    color: "#D97706",
    fontWeight: "800",
  },
  btnContainer: {
    width: "100%",
    gap: 10,
  },
  primaryBtn: {
    flexDirection: "row",
    width: "100%",
    height: 48,
    backgroundColor: "#1A1714",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryBtn: {
    width: "100%",
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  secondaryBtnText: {
    color: "#8E8880",
    fontSize: 13,
    fontWeight: "600",
  },
});
