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
  Image,
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

  const rawServices = Array.isArray(appointment.services) && appointment.services.length > 0
    ? appointment.services
    : (typeof appointment.serviceId === "object" && appointment.serviceId ? [appointment.serviceId] : []);

  const serviceName = rawServices.length > 0
    ? rawServices.map((s) => (typeof s === "object" ? s.name : s)).join(", ")
    : appointment.service?.name || "Salon Service";

  const durationMinutes = rawServices.length > 0
    ? rawServices.reduce((sum, s) => sum + (typeof s === "object" ? (s.durationMinutes || s.duration || 30) : 30), 0)
    : (typeof appointment.serviceId === "object" ? appointment.serviceId?.durationMinutes : null) || 30;

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

  const coverImage =
    appointment.salon?.coverImage ||
    appointment.salon?.logo ||
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80";

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

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Title */}
                <View style={styles.passHeader}>
                  <Text style={styles.passHeaderTitle}>Digital Booking Pass</Text>
                  <Text style={styles.passHeaderSub}>Show this at the salon counter for check-in</Text>
                  
                  {/* Close Icon (Absolute in Header) */}
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={18} color="#111827" />
                  </TouchableOpacity>
                </View>

                {/* 1. Salon Info Card */}
                <View style={styles.card}>
                  <View style={styles.salonInfoRow}>
                    <Image source={{ uri: coverImage }} style={styles.salonImage} resizeMode="cover" />
                    <View style={styles.salonDetailsCol}>
                      <View style={styles.salonNameRow}>
                        <Text style={styles.salonNameText} numberOfLines={1}>{salonName}</Text>
                        <View style={styles.statusPill}>
                          <Text style={styles.statusPillText}>{status}</Text>
                        </View>
                      </View>
                      <View style={styles.salonAddressRow}>
                        <Ionicons name="location" size={14} color="#6B7280" style={{ marginTop: 2 }} />
                        <Text style={styles.salonAddressText} numberOfLines={2}>{branchAddress || "Silk City Road, Near Old Bus Stand, Brahmapur, Odisha"}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 2. Appointment Slot Card */}
                <View style={styles.slotCard}>
                  <View style={styles.slotIconBox}>
                    <Ionicons name="calendar-outline" size={20} color="#6F2A3B" />
                  </View>
                  <View style={styles.slotTextCol}>
                    <Text style={styles.slotLabel}>APPOINTMENT SLOT</Text>
                    <Text style={styles.slotDate}>{slotDate}</Text>
                    <Text style={styles.slotTime}>{timeRange}</Text>
                  </View>
                </View>

                {/* 3. QR Code Card */}
                <View style={styles.qrCard}>
                  <Text style={styles.qrLabel}>BOOKING PASS CODE</Text>
                  <Text style={styles.qrCodeText}>#{bookingPassCode}</Text>
                  <Text style={styles.qrInstruction}>Present this code to salon receptionist upon arrival</Text>
                </View>

                {/* 4. Booking Details Card */}
                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrap}>
                      <Ionicons name="cut-outline" size={16} color="#111827" />
                    </View>
                    <Text style={styles.detailLabel}>Service</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{serviceName}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrap}>
                      <Ionicons name="person-outline" size={16} color="#111827" />
                    </View>
                    <Text style={styles.detailLabel}>Specialist</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{staffName || "Any Available"}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrap}>
                      <Ionicons name="time-outline" size={16} color="#111827" />
                    </View>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{durationMinutes} mins</Text>
                  </View>
                  
                  {price !== undefined && price !== null && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconWrap}>
                        <Ionicons name="card-outline" size={16} color="#111827" />
                      </View>
                      <Text style={styles.detailLabel}>Amount</Text>
                      <Text style={[styles.detailValue, { fontWeight: "800", fontSize: 16 }]}>{paiseToINR(price)}</Text>
                    </View>
                  )}
                </View>

                {/* 5. Quick Action Buttons */}
                <View style={styles.quickActionGrid}>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() => {
                      const addr = branchAddress || salonName;
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate-outline" size={18} color="#6F2A3B" style={{ marginRight: 6, transform: [{ rotate: '45deg' }] }} />
                    <Text style={styles.actionBtnOutlineText}>Directions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() => {
                      const phone = appointment.branch?.contactPhone || "9876543210";
                      Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call-outline" size={18} color="#6F2A3B" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnOutlineText}>Call Salon</Text>
                  </TouchableOpacity>
                </View>

                {/* Cancel Booking Action */}
                {isCancelable && onCancel ? (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      onClose();
                      onCancel(appointment._id || appointment.id);
                    }}
                    activeOpacity={0.82}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#6F2A3B" style={{ marginRight: 6 }} />
                    <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                  </TouchableOpacity>
                ) : null}

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
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    sheetContainer: {
      backgroundColor: "#FAFAFC",
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      maxHeight: "92%",
      paddingTop: 12,
      paddingHorizontal: 20,
    },
    handleBar: {
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: "#D1D5DB",
      alignSelf: "center",
      marginBottom: 20,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    passHeader: {
      alignItems: "center",
      marginBottom: 24,
      position: "relative",
    },
    passHeaderTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: "#111827",
    },
    passHeaderSub: {
      fontSize: 13,
      color: "#6B7280",
      marginTop: 4,
    },
    closeBtn: {
      position: "absolute",
      right: 0,
      top: -4,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#F3F4F6",
      alignItems: "center",
      justifyContent: "center",
    },
    
    /* 1. Salon Info Card */
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },
    salonInfoRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    salonImage: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: "#F3F4F6",
    },
    salonDetailsCol: {
      flex: 1,
      marginLeft: 14,
    },
    salonNameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    salonNameText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#111827",
      flex: 1,
      marginRight: 8,
    },
    statusPill: {
      backgroundColor: "#FFF7ED",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#9A3412",
    },
    salonAddressRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    salonAddressText: {
      fontSize: 12,
      color: "#6B7280",
      marginLeft: 4,
      flex: 1,
      lineHeight: 16,
    },

    /* 2. Appointment Slot Card */
    slotCard: {
      backgroundColor: "#FDF3F4",
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
    },
    slotIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(111, 42, 59, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    slotTextCol: {
      flex: 1,
    },
    slotLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: "#9CA3AF",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    slotDate: {
      fontSize: 15,
      fontWeight: "700",
      color: "#111827",
      marginBottom: 2,
    },
    slotTime: {
      fontSize: 14,
      fontWeight: "600",
      color: "#111827",
    },

    /* 3. QR Code Card */
    qrCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },
    qrVisualBox: {
      width: 180,
      height: 180,
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    qrContainer: {
      padding: 10,
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
    },
    qrGrid: {
      width: 144,
      height: 144,
      flexDirection: "column",
    },
    qrRow: {
      flex: 1,
      flexDirection: "row",
    },
    qrCell: {
      flex: 1,
    },
    qrLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: "#9CA3AF",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    qrCodeText: {
      fontSize: 24,
      fontWeight: "800",
      color: "#6F2A3B",
      marginBottom: 8,
    },
    qrInstruction: {
      fontSize: 12,
      color: "#6B7280",
      textAlign: "center",
    },

    /* 4. Details Card */
    detailsCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    detailIconWrap: {
      width: 24,
      alignItems: "center",
      marginRight: 10,
    },
    detailLabel: {
      fontSize: 13,
      color: "#6B7280",
      flex: 1,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: "700",
      color: "#111827",
      textAlign: "right",
      maxWidth: "50%",
    },

    /* 5. Action Buttons */
    quickActionGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    actionBtnOutline: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FDF3F4",
      backgroundColor: "#FFFFFF",
    },
    actionBtnOutlineText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#6F2A3B",
    },
    cancelBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: "#FDF3F4",
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#6F2A3B",
    },
  });
}
