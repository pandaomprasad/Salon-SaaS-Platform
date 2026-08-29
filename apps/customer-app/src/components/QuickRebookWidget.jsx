// src/components/QuickRebookWidget.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, SHADOWS } from "../theme";
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

function getDateParts(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    return {
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      day: d.getDate(),
    };
  } catch (e) { return null; }
}

export default function QuickRebookWidget({ isAuthenticated = true, appointment, onRebook, onViewDetails, onLogin }) {
  const styles = getStyles();

  if (!isAuthenticated) {
    return (
      <BouncyButton style={styles.card} onPress={onLogin || onRebook}>
        <View style={styles.badgeCircle}>
          <Ionicons name="calendar-outline" size={20} color={"#fff"} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.cardTitle}>Your bookings, all in one place</Text>
          <Text style={styles.cardSub}>Sign in to keep track</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Sign in</Text>
          <Ionicons name="arrow-forward" size={13} color={"#000"} style={{ marginLeft: 4 }} />
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
  const dateParts = getDateParts(rawDate);

  const handlePress = isUpcoming ? (onViewDetails || onRebook) : onRebook;

  // ---- Upcoming appointment: date-badge layout ----
  if (isUpcoming) {
    return (
      <BouncyButton style={[styles.card, styles.cardActive]} onPress={handlePress}>
        <View style={styles.dateBadge}>
          {dateParts ? (
            <>
              <Text style={styles.dateBadgeWeekday}>{dateParts.weekday}</Text>
              <Text style={styles.dateBadgeDay}>{dateParts.day}</Text>
            </>
          ) : (
            <Ionicons name="calendar" size={18} color={C.ink} />
          )}
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.cardTitleDark} numberOfLines={1}>{salonName}</Text>
          <View style={styles.metaRow}>
            <View style={styles.statusDot} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formattedTime ? `${formattedTime} · ` : ""}{serviceName}
            </Text>
          </View>
        </View>

        <View style={styles.iconBtnOutline}>
          <Ionicons name="chevron-forward" size={16} color={C.ink} />
        </View>
      </BouncyButton>
    );
  }

  // ---- No upcoming appointment: rebook prompt ----
  return (
    <BouncyButton style={styles.card} onPress={handlePress}>
      <View style={styles.badgeCircle}>
        <Ionicons name="refresh-outline" size={18} color={"#fff"} />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.cardTitle} numberOfLines={1}>{salonName}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>Last visit · {serviceName}</Text>
      </View>

      <View style={styles.chip}>
        <Text style={styles.chipText}>Rebook</Text>
        <Ionicons name="arrow-forward" size={13} color={"#000"} style={{ marginLeft: 4 }} />
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
      marginBottom: S.sm,
      padding: S.md,
      borderRadius: R.lg,
      backgroundColor: C.blue,
      borderWidth: 1,
      borderColor: C.blue,
      // ...SHADOWS.sm,
      shadowColor: C.blue,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 5,
    },
    cardActive: {
      backgroundColor: C.surface,
      borderColor: C.borderDark,
    },

    // circular icon badge used on the blue "rebook" card
    badgeCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: S.sm,
    },

    // date badge used on the upcoming-appointment card
    dateBadge: {
      width: 44,
      height: 48,
      borderRadius: R.md,
      backgroundColor: C.lifted,
      borderWidth: 1,
      borderColor: C.borderDark,
      alignItems: "center",
      justifyContent: "center",
      marginRight: S.sm,
    },
    dateBadgeWeekday: {
      fontSize: 9,
      fontWeight: FW.semiBold,
      color: C.body,
      letterSpacing: 0.5,
    },
    dateBadgeDay: {
      fontSize: FS.bodySm + 5,
      fontWeight: FW.semiBold,
      color: C.ink,
      lineHeight: FS.bodySm + 6,
    },

    textBlock: {
      flex: 1,
      marginRight: S.xs,
    },
    cardTitle: {
      fontSize: FS.bodySm,
      fontWeight: FW.semiBold,
      color: "#fff",
    },
    cardTitleDark: {
      fontSize: FS.bodySm,
      fontWeight: FW.semiBold,
      color: C.ink,
    },
    cardSub: {
      fontSize: FS.bodySm - 1,
      color: "rgba(255,255,255,0.75)",
      marginTop: 2,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 3,
    },
    statusDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: C.grep,
      marginRight: 5,
    },
    metaText: {
      fontSize: FS.bodySm - 1,
      color: C.body,
      flexShrink: 1,
    },

    // pill CTA used on both "sign in" and "rebook" cards
    chip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      paddingHorizontal: S.md,
      paddingVertical: 7,
      borderRadius: R.pill,
    },
    chipText: {
      color: "#000",
      fontSize: FS.bodySm - 1,
      fontWeight: FW.semiBold,
    },

    // compact circular affordance on the upcoming-appointment card
    iconBtnOutline: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.blue,
      borderWidth: 1,
      borderColor: C.borderDark,
    },
  });
};