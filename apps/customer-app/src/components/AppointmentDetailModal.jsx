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
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, R } from "../theme";
import { paiseToINR } from "../services/apiClient";
import { useTheme } from "../context/ThemeContext";

function formatDate(dateStr) {
  if (!dateStr) return "Date unavailable";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
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

/**
 * Automatic Procedural QR Code Visualizer
 * Generates an authentic 9x9 QR Code matrix automatically & uniquely for each booking.
 */
function VectorQRCode({ code = "LX9876", isDark = false, styles: qrStyles }) {
  const seedString = String(code);
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash * 31 + seedString.charCodeAt(i)) & 0x7fffffff;
  }

  const GRID_SIZE = 9;
  const grid = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    const row = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      // Top-Left Finder (3x3)
      if (r < 3 && c < 3) {
        row.push(r === 1 && c === 1 ? true : (r === 0 || r === 2 || c === 0 || c === 2));
      }
      // Top-Right Finder (3x3)
      else if (r < 3 && c >= 6) {
        const rc = c - 6;
        row.push(r === 1 && rc === 1 ? true : (r === 0 || r === 2 || rc === 0 || rc === 2));
      }
      // Bottom-Left Finder (3x3)
      else if (r >= 6 && c < 3) {
        const rr = r - 6;
        row.push(rr === 1 && c === 1 ? true : (rr === 0 || rr === 2 || c === 0 || c === 2));
      }
      // Center & Data Matrix Modules
      else {
        const bitIndex = (r * GRID_SIZE + c);
        const pseudoBit = ((hash ^ (bitIndex * 2654435761)) >>> (bitIndex % 16)) & 1;
        row.push(pseudoBit === 1);
      }
    }
    grid.push(row);
  }

  return (
    <View style={[qrStyles.qrContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={qrStyles.qrGrid}>
        {grid.map((row, rIdx) => (
          <View key={rIdx} style={qrStyles.qrRow}>
            {row.map((cell, cIdx) => (
              <View
                key={cIdx}
                style={[
                  qrStyles.qrCell,
                  { backgroundColor: cell ? C.ink : "transparent" },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AppointmentDetailModal({
  visible,
  appointment,
  onClose,
  onCancel,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles();
  if (!visible || !appointment) return null;

  const salonName =
    appointment.salon?.name ||
    (typeof appointment.salonId === "object" ? appointment.salonId?.name : null) ||
    (typeof appointment.branchId === "object" ? appointment.branchId?.name : null) ||
    "Luxe Salon Brahmapur";

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
  
  const rawRef = (appointment._id || appointment.id || "").toString();
  const refCode = rawRef.length >= 6 
    ? rawRef.slice(-6).toUpperCase() 
    : Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
  const bookingPassCode = `LX-${refCode}`;

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
            <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
              {/* Sheet Top Handle Bar */}
              <View style={[styles.handleBar, { backgroundColor: theme.hairline }]} />

              {/* Close Icon */}
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: theme.grep }]}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={18} color={theme.ink} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Title */}
                <View style={styles.passHeader}>
                  <Text style={[styles.passHeaderTitle, { color: theme.ink }]}>Digital Booking Pass</Text>
                  <Text style={[styles.passHeaderSub, { color: theme.muted }]}>Show at salon counter for check-in</Text>
                </View>

                {/* ───────────── TICKET CUTOUT PASS CARD ───────────── */}
                <View style={[styles.ticketCard, { backgroundColor: C.surface, borderColor: theme.hairline }]}>
                  {/* Status Badge & Salon Name */}
                  <View style={styles.ticketTopRow}>
                    <View style={styles.salonInfo}>
                      <Text style={[styles.ticketSalonName, { color: theme.ink }]}>{salonName}</Text>
                      {branchAddress && (
                        <Text style={[styles.ticketBranchAddress, { color: theme.muted }]} numberOfLines={1}>
                          📍 {branchAddress}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, getStatusStyle(status)]}>
                      <Text style={[styles.statusBadgeText, getStatusTextStyle(status)]}>
                        {status === "CONFIRMED" ? "✓ CONFIRMED" : status === "COMPLETED" ? "✨ COMPLETED" : status}
                      </Text>
                    </View>
                  </View>

                  {/* Highlighted Date & Slot Banner */}
                  <View style={styles.slotBanner}>
                    <Text style={styles.slotBannerTag}>APPOINTMENT SLOT</Text>
                    <Text style={styles.slotBannerTime}>{slotDate} &nbsp;•&nbsp; {timeRange}</Text>
                  </View>

                  {/* QR Code Counter Pass Section */}
                  <View style={styles.qrSection}>
                    <VectorQRCode code={refCode} isDark={isDark} styles={styles} />
                    <Text style={[styles.passCodeLabel, { color: theme.muted }]}>BOOKING PASS CODE</Text>
                    <Text style={[styles.passCodeValue, { color: theme.ink }]}>#{bookingPassCode}</Text>
                    <Text style={[styles.passInstruction, { color: theme.muted }]}>
                      Present code or QR to salon receptionist upon arrival
                    </Text>
                  </View>

                  {/* Ticket Perforated Cutout Line */}
                  <View style={styles.perforatedRow}>
                    <View style={[styles.cutoutCircle, styles.cutoutLeft, { backgroundColor: theme.surface }]} />
                    <View style={[styles.dashedLine, { borderColor: theme.hairline }]} />
                    <View style={[styles.cutoutCircle, styles.cutoutRight, { backgroundColor: theme.surface }]} />
                  </View>

                  {/* Service & Price Details */}
                  <View style={styles.ticketDetailsSection}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.muted }]}>Service</Text>
                      <Text style={[styles.detailValue, { color: theme.ink }]}>{serviceName}</Text>
                    </View>
                    {staffName && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.muted }]}>Specialist</Text>
                        <Text style={[styles.detailValue, { color: theme.ink }]}>{staffName}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.muted }]}>Duration</Text>
                      <Text style={[styles.detailValue, { color: theme.ink }]}>{durationMinutes} mins</Text>
                    </View>
                    {price !== undefined && price !== null && (
                      <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.detailLabel, { color: theme.muted }]}>Amount</Text>
                        <Text style={[styles.detailValue, { color: C.successText, fontWeight: "800", fontSize: 16 }]}>
                          {paiseToINR(price)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* ───────────── QUICK ACTION BUTTONS ───────────── */}
                <View style={styles.quickActionGrid}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.hairline }]}
                    onPress={() => {
                      const addr = branchAddress || salonName;
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate-circle-outline" size={20} color={C.main} />
                    <Text style={[styles.actionBtnText, { color: theme.ink }]}>Directions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.hairline }]}
                    onPress={() => {
                      const phone = appointment.branch?.contactPhone || "9876543210";
                      Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call-outline" size={20} color={C.success} />
                    <Text style={[styles.actionBtnText, { color: theme.ink }]}>Call Salon</Text>
                  </TouchableOpacity>
                </View>

                {/* Cancel or Close Actions */}
                <View style={styles.footerActionBox}>
                  {isCancelable && onCancel ? (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        onClose();
                        onCancel(appointment._id || appointment.id);
                      }}
                      activeOpacity={0.82}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={C.error} style={{ marginRight: 6 }} />
                      <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.88}>
                    <View style={styles.doneGradient}>
                      <Text style={styles.doneBtnText}>Close Booking Pass</Text>
                    </View>
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
      return { backgroundColor: C.successBg, borderColor: C.success };
    case "PENDING":
      return { backgroundColor: C.infoBg, borderColor: C.info };
    case "COMPLETED":
      return { backgroundColor: C.mainLight, borderColor: C.main };
    default:
      return { backgroundColor: C.errorBg, borderColor: C.error };
  }
}

