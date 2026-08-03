// src/screen/BookingsScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, SHADOWS } from "../theme";
import { appointmentService } from "../services/appointmentService";
import { paiseToINR } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { socketClient } from "../services/socketClient";
import { notificationService } from "../services/notificationService";
import ErrorCardModal from "../components/ErrorCardModal";
import AppointmentDetailModal from "../components/AppointmentDetailModal";
import RescheduleModal from "../components/RescheduleModal";
import CancelBookingModal from "../components/CancelBookingModal";

const TABS = ["Active", "Completed", "Cancelled"];

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

export default function BookingsScreen({ navigate, onScroll }) {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("Active");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [statusToast, setStatusToast] = useState(null);

  const appointmentsRef = React.useRef(appointments);
  appointmentsRef.current = appointments;

  const fetchAppointments = async (silent = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      const res = await appointmentService.getAppointments();
      const newApptList = res.data?.appointments || (Array.isArray(res.data) ? res.data : []);

      // Real-time status change detection
      if (silent && appointmentsRef.current.length > 0) {
        newApptList.forEach((newAppt) => {
          const oldAppt = appointmentsRef.current.find(
            (a) => (a._id || a.id) === (newAppt._id || newAppt.id)
          );
          if (oldAppt && oldAppt.status !== newAppt.status) {
            const salonName =
              newAppt.salon?.name ||
              (typeof newAppt.salonId === "object" ? newAppt.salonId?.name : null) ||
              "Salon";
            const serviceName =
              newAppt.service?.name ||
              (typeof newAppt.serviceId === "object" ? newAppt.serviceId?.name : null) ||
              "Service";

            // Trigger System Push Notification
            notificationService.notifyStatusChange(newAppt.status, salonName, serviceName);

            if (newAppt.status === "CONFIRMED") {
              setStatusToast({
                type: "success",
                title: "🎉 Booking Accepted!",
                message: `${salonName} accepted your appointment for ${serviceName}.`,
              });
            } else if (newAppt.status === "IN_PROGRESS") {
              setStatusToast({
                type: "info",
                title: "✂️ Service Started!",
                message: `Your appointment for ${serviceName} is now in progress.`,
              });
            } else if (newAppt.status === "COMPLETED") {
              setStatusToast({
                type: "success",
                title: "🌟 Service Completed!",
                message: `Thank you for visiting ${salonName}.`,
              });
            } else if (newAppt.status === "CANCELLED") {
              setStatusToast({
                type: "warning",
                title: "⚠️ Appointment Cancelled",
                message: `Your booking for ${serviceName} was cancelled.`,
              });
            }
          }
        });
      }

      setAppointments(newApptList);
    } catch (err) {
      console.log("Error loading appointments:", err.message);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load & notification permission request
  useEffect(() => {
    notificationService.requestPermissions();
    fetchAppointments(false);
  }, [isAuthenticated]);

  // Real-Time Event-Driven WebSockets + Automatic Polling Fallback
  useEffect(() => {
    if (!isAuthenticated) return;
    const userId = user?._id || user?.id;
    if (userId) {
      socketClient.connect(userId);
    }

    const unsubscribe = socketClient.onAppointmentStatusChanged((data) => {
      fetchAppointments(true);
    });

    const interval = setInterval(() => {
      fetchAppointments(true);
    }, 8000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isAuthenticated, user, fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleCancel = async (id) => {
    try {
      await appointmentService.cancelAppointment(id);
      fetchAppointments();
    } catch (err) {
      setError(err.message || "Failed to cancel appointment");
    }
  };

  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [cancelApptModal, setCancelApptModal] = useState(null);

  const handleConfirmCancel = async (id, reason) => {
    try {
      await appointmentService.cancelAppointment(id, reason);
      fetchAppointments();
    } catch (err) {
      setError(err.message || "Failed to cancel appointment");
    }
  };

  const handleConfirmReschedule = async (id, newSlotId) => {
    try {
      await appointmentService.rescheduleAppointment(id, newSlotId);
      setStatusToast({
        type: "success",
        title: "📅 Rescheduled Successfully!",
        message: "Your appointment has been updated to your new chosen time slot.",
      });
      fetchAppointments(true);
    } catch (err) {
      const msg = err.message || "Failed to reschedule appointment";
      setError(msg);
      throw new Error(msg);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔒</Text>
        <Text style={styles.emptyTitle}>Sign in to view your appointments</Text>
        <Text style={styles.emptySub}>
          Log in to track your upcoming salon visits, view booking history, and manage your schedule.
        </Text>
        <TouchableOpacity
          style={styles.signInBtn}
          onPress={() => navigate && navigate("Login")}
          activeOpacity={0.88}
        >
          <Text style={styles.signInBtnText}>Sign In Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredAppointments = appointments.filter((app) => {
    const status = app.status?.toUpperCase() || "";
    if (activeTab === "Active") return status === "PENDING" || status === "CONFIRMED" || status === "IN_PROGRESS";
    if (activeTab === "Completed") return status === "COMPLETED";
    if (activeTab === "Cancelled") return status === "CANCELLED" || status === "NO_SHOW";
    return true;
  });

  return (
    <View style={styles.container}>
      <ErrorCardModal
        visible={!!error}
        title="Appointments Notice"
        message={error}
        onClose={() => setError(null)}
      />

      <AppointmentDetailModal
        visible={!!selectedAppt}
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onCancel={(id) => setCancelApptModal(selectedAppt)}
      />

      <RescheduleModal
        visible={!!rescheduleAppt}
        booking={rescheduleAppt}
        onClose={() => setRescheduleAppt(null)}
        onConfirm={handleConfirmReschedule}
      />

      <CancelBookingModal
        visible={!!cancelApptModal}
        booking={cancelApptModal}
        onClose={() => setCancelApptModal(null)}
        onConfirm={handleConfirmCancel}
      />

      {/* Real-time Status Change Toast Notification */}
      {statusToast && (
        <View style={styles.toastBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toastTitle}>{statusToast.title}</Text>
            <Text style={styles.toastMessage}>{statusToast.message}</Text>
          </View>
          <TouchableOpacity onPress={() => setStatusToast(null)} style={styles.toastCloseBtn}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Aesthetic Minimal Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
        <Text style={styles.subtitle}>Manage your upcoming & past salon visits</Text>

        {/* Minimal Pill Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isSelected ? styles.tabSelected : styles.tabUnselected]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isSelected ? styles.tabTextSelected : styles.tabTextUnselected]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />
        }
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color={C.dark} />
            <Text style={styles.loadingText}>Fetching your appointments...</Text>
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.noApptTitle}>No {activeTab.toLowerCase()} appointments</Text>
            <Text style={styles.noApptSub}>
              {activeTab === "Active"
                ? "You don't have any upcoming salon visits scheduled."
                : `No ${activeTab.toLowerCase()} bookings recorded.`}
            </Text>
          </View>
        ) : (
          filteredAppointments.map((appt) => {
            const salonName =
              appt.salon?.name ||
              (typeof appt.salonId === "object" ? appt.salonId?.name : null) ||
              (typeof appt.branchId === "object" ? appt.branchId?.name : null) ||
              "Salon Luxe";

            const serviceName =
              appt.service?.name ||
              (typeof appt.serviceId === "object" ? appt.serviceId?.name : null) ||
              "Salon Service";

            const price =
              appt.pricePaid ??
              (typeof appt.serviceId === "object" ? appt.serviceId?.price : null) ??
              (typeof appt.service === "object" ? appt.service?.price : null);

            const rawDate =
              appt.date ||
              (typeof appt.slotId === "object" ? appt.slotId?.date : null) ||
              appt.slot?.date;

            const rawStartTime =
              appt.startTime ||
              (typeof appt.slotId === "object" ? appt.slotId?.startTime : null) ||
              appt.slot?.startTime;

            const rawEndTime =
              appt.endTime ||
              (typeof appt.slotId === "object" ? appt.slotId?.endTime : null) ||
              appt.slot?.endTime;

            const staffName =
              (typeof appt.staffId === "object" ? appt.staffId?.name : null) ||
              (typeof appt.staff === "object" ? appt.staff?.name : null);

            const slotDate = formatDate(rawDate);
            const timeRange = formatTimeRange(rawStartTime, rawEndTime);
            const status = appt.status || "CONFIRMED";

            return (
              <TouchableOpacity
                key={appt._id || appt.id}
                style={styles.card}
                activeOpacity={0.88}
                onPress={() => setSelectedAppt(appt)}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: S.sm }}>
                    <Text style={styles.salonName}>{salonName.toUpperCase()}</Text>
                    <Text style={styles.serviceName}>{serviceName}</Text>
                    {staffName ? (
                      <Text style={styles.staffText}>✂️ Stylist: {staffName}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.statusBadge, getStatusStyle(status)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(status)]}>{status}</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardDetails}>
                  <View style={styles.metaRow}>
                    <Text style={styles.detailText}>📅  {slotDate}</Text>
                    <Text style={styles.detailText}>⏰  {timeRange}</Text>
                  </View>
                  {price !== undefined && price !== null ? (
                    <Text style={styles.detailPrice}>{paiseToINR(price)}</Text>
                  ) : null}
                </View>

                {status === "PENDING" || status === "CONFIRMED" ? (
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.rescheduleBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setRescheduleAppt(appt);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setCancelApptModal(appt);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function getStatusStyle(status) {
  switch (status.toUpperCase()) {
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
  switch (status.toUpperCase()) {
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
  container: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  header: {
    backgroundColor: "#F7F5F0",
    paddingTop: 54,
    paddingHorizontal: S.lg,
    paddingBottom: S.md,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1714",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#8E877D",
    marginTop: 2,
    marginBottom: S.lg,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 24,
  },
  tabSelected: {
    backgroundColor: "#121016",
  },
  tabUnselected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextSelected: {
    color: "#FFFFFF",
  },
  tabTextUnselected: {
    color: "#78716C",
  },
  listContent: {
    paddingHorizontal: S.lg,
    paddingTop: S.xs,
    paddingBottom: 40,
  },
  centerBox: {
    padding: S.xxl,
    alignItems: "center",
  },
  loadingText: {
    marginTop: S.sm,
    color: "#8E877D",
    fontSize: 13,
  },
  noApptTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1714",
  },
  noApptSub: {
    fontSize: 13,
    color: "#8E877D",
    textAlign: "center",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#F7F5F0",
    alignItems: "center",
    justifyContent: "center",
    padding: S.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: S.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1714",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: "#8E877D",
    textAlign: "center",
    marginTop: 6,
    marginBottom: S.lg,
    lineHeight: 18,
  },
  signInBtn: {
    backgroundColor: "#121016",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  signInBtnText: {
    color: C.gold,
    fontSize: 14,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  salonName: {
    fontSize: 10,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1.2,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1714",
    marginTop: 3,
    letterSpacing: -0.3,
  },
  staffText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E877D",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.04)",
    marginVertical: S.md,
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaRow: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#44403C",
    fontWeight: "600",
  },
  detailPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1714",
  },
  cardActions: {
    marginTop: S.md,
    alignItems: "flex-end",
  },
  cardActionsRow: {
    marginTop: S.md,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  rescheduleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  rescheduleBtnText: {
    color: "#1A1714",
    fontSize: 12,
    fontWeight: "700",
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
  },
  cancelBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
  },
  toastBanner: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: "#1A1714",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#D97706",
  },
  toastTitle: {
    color: "#D97706",
    fontSize: 13,
    fontWeight: "800",
  },
  toastMessage: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  toastCloseBtn: {
    padding: 6,
    marginLeft: 8,
  },
});
