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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { appointmentService } from "../services/appointmentService";
import { paiseToINR } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { socketClient } from "../services/socketClient";
import { notificationService } from "../services/notificationService";
import ErrorCardModal from "../components/ErrorCardModal";
import AppointmentDetailModal from "../components/AppointmentDetailModal";
import RescheduleModal from "../components/RescheduleModal";
import CancelBookingModal from "../components/CancelBookingModal";
import AddReviewModal from "../components/AddReviewModal";

const TABS = ["Upcoming", "Pass"];

function formatHeaderDateTime(dateStr, timeStr) {
  if (!dateStr) return "Upcoming Visit";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const month = months[d.getMonth()] || "";
    const year = d.getFullYear();
    const formattedTime = timeStr ? timeStr.slice(0, 5) : "";
    return `${day} ${month} ${year}${formattedTime ? `, ${formattedTime}` : ""}`;
  } catch (e) {
    return dateStr;
  }
}

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
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [cancelApptModal, setCancelApptModal] = useState(null);
  const [reviewModalAppt, setReviewModalAppt] = useState(null);
  const [statusToast, setStatusToast] = useState(null);
  const [reminders, setReminders] = useState({ default: true });

  const promptedReviewIdsRef = React.useRef(new Set());
  const selectedApptRef = React.useRef(selectedAppt);
  selectedApptRef.current = selectedAppt;
  const styles = getStyles(theme, isDark);

  const toggleReminder = (id) => {
    setReminders((prev) => ({ ...prev, [id]: prev[id] === undefined ? true : !prev[id] }));
  };

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
    if (activeTab === "Upcoming") return status === "PENDING" || status === "CONFIRMED" || status === "IN_PROGRESS";
    if (activeTab === "Pass") return status === "COMPLETED" || status === "CANCELLED" || status === "NO_SHOW";
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
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Your Appointments</Text>
          <View style={styles.headerIconGroup}>
            <TouchableOpacity style={styles.headerSquareBtn} activeOpacity={0.7}>
              <Ionicons name="map-outline" size={17} color={isDark ? "#FFFFFF" : "#18181B"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerSquareBtn} activeOpacity={0.7}>
              <Ionicons name="swap-horizontal-outline" size={17} color={isDark ? "#FFFFFF" : "#18181B"} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.segmentedTabContainer}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentedTabBtn, isSelected && styles.segmentedTabBtnActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.88}
              >
                <Text style={[styles.segmentedTabText, isSelected && styles.segmentedTabTextActive]}>
                  {tab}
                </Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchAppointments(false)} tintColor="#635BFF" />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color="#635BFF" />
            <Text style={styles.loadingText}>Loading appointments…</Text>
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} appointments</Text>
            <Text style={styles.emptySub}>When you book a service, your visit details will appear here.</Text>
          </View>
        ) : (
          filteredAppointments.map((appt) => {
            const apptId = appt._id || appt.id;
            const salonName =
              appt.salon?.name ||
              (typeof appt.salonId === "object" ? appt.salonId?.name : null) ||
              (typeof appt.branchId === "object" ? appt.branchId?.name : null) ||
              "Bella Rinova";

            const addressText =
              appt.branch?.address?.city ||
              (typeof appt.branchId === "object" ? appt.branchId?.address?.street || appt.branchId?.name : null) ||
              appt.salon?.address ||
              "6391 Elgin St. Celina, Delaware";

            const serviceName =
              appt.service?.name ||
              (typeof appt.serviceId === "object" ? appt.serviceId?.name : null) ||
              "Regular haircut, Classic shaving";

            const coverImage =
              appt.salon?.coverImage ||
              appt.salon?.logo ||
              "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80";

            const rawDate = appt.date || (typeof appt.slotId === "object" ? appt.slotId?.date : null);
            const rawTime = appt.startTime || (typeof appt.slotId === "object" ? appt.slotId?.startTime : null);
            const headerDateStr = formatHeaderDateTime(rawDate, rawTime);

            const status = (appt.status || "PENDING").toUpperCase();
            const isPending = status === "PENDING";
            const isConfirmed = status === "CONFIRMED";
            const isCompleted = status === "COMPLETED";

            const isRemindOn = reminders[apptId] !== false;

            return (
              <TouchableOpacity
                key={apptId}
                style={styles.card}
                onPress={() => setSelectedAppt(appt)}
                activeOpacity={0.92}
              >
                {/* Date & Time Header */}
                <Text style={styles.cardDateHeader}>{headerDateStr}</Text>

                {/* Card Body */}
                <View style={styles.cardBodyRow}>
                  <Image
                    source={{ uri: coverImage }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.cardContentBox}>
                    <Text style={styles.salonTitleText} numberOfLines={1}>{salonName}</Text>
                    <Text style={styles.addressText} numberOfLines={1}>{addressText}</Text>
                    <Text style={styles.servicesLabelText} numberOfLines={2}>
                      <Text style={{ fontWeight: "700" }}>Services: </Text>{serviceName}
                    </Text>
                  </View>
                </View>

                {/* Bottom Footer Actions */}
                <View style={styles.cardFooterRow}>
                  {isPending || isConfirmed ? (
                    <TouchableOpacity
                      style={styles.rescheduleOutlineBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setRescheduleAppt(appt);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="calendar-outline" size={13} color={isDark ? "#A0A09C" : "#555555"} style={{ marginRight: 4 }} />
                      <Text style={styles.rescheduleOutlineBtnText}>Reschedule</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.statusPillBadge}>
                      <Text style={styles.statusPillBadgeText}>{status}</Text>
                    </View>
                  )}

                  {isPending || isConfirmed ? (
                    <TouchableOpacity
                      style={styles.cancelOutlineBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setCancelApptModal(appt);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelOutlineBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  ) : isCompleted ? (
                    <TouchableOpacity
                      style={styles.cancelOutlineBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setReviewModalAppt(appt);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelOutlineBtnText}>
                        {appt.rating?.score ? "Rated ✦" : "Review"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
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
      return { backgroundColor: "rgba(16, 185, 129, 0.12)", borderColor: "rgba(16, 185, 129, 0.3)", borderWidth: 1 };
    case "PENDING":
      return { backgroundColor: "rgba(212, 155, 69, 0.12)", borderColor: "rgba(212, 155, 69, 0.3)", borderWidth: 1 };
    case "IN_PROGRESS":
      return { backgroundColor: "rgba(99, 102, 241, 0.12)", borderColor: "rgba(99, 102, 241, 0.3)", borderWidth: 1 };
    case "COMPLETED":
      return { backgroundColor: "rgba(168, 85, 247, 0.12)", borderColor: "rgba(168, 85, 247, 0.3)", borderWidth: 1 };
    case "CANCELLED":
    case "NO_SHOW":
      return { backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.3)", borderWidth: 1 };
    default:
      return { backgroundColor: "rgba(148, 163, 184, 0.12)", borderColor: "rgba(148, 163, 184, 0.3)", borderWidth: 1 };
  }
}

function getStatusTextStyle(status) {
  switch ((status || "").toUpperCase()) {
    case "CONFIRMED":
      return { color: "#10B981", fontWeight: "700" };
    case "PENDING":
      return { color: "#D49B45", fontWeight: "700" };
    case "IN_PROGRESS":
      return { color: "#6366F1", fontWeight: "700" };
    case "COMPLETED":
      return { color: "#A855F7", fontWeight: "700" };
    case "CANCELLED":
    case "NO_SHOW":
      return { color: "#EF4444", fontWeight: "700" };
    default:
      return { color: "#94A3B8", fontWeight: "700" };
  }
}

function getStyles(theme = {}, isDark = false) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0A0A0C" : "#FAFAFC",
    },
    header: {
      backgroundColor: isDark ? "#0A0A0C" : "#FAFAFC",
      paddingTop: 54,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#18181B",
      letterSpacing: -0.4,
    },
    headerIconGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerSquareBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "#2C2C2E" : "#EBECEF",
      alignItems: "center",
      justifyContent: "center",
    },
    segmentedTabContainer: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1C1C1E" : "#F4F4F6",
      borderRadius: 18,
      padding: 4,
      width: "100%",
    },
    segmentedTabBtn: {
      flex: 1,
      paddingVertical: 11,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
    },
    segmentedTabBtnActive: {
      backgroundColor: isDark ? "#2C2C2E" : "#161622",
    },
    segmentedTabText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#A0A09C" : "#71717A",
    },
    segmentedTabTextActive: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 100,
    },
    centerBox: {
      padding: 40,
      alignItems: "center",
    },
    loadingText: {
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#A0A09C" : "#71717A",
      marginTop: 8,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      textAlign: "center",
    },
    emptySub: {
      fontSize: 13,
      color: isDark ? "#A0A09C" : "#71717A",
      textAlign: "center",
      marginTop: 4,
      lineHeight: 18,
    },
    emptyContainer: {
      flex: 1,
      backgroundColor: isDark ? "#0A0A0C" : "#FAFAFC",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    emptyIcon: {
      fontSize: 40,
      marginBottom: 12,
    },
    signInBtnGradient: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#635BFF",
    },
    signInBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    card: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 24,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? "#2C2C2E" : "#F0F0F4",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.04,
      shadowRadius: 12,
      elevation: 2,
    },
    cardDateHeader: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      marginBottom: 14,
      letterSpacing: -0.2,
    },
    cardBodyRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    cardImage: {
      width: 70,
      height: 70,
      borderRadius: 18,
      backgroundColor: isDark ? "#2C2C2E" : "#F0F0F4",
    },
    cardContentBox: {
      flex: 1,
      marginLeft: 14,
      justifyContent: "center",
    },
    salonTitleText: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      marginBottom: 3,
      letterSpacing: -0.2,
    },
    addressText: {
      fontSize: 12,
      fontWeight: "400",
      color: isDark ? "#A0A09C" : "#8E8E93",
      marginBottom: 6,
    },
    servicesLabelText: {
      fontSize: 12.5,
      fontWeight: "600",
      color: "#635BFF",
      lineHeight: 17,
    },
    cardFooterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#2A2A2D" : "#F4F4F6",
    },
    reminderToggleGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    switchTrack: {
      width: 44,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? "#3A3A3C" : "#E4E4E8",
      padding: 2,
      justifyContent: "center",
    },
    switchTrackActive: {
      backgroundColor: "#635BFF",
    },
    switchThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    switchThumbActive: {
      alignSelf: "flex-end",
    },
    reminderText: {
      fontSize: 12.5,
      fontWeight: "600",
      color: isDark ? "#D1D1D6" : "#48484A",
    },
    rescheduleOutlineBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#3A3A3C" : "#E0E0E6",
      backgroundColor: isDark ? "#2C2C2E" : "#F8F8FA",
    },
    rescheduleOutlineBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#E5E5EA" : "#333333",
    },
    cancelOutlineBtn: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#3A3A3C" : "#E0E0E6",
      backgroundColor: isDark ? "#2C2C2E" : "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    cancelOutlineBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#E5E5EA" : "#333333",
    },
    statusPillBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor: isDark ? "#2C2C2E" : "#F4F4F6",
    },
    statusPillBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: isDark ? "#A0A09C" : "#71717A",
    },
    toastBanner: {
      position: "absolute",
      top: 48,
      left: 16,
      right: 16,
      zIndex: 9999,
      backgroundColor: "#18181B",
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#635BFF",
    },
    toastTitle: {
      color: "#635BFF",
      fontSize: 13,
      fontWeight: "700",
    },
    toastMessage: {
      color: "#FFFFFF",
      fontSize: 12,
      marginTop: 2,
    },
    toastCloseBtn: {
      padding: 4,
      marginLeft: 8,
    },
  });
}