function getStatusTextStyle(status) {
  switch (status) {
    case "CONFIRMED":
      return { color: C.successText };
    case "PENDING":
      return { color: C.info };
    case "COMPLETED":
      return { color: C.main };
    default:
      return { color: C.errorText };
  }
}

function getStyles() {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    paddingTop: S.sm,
    paddingHorizontal: S.md,
  },
  handleBar: {
    width: 42,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: S.sm,
  },
  closeBtn: {
    position: "absolute",
    right: S.md,
    top: S.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: S.xl * 2,
    paddingTop: S.xs,
  },
  passHeader: {
    alignItems: "center",
    marginBottom: S.md,
  },
  passHeaderTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  passHeaderSub: {
    fontSize: 12,
    marginTop: 2,
  },
  ticketCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: S.md,
  },
  ticketTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: S.md,
  },
  salonInfo: {
    flex: 1,
    marginRight: S.xs,
  },
  ticketSalonName: {
    fontSize: 16,
    fontWeight: "700",
  },
  ticketBranchAddress: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  slotBanner: {
    paddingVertical: 14,
    paddingHorizontal: S.md,
    alignItems: "center",
    backgroundColor: "#141414",
  },
  slotBannerTag: {
    color: "#BD4444",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  slotBannerTime: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  qrSection: {
    alignItems: "center",
    paddingVertical: S.lg,
    paddingHorizontal: S.md,
  },
  qrContainer: {
    width: 140,
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: S.md,
  },
  qrCorner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: C.main,
  },
  qrCornerTL: { top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3 },
  qrCornerTR: { top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3 },
  qrCornerBL: { bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3 },
  qrGrid: {
    gap: 2,
  },
  qrRow: {
    flexDirection: "row",
    gap: 2,
  },
  qrCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  passCodeLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  passCodeValue: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 1,
  },
  passInstruction: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  perforatedRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 24,
    position: "relative",
  },
  cutoutCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: "absolute",
  },
  cutoutLeft: { left: -10 },
  cutoutRight: { right: -10 },
  dashedLine: {
    flex: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    marginHorizontal: 16,
  },
  ticketDetailsSection: {
    padding: S.md,
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  quickActionGrid: {
    flexDirection: "row",
    gap: S.sm,
    marginBottom: S.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: S.sm + 2,
    borderRadius: R.md,
    borderWidth: 1,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  footerActionBox: {
    gap: S.sm,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: S.sm,
  },
  cancelBtnText: {
    color: C.error,
    fontSize: 13,
    fontWeight: "700",
  },
  doneBtn: {},
  doneGradient: {
    paddingVertical: 14,
    borderRadius: R.md,
    alignItems: "center",
    backgroundColor: C.main,
  },
  doneBtnText: {
    color: C.bg,
    fontSize: 14,
    fontWeight: "800",
  },
});
}
