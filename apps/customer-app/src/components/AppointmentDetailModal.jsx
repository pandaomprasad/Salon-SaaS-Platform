// src/components/AppointmentDetailModal.jsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, SHADOWS } from "../theme";
import { paiseToINR } from "../services/apiClient";

function formatDate(dateStr) {
  if (!dateStr) return "Date unavailable";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
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

function formatTimeRange(start, end) {
  if (!start) return "Time unavailable";
  const startFormatted = formatTime(start);
  if (!end) return startFormatted;
  const endFormatted = formatTime(end);
  return `${startFormatted} - ${endFormatted}`;
}

function formatAddress(addr) {
  if (!addr) return null;
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    const parts = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

export default function AppointmentDetailModal({
  visible,
  appointment,
  onClose,
  onCancel,
}) {
  if (!visible || !appointment) return null;

  const salonName =
    appointment.salon?.name ||
    (typeof appointment.salonId === "object" ? appointment.salonId?.name : null) ||
    (typeof appointment.branchId === "object" ? appointment.branchId?.name : null) ||
    "Salon Luxe";

  const rawAddress =
    (typeof appointment.branchId === "object" ? appointment.branchId?.address : null) ||
    (typeof appointment.branch === "object" ? appointment.branch?.address : null);
  const branchAddress = formatAddress(rawAddress);

  const serviceName =
    appointment.service?.name ||
    (typeof appointment.serviceId === "object" ? appointment.serviceId?.name : null) ||
    "Salon Service";

  const durationMinutes =
    (typeof appointment.serviceId === "object" ? appointment.serviceId?.durationMinutes : null) ||
    appointment.service?.duration ||
    30;

  const price =
    appointment.pricePaid ??
    (typeof appointment.serviceId === "object" ? appointment.serviceId?.price : null) ??
    (typeof appointment.service === "object" ? appointment.service?.price : null);

  const rawDate =
    appointment.date ||
    (typeof appointment.slotId === "object" ? appointment.slotId?.date : null) ||
    appointment.slot?.date;

  const rawStartTime =
    appointment.startTime ||
    (typeof appointment.slotId === "object" ? appointment.slotId?.startTime : null) ||
    appointment.slot?.startTime;

  const rawEndTime =
    appointment.endTime ||
    (typeof appointment.slotId === "object" ? appointment.slotId?.endTime : null) ||
    appointment.slot?.endTime;

  const staffName =
    (typeof appointment.staffId === "object" ? appointment.staffId?.name : null) ||
    (typeof appointment.staff === "object" ? appointment.staff?.name : null);

  const slotDate = formatDate(rawDate);
  const timeRange = formatTimeRange(rawStartTime, rawEndTime);
  const status = (appointment.status || "CONFIRMED").toUpperCase();
  const refCode = (appointment._id || appointment.id || "").toString().slice(-6).toUpperCase();

  const isCancelable = status === "PENDING" || status === "CONFIRMED";

  return (
    <Modal
      visible={!!visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Sheet Top Handle Bar */}
              <View style={styles.handleBar} />

              {/* Minimalist Close Icon */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={18} color="#78716C" />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Badge & Title */}
                <View style={styles.headerBox}>
                  <View style={[styles.statusBadge, getStatusStyle(status)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(status)]}>{status}</Text>
                  </View>
                  <Text style={styles.refCode}>BOOKING REF: #{refCode}</Text>
                  <Text style={styles.serviceTitle}>{serviceName}</Text>

                  <View style={styles.salonRow}>
                    <Ionicons name="location-sharp" size={14} color={C.gold} style={{ marginRight: 4 }} />
                    <Text style={styles.salonSubTitle}>{salonName}</Text>
                  </View>

                  {branchAddress ? (
                    <Text style={styles.addressText}>{branchAddress}</Text>
                  ) : null}
                </View>

                {/* Subtle Decorative Separator */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerDot}>✦</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Schedule & Details Card */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>APPOINTMENT DETAILS</Text>

                  <View style={styles.infoRow}>
                    <View style={styles.iconBox}>
                      <Ionicons name="calendar-outline" size={18} color={C.gold} />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Date</Text>
                      <Text style={styles.infoValue}>{slotDate}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.iconBox}>
                      <Ionicons name="time-outline" size={18} color={C.gold} />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Time & Duration</Text>
                      <Text style={styles.infoValue}>{timeRange} ({durationMinutes} mins)</Text>
                    </View>
                  </View>

                  {staffName ? (
                    <View style={styles.infoRow}>
                      <View style={styles.iconBox}>
                        <Ionicons name="person-outline" size={18} color={C.gold} />
                      </View>
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Assigned Stylist</Text>
                        <Text style={styles.infoValue}>{staffName}</Text>
                      </View>
                    </View>
                  ) : null}

                  {price !== undefined && price !== null ? (
                    <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                      <View style={styles.iconBox}>
                        <Ionicons name="pricetag-outline" size={18} color={C.gold} />
                      </View>
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Total Amount</Text>
                        <Text style={[styles.infoValue, { color: C.dark, fontSize: 16, fontWeight: "900" }]}>
                          {paiseToINR(price)}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Special Customer Instructions */}
                {appointment.customerNotes ? (
                  <View style={styles.notesBox}>
                    <View style={styles.notesHeaderRow}>
                      <Ionicons name="document-text-outline" size={14} color={C.gold} />
                      <Text style={styles.notesSectionHeader}>SPECIAL INSTRUCTIONS</Text>
                    </View>
                    <Text style={styles.notesText}>{appointment.customerNotes}</Text>
                  </View>
                ) : null}

                {/* Quick Action Row */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: S.md }}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 10, gap: 6 }}
                    onPress={() => {
                      const phone = appointment.branch?.phone || "9876543210";
                      Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call-outline" size={16} color={C.ink} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: C.ink }}>Call Salon</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 10, gap: 6 }}
                    onPress={() => {
                      const addr = branchAddress || salonName;
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate-outline" size={16} color={C.ink} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: C.ink }}>Directions</Text>
                  </TouchableOpacity>
                </View>

                {/* Classy Action Buttons */}
                <View style={styles.actionContainer}>
                  {isCancelable && onCancel ? (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        onClose();
                        onCancel(appointment._id || appointment.id);
                      }}
                      activeOpacity={0.82}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                      <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.88}>
                    <Text style={styles.doneBtnText}>Close Details</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function getStatusStyle(status) {
  switch (status) {
    case "CONFIRMED":
    case "PENDING":
      return { backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.25)" };
    case "IN_PROGRESS":
      return { backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "rgba(59, 130, 246, 0.25)" };
    case "COMPLETED":
      return { backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "rgba(217, 119, 6, 0.25)" };
    case "CANCELLED":
    case "NO_SHOW":
      return { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.2)" };
    default:
      return { backgroundColor: "rgba(0,0,0,0.04)" };
  }
}

function getStatusTextStyle(status) {
  switch (status) {
    case "CONFIRMED":
    case "PENDING":
      return { color: "#047857" };
    case "IN_PROGRESS":
      return { color: "#1D4ED8" };
    case "COMPLETED":
      return { color: "#B45309" };
    case "CANCELLED":
    case "NO_SHOW":
      return { color: "#B91C1C" };
    default:
      return { color: C.dark };
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(13, 11, 24, 0.72)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    maxHeight: "88%",
    backgroundColor: "#FAF9F5",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: S.lg,
    paddingBottom: S.xl,
    borderWidth: 1,
    borderColor: "rgba(180, 148, 96, 0.18)",
    ...SHADOWS.lg,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(180, 148, 96, 0.3)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: S.xs,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: S.lg,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  scrollContent: {
    paddingTop: S.xs,
    paddingBottom: S.lg,
  },
  headerBox: {
    alignItems: "center",
    marginTop: S.xs,
    marginBottom: S.xs,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  refCode: {
    fontSize: 10,
    fontWeight: "800",
    color: C.muted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  salonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  salonSubTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.gold,
    textAlign: "center",
  },
  addressText: {
    fontSize: 12,
    color: "#78716C",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: S.md,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: S.md,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(180, 148, 96, 0.15)",
  },
  dividerDot: {
    fontSize: 10,
    color: C.gold,
    opacity: 0.7,
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: "rgba(180, 148, 96, 0.16)",
    ...SHADOWS.sm,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: C.muted,
    letterSpacing: 1.4,
    marginBottom: S.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(180, 148, 96, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(180, 148, 96, 0.16)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: S.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#A8A29E",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: "#FFFDF9",
    borderRadius: 16,
    padding: S.md,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: "rgba(180, 148, 96, 0.2)",
  },
  notesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  notesSectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1,
  },
  notesText: {
    fontSize: 13,
    color: C.text,
    fontWeight: "500",
    lineHeight: 18,
  },
  actionContainer: {
    gap: 12,
    marginTop: S.xs,
  },
  cancelBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.18)",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
  },
  doneBtn: {
    backgroundColor: C.dark,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: C.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 0.3,
  },
});
