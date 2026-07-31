// src/components/QuickRebookWidget.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { S } from "../theme";
import { paiseToINR } from "../services/apiClient";
import BouncyButton from "./BouncyButton";

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  try {
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
}

export default function QuickRebookWidget({
  isAuthenticated = true,
  appointment,
  onRebook,
  onViewDetails,
  onLogin,
}) {
  // 1. Guest Unauthenticated State
  if (!isAuthenticated) {
    return (
      <View style={[styles.widgetCard, styles.guestWidgetCard]}>
        <View style={styles.headerRow}>
          <View style={[styles.titleBadge, styles.guestBadge]}>
            <Ionicons name="lock-closed" size={12} color="#E6CA65" />
            <Text style={styles.badgeText}>UPCOMING APPOINTMENTS</Text>
          </View>
          <Text style={styles.lastVisitText}>Guest Mode</Text>
        </View>

        <View style={styles.bodyRow}>
          <View style={styles.salonInfo}>
            <Text style={styles.salonName} numberOfLines={1}>
              Track your salon bookings
            </Text>
            <Text style={styles.serviceName}>
              Login to check your upcoming visits & history
            </Text>
          </View>

          <BouncyButton style={styles.rebookBtn} onPress={onLogin || onRebook}>
            <Text style={styles.rebookText}>Login to Check</Text>
            <Ionicons name="arrow-forward" size={13} color="#1A1A1A" />
          </BouncyButton>
        </View>
      </View>
    );
  }

  // 2. Authenticated State (Active Upcoming or Past Appointment)
  const isUpcoming =
    appointment &&
    ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes((appointment.status || "").toUpperCase());

  const salonName =
    appointment?.salon?.name ||
    (typeof appointment?.salonId === "object" ? appointment.salonId?.name : null) ||
    (typeof appointment?.branchId === "object" ? appointment.branchId?.name : null) ||
    "Enrich Hair & Skin Studio";

  const serviceName =
    appointment?.service?.name ||
    (typeof appointment?.serviceId === "object" ? appointment.serviceId?.name : null) ||
    "Haircut & Scalp Spa";

  const price =
    appointment?.pricePaid ??
    (typeof appointment?.serviceId === "object" ? appointment.serviceId?.price : null) ??
    120000;

  const rawDate =
    appointment?.date ||
    (typeof appointment?.slotId === "object" ? appointment.slotId?.date : null);

  const rawTime =
    appointment?.startTime ||
    (typeof appointment?.slotId === "object" ? appointment.slotId?.startTime : null);

  const formattedDate = formatDate(rawDate);
  const formattedTime = formatTime(rawTime);

  const badgeTitle = isUpcoming
    ? "UPCOMING VISIT"
    : appointment
    ? "PAST VISIT"
    : "QUICK REBOOK";

  const subDateText = isUpcoming && formattedDate
    ? `📅 ${formattedDate}${formattedTime ? ` • ${formattedTime}` : ""}`
    : "12 days ago";

  const btnText = isUpcoming ? "View Visit" : "Book Again";
  const handlePress = isUpcoming ? (onViewDetails || onRebook) : onRebook;

  return (
    <View style={[styles.widgetCard, isUpcoming && styles.upcomingWidgetCard]}>
      <View style={styles.headerRow}>
        <View style={[styles.titleBadge, isUpcoming && styles.upcomingBadge]}>
          <Ionicons
            name={isUpcoming ? "calendar" : "sparkles"}
            size={12}
            color={isUpcoming ? "#34D399" : "#E6CA65"}
          />
          <Text style={[styles.badgeText, isUpcoming && styles.upcomingBadgeText]}>
            {badgeTitle}
          </Text>
        </View>
        <Text style={styles.lastVisitText}>{subDateText}</Text>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.salonInfo}>
          <Text style={styles.salonName} numberOfLines={1}>
            {salonName}
          </Text>
          <Text style={styles.serviceName}>
            {serviceName} • {paiseToINR(price)}
          </Text>
        </View>

        <BouncyButton style={styles.rebookBtn} onPress={handlePress}>
          <Text style={styles.rebookText}>{btnText}</Text>
          <Ionicons name="arrow-forward" size={13} color="#1A1A1A" />
        </BouncyButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  widgetCard: {
    marginHorizontal: S.lg,
    marginTop: S.sm,
    marginBottom: S.md,
    padding: 20,
    borderRadius: 28,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  upcomingWidgetCard: {
    borderColor: "rgba(52, 211, 153, 0.35)",
    backgroundColor: "#121C18",
  },
  guestWidgetCard: {
    borderColor: "rgba(230, 202, 101, 0.3)",
    backgroundColor: "#1A1A1A",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  guestBadge: {
    backgroundColor: "rgba(230, 202, 101, 0.12)",
    borderColor: "rgba(230, 202, 101, 0.3)",
  },
  upcomingBadge: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  badgeText: {
    color: "#E6CA65",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  upcomingBadgeText: {
    color: "#6EE7B7",
  },
  lastVisitText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "600",
  },
  bodyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  salonInfo: {
    flex: 1,
    marginRight: 12,
  },
  salonName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  serviceName: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 3,
    fontWeight: "400",
  },
  rebookBtn: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  rebookText: {
    color: "#1A1A1A",
    fontWeight: "900",
    fontSize: 12,
  },
});
