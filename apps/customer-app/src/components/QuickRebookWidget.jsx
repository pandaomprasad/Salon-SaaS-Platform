// src/components/QuickRebookWidget.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R } from "../theme";
import BouncyButton from "./BouncyButton";

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch (e) { return dateStr; }
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  try {
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  } catch (e) { return timeStr; }
}

export default function QuickRebookWidget({ isAuthenticated = true, appointment, onRebook, onViewDetails, onLogin }) {
  const styles = getStyles();

  if (!isAuthenticated) {
    return (
      <BouncyButton style={styles.card} onPress={onLogin || onRebook}>
        <View style={styles.iconBox}>
          <Ionicons name="calendar-outline" size={18} color={C.ink} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.cardTitle}>Track your appointments</Text>
          <Text style={styles.cardSub}>Sign in to view active bookings</Text>
        </View>
        <View style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Sign in</Text>
        </View>
      </BouncyButton>
    );
  }

  const isUpcoming = appointment && ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes((appointment.status || "").toUpperCase());

  const salonName =
    appointment?.salon?.name ||
    (typeof appointment?.salonId === "object" ? appointment.salonId?.name : null) ||
    (typeof appointment?.branchId === "object" ? appointment.branchId?.name : null) ||
    "Your studio";

  const serviceName =
    appointment?.service?.name ||
    (typeof appointment?.serviceId === "object" ? appointment.serviceId?.name : null) ||
    "Service";

  const rawDate = appointment?.date || (typeof appointment?.slotId === "object" ? appointment.slotId?.date : null);
  const rawTime = appointment?.startTime || (typeof appointment?.slotId === "object" ? appointment.slotId?.startTime : null);
  const formattedDate = formatDate(rawDate);
  const formattedTime = formatTime(rawTime);

  const handlePress = isUpcoming ? (onViewDetails || onRebook) : onRebook;

  return (
    <BouncyButton style={[styles.card, isUpcoming && styles.cardActive]} onPress={handlePress}>
      {/* Timeline pill for status */}
      <View style={[styles.iconBox, { backgroundColor: isUpcoming ? C.grep : C.lifted }]}>
        <Ionicons name={isUpcoming ? "calendar" : "refresh-outline"} size={16} color={C.ink} />
      </View>

      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{salonName}</Text>
          {isUpcoming ? (
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>CONFIRMED</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cardSub} numberOfLines={1}>
          {isUpcoming && formattedDate ? `${formattedDate}${formattedTime ? ` · ${formattedTime}` : ""}` : serviceName}
        </Text>
      </View>

      {/* Primary button per cursor/DESIGN.md: 8px radius, Cursor Orange or Ink */}
      <View style={[styles.primaryBtn, isUpcoming && styles.secondaryBtn]}>
        <Text style={[styles.primaryBtnText, isUpcoming && styles.secondaryBtnText]}>
          {isUpcoming ? "View" : "Rebook"}
        </Text>
      </View>
    </BouncyButton>
  );
}

function getStyles() {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: S.md,
      marginBottom: S.md,
      padding: S.md,
      borderRadius: R.lg,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
    },
    cardActive: {
      backgroundColor: C.surface,
      borderColor: C.borderDark,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: C.lifted,
      alignItems: "center",
      justifyContent: "center",
      marginRight: S.sm,
      borderWidth: 1,
      borderColor: C.borderLight,
    },
    textBlock: {
      flex: 1,
      marginRight: S.xs,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    cardTitle: {
      fontSize: FS.bodySm,
      fontWeight: FW.semiBold,
      color: C.ink,
      flexShrink: 1,
    },
    statusPill: {
      backgroundColor: C.grep,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: R.pill,
    },
    statusPillText: {
      fontSize: 9,
      fontWeight: FW.semiBold,
      color: C.ink,
      letterSpacing: 0.88,
    },
    cardSub: {
      fontSize: FS.bodySm - 1,
      color: C.body,
      marginTop: 2,
    },
    primaryBtn: {
      backgroundColor: C.main,
      paddingHorizontal: S.md,
      paddingVertical: 6,
      borderRadius: R.md,
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
    secondaryBtn: {
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.borderDark,
    },
    secondaryBtnText: {
      color: C.ink,
    },
  });
};
