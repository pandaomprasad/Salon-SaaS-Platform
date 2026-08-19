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
import { C, S, FS, FW, R, TYPO } from "../theme";
import { appointmentService } from "../services/appointmentService";
import { paiseToINR } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { socketClient } from "../services/socketClient";
import { notificationService } from "../services/notificationService";
import ErrorCardModal from "../components/ErrorCardModal";
import AppointmentDetailModal from "../components/AppointmentDetailModal";
import RescheduleModal from "../components/RescheduleModal";
import CancelBookingModal from "../components/CancelBookingModal";
import AddReviewModal from "../components/AddReviewModal";

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
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [cancelApptModal, setCancelApptModal] = useState(null);
  const [reviewModalAppt, setReviewModalAppt] = useState(null);
  const [statusToast, setStatusToast] = useState(null);

  const promptedReviewIdsRef = React.useRef(new Set());
  const selectedApptRef = React.useRef(selectedAppt);
  selectedApptRef.current = selectedAppt;
  const styles = getStyles();

  const handleAddReviewSubmit = async ({ rating, comment }) => {
    if (!reviewModalAppt) return;
    const apptId = reviewModalAppt._id || reviewModalAppt.id;
    try {
      await appointmentService.rateAppointment(apptId, rating, comment);
      setAppointments((prev) =>
        prev.map((a) => {
          if ((a._id || a.id) === apptId) {
            return {
              ...a,
              rating: { score: rating, review: comment, ratedAt: new Date().toISOString() },
            };
          }
          return a;
        })
      );
      setStatusToast({
        title: "Review Submitted",
        message: "Thank you for reviewing your visit!",
      });
    } catch (err) {
      setError(err.message || "Failed to submit review");
    }
  };

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
              if (!newAppt.rating || !newAppt.rating.score) {
                promptedReviewIdsRef.current.add(newAppt._id || newAppt.id);
                setReviewModalAppt(newAppt);
              }
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
      if (selectedApptRef.current) {
        const updatedSelected = newApptList.find(
          (a) => (a._id || a.id) === (selectedApptRef.current._id || selectedApptRef.current.id)
        );
        if (updatedSelected) {
          setSelectedAppt(updatedSelected);
        }
      }

      // Auto-popup review modal for the last completed appointment
      const lastUnratedCompleted = newApptList
        .filter(
          (a) =>
            (a.status || "").toUpperCase() === "COMPLETED" &&
            (!a.rating || !a.rating.score) &&
            !promptedReviewIdsRef.current.has(a._id || a.id)
        )
        .sort((a, b) => new Date(b.updatedAt || b.appointmentDate || b.createdAt || 0) - new Date(a.updatedAt || a.appointmentDate || a.createdAt || 0))[0];

      if (lastUnratedCompleted) {
        promptedReviewIdsRef.current.add(lastUnratedCompleted._id || lastUnratedCompleted.id);
        setReviewModalAppt(lastUnratedCompleted);
      }
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

  // Real-Time Event-Driven WebSockets
  useEffect(() => {
    if (!isAuthenticated) return;
    const userId = user?._id || user?.id;
    if (userId) {
      socketClient.connect(userId);
    }

    const unsubscribeStatus = socketClient.onAppointmentStatusChanged(() => {
      fetchAppointments(true);
    });
    const unsubscribeUpdated = socketClient.onAppointmentUpdated(() => {
      fetchAppointments(true);
    });

    return () => {
      if (typeof unsubscribeStatus === "function") unsubscribeStatus();
      if (typeof unsubscribeUpdated === "function") unsubscribeUpdated();
    };
  }, [isAuthenticated, user]);

  const handleCancelSuccess = () => {
    setCancelApptModal(null);
    setStatusToast({
      type: "warning",
      title: "Appointment Cancelled",
      message: "Your appointment has been cancelled.",
    });
    fetchAppointments(true);
  };

  const handleRescheduleSuccess = async (updatedAppt) => {
    setRescheduleAppt(null);
    try {
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
          onPress={() => navigate && navigate("Login")}
          activeOpacity={0.88}
        >
          <View style={styles.signInBtnGradient}>
            <Text style={styles.signInBtnText}>Sign In Now</Text>
          </View>
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
        onReschedule={(appt) => {
          setSelectedAppt(null);
          setRescheduleAppt(appt);
        }}
        onCancel={(appt) => {
          setSelectedAppt(null);
          setCancelApptModal(appt);
        }}
      />

      {rescheduleAppt && (
        <RescheduleModal
          visible={!!rescheduleAppt}
          booking={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onConfirm={async (id, newSlotId) => {
            await appointmentService.rescheduleAppointment(id, newSlotId);
            handleRescheduleSuccess();
          }}
        />
      )}

      {cancelApptModal && (
        <CancelBookingModal
          visible={!!cancelApptModal}
          booking={cancelApptModal}
          onClose={() => setCancelApptModal(null)}
          onConfirm={async (id, reason) => {
            await appointmentService.cancelAppointment(id, reason);
            handleCancelSuccess();
          }}
        />
      )}

      <AddReviewModal
        visible={!!reviewModalAppt}
        onClose={() => setReviewModalAppt(null)}
        onSubmit={handleAddReviewSubmit}
        appointment={reviewModalAppt}
        onSuccess={() => {
          setReviewModalAppt(null);
          setStatusToast({
            type: "success",
            title: "🌟 Review Submitted!",
            message: "Thank you for rating your salon experience.",
          });
          fetchAppointments(true);
        }}
      />

      {statusToast ? (
        <View style={styles.toastBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toastTitle}>{statusToast.title}</Text>
            <Text style={styles.toastMessage}>{statusToast.message}</Text>
          </View>
          <TouchableOpacity style={styles.toastCloseBtn} onPress={() => setStatusToast(null)}>
            <Ionicons name="close" size={16} color={C.bg} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
        <Text style={styles.subtitle}>Track, reschedule or manage your salon visits</Text>

        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.85}
              >
                {isSelected ? (
                  <View style={styles.tabSelectedGradient}>
                    <Text style={styles.tabTextSelected}>{tab}</Text>
                  </View>
                ) : (
                  <View style={styles.tabUnselected}>
                    <Text style={styles.tabTextUnselected}>{tab}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchAppointments(false)} tintColor={C.main} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color={C.main} />
            <Text style={styles.loadingText}>Loading visits…</Text>
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} appointments</Text>
            <Text style={styles.emptySub}>When you book a service, your visit details will appear here.</Text>
          </View>
        ) : (
          filteredAppointments.map((appt) => {
            const salonName =
              appt.salon?.name ||
              (typeof appt.salonId === "object" ? appt.salonId?.name : null) ||
              (typeof appt.branchId === "object" ? appt.branchId?.name : null) ||
              "Salon Partner";

            const serviceName =
              appt.service?.name ||
              (typeof appt.serviceId === "object" ? appt.serviceId?.name : null) ||
              "Service";

            const staffName =
              appt.staff?.name ||
              (typeof appt.staffId === "object" ? appt.staffId?.name : null) ||
              "Any available stylist";

            const status = (appt.status || "PENDING").toUpperCase();
            const dateText = formatDate(appt.date || (typeof appt.slotId === "object" ? appt.slotId?.date : null));
            const timeText = formatTimeRange(
              appt.startTime || (typeof appt.slotId === "object" ? appt.slotId?.startTime : null),
              appt.endTime || (typeof appt.slotId === "object" ? appt.slotId?.endTime : null)
            );

            const isPending = status === "PENDING";
            const isConfirmed = status === "CONFIRMED";
            const isCompleted = status === "COMPLETED";

            return (
              <TouchableOpacity
                key={appt._id || appt.id}
                style={styles.card}
                onPress={() => setSelectedAppt(appt)}
                activeOpacity={0.88}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: S.xs }}>
                    <Text style={styles.salonName}>{salonName}</Text>
                    <Text style={styles.serviceName}>{serviceName}</Text>
                    <Text style={styles.staffText}>Stylist: {staffName}</Text>
                  </View>

                  <View style={[styles.statusBadge, getStatusStyle(status)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(status)]}>
                      {status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardDetails}>
                  <View style={styles.metaRow}>
                    <Text style={styles.detailText}>📅 {dateText}</Text>
                    <Text style={styles.detailText}>⏰ {timeText}</Text>
                  </View>

                  <Text style={styles.detailPrice}>{paiseToINR(appt.pricePaid ?? appt.totalAmount ?? appt.price ?? 0)}</Text>
                </View>

                {/* Actions for Active / Completed */}
                {isPending || isConfirmed ? (
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.passBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedAppt(appt);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="qr-code-outline" size={14} color={C.main} />
                      <Text style={styles.passBtnText}>View Pass &amp; QR</Text>
                    </TouchableOpacity>

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
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : isCompleted ? (
                  <View style={styles.cardActions}>
                    {appt.rating && appt.rating.score ? (
                      <View style={styles.ratedChip}>
                        <Ionicons name="star" size={12} color={C.main} />
                        <Text style={styles.ratedChipText}>
                          {appt.rating.score}/5 {appt.rating.review ? `· "${appt.rating.review}"` : ""}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.rateBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          setReviewModalAppt(appt);
                        }}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="star" size={13} color={C.bg} />
                        <Text style={styles.rateBtnText}>Rate Visit</Text>
                      </TouchableOpacity>
                    )}
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
  switch ((status || "").toUpperCase()) {
    case "CONFIRMED":
      return { backgroundColor: C.grep };
    case "PENDING":
      return { backgroundColor: C.thinking };
    case "IN_PROGRESS":
      return { backgroundColor: C.read };
    case "COMPLETED":
      return { backgroundColor: C.edit };
    case "CANCELLED":
    case "NO_SHOW":
      return { backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.error };
    default:
      return { backgroundColor: C.lifted };
  }
}

function getStatusTextStyle(status) {
  switch ((status || "").toUpperCase()) {
    case "CANCELLED":
    case "NO_SHOW":
      return { color: C.error };
    default:
      return { color: C.ink, fontWeight: FW.semiBold };
  }
}

function getStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      backgroundColor: C.bg,
      paddingTop: 54,
      paddingHorizontal: S.lg,
      paddingBottom: S.md,
    },
    title: {
      fontSize: 26,
      fontWeight: "400",
      color: C.ink,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      color: C.muted,
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
    tabSelectedGradient: {
      paddingHorizontal: S.md,
      paddingVertical: 6,
      borderRadius: R.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.ink,
    },
    tabUnselected: {
      paddingHorizontal: S.md,
      paddingVertical: 6,
      borderRadius: R.pill,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    tabTextSelected: {
      color: C.bg,
      fontSize: 12,
      fontWeight: "700",
    },
    tabTextUnselected: {
      color: C.muted,
      fontSize: 12,
      fontWeight: "700",
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
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
      color: C.ink,
    },
    contentContainer: {
      paddingHorizontal: S.md,
      paddingBottom: 110,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      backgroundColor: C.bg,
      alignItems: "center",
      justifyContent: "center",
      padding: S.xl,
    },
    emptyIcon: {
      fontSize: 40,
      marginBottom: S.sm,
    },
    emptyTitle: {
      fontSize: FS.title,
      fontWeight: "400",
      color: C.ink,
      textAlign: "center",
      letterSpacing: -0.32,
    },
    emptySub: {
      fontSize: FS.bodySm,
      color: C.body,
      textAlign: "center",
      marginTop: S.xs,
      marginBottom: S.lg,
      lineHeight: 20,
    },
    signInBtnGradient: {
      paddingHorizontal: S.xl,
      paddingVertical: 10,
      borderRadius: R.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.main,
    },
    signInBtnText: {
      color: C.bg,
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
    card: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.md,
      marginBottom: S.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    salonName: {
      ...TYPO.eyebrow,
      color: C.main,
    },
    serviceName: {
      fontSize: FS.titleSm,
      fontWeight: FW.semiBold,
      color: C.ink,
      marginTop: 2,
    },
    staffText: {
      fontSize: FS.bodySm,
      color: C.muted,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: R.pill,
    },
    statusText: {
      fontSize: 10,
      fontWeight: FW.semiBold,
      color: C.ink,
      letterSpacing: 0.88,
    },
    cardDivider: {
      height: 1,
      backgroundColor: C.borderLight,
      marginVertical: S.sm,
    },
    cardDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    metaRow: {
      gap: 2,
    },
    detailText: {
      fontSize: FS.bodySm,
      color: C.body,
    },
    detailPrice: {
      fontSize: FS.titleSm,
      fontWeight: FW.semiBold,
      color: C.ink,
    },
    cardActions: {
      marginTop: S.sm,
      alignItems: "flex-end",
    },
    cardActionsRow: {
      marginTop: S.sm,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: S.xs,
    },
    rescheduleBtn: {
      paddingHorizontal: S.md,
      paddingVertical: 6,
      borderRadius: R.md,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.borderDark,
    },
    rescheduleBtnText: {
      color: C.ink,
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
    cancelBtn: {
      paddingHorizontal: S.md,
      paddingVertical: 6,
      borderRadius: R.md,
      backgroundColor: C.errorBg,
      borderWidth: 1,
      borderColor: C.error,
    },
    cancelBtnText: {
      color: C.error,
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
    passBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: S.sm + 2,
      paddingVertical: 6,
      borderRadius: R.md,
      backgroundColor: C.infoBg,
      borderWidth: 1,
      borderColor: C.main,
    },
    passBtnText: {
      color: C.main,
      fontSize: FS.bodySm - 1,
      fontWeight: FW.bold,
    },
    rateBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: S.md,
      paddingVertical: 6,
      borderRadius: R.md,
      backgroundColor: C.main,
    },
    rateBtnText: {
      color: C.bg,
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
    ratedChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: S.sm,
      paddingVertical: 4,
      borderRadius: R.pill,
      backgroundColor: C.lifted,
      borderWidth: 1,
      borderColor: C.border,
    },
    ratedChipText: {
      color: C.ink,
      fontSize: FS.bodySm - 1,
      fontWeight: FW.medium,
    },
    toastBanner: {
      position: "absolute",
      top: 48,
      left: 16,
      right: 16,
      zIndex: 9999,
      backgroundColor: C.ink,
      borderRadius: R.md,
      paddingHorizontal: S.md,
      paddingVertical: S.sm,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: C.main,
    },
    toastTitle: {
      color: C.main,
      fontSize: FS.bodySm,
      fontWeight: FW.semiBold,
    },
    toastMessage: {
      color: C.bg,
      fontSize: FS.bodySm - 1,
      marginTop: 2,
    },
    toastCloseBtn: {
      padding: 4,
      marginLeft: S.xs,
    },
  });
}
