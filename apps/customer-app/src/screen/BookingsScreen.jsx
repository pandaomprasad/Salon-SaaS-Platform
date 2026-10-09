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
import { useLocationStore } from "../store/useLocationStore";
import ComingSoonLocation from "../components/ComingSoonLocation";
import LocationPickerModal from "../components/LocationPickerModal";

const TABS = ["Upcoming", "Past"];

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

export default function BookingsScreen({ navigate, onScroll, onBack }) {
  const { isAuthenticated, user } = useAuth();
  const { theme, isDark } = useTheme();
  const accentColor = C.purple || "#D91C5C";
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
      <View style={styles.guestScreenContainer}>
        {/* Header Bar */}
        <View style={styles.guestHeader}>
          <Text style={styles.guestHeaderTitle}>Bookings</Text>
          <View style={styles.guestBadgePill}>
            <Text style={styles.guestBadgeText}>GUEST</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.guestScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Double Ring Badge */}
          <View style={styles.guestHeroCircle}>
            <View style={styles.guestHeroInnerCircle}>
              <Ionicons name="calendar-sharp" size={34} color={accentColor} />
            </View>
          </View>

          <View style={styles.eyebrowContainer}>
            <Text style={styles.eyebrowText}>MY SALON VISITS</Text>
          </View>

          <Text style={styles.guestTitle}>Sign in to view appointments</Text>
          <Text style={styles.guestSub}>
            Track real-time visit status, reschedule slots effortlessly, and access your full booking history.
          </Text>

          {/* Feature Highlights Cards */}
          <View style={styles.guestFeatureGrid}>
            <View style={styles.guestFeatureCard}>
              <View style={styles.guestFeatureIconBox}>
                <Ionicons name="notifications-outline" size={18} color={accentColor} />
              </View>
              <View style={styles.guestFeatureTextCol}>
                <Text style={styles.guestFeatureCardTitle}>Real-time Updates</Text>
                <Text style={styles.guestFeatureCardSub}>Instant alerts on booking status</Text>
              </View>
            </View>

            <View style={styles.guestFeatureCard}>
              <View style={styles.guestFeatureIconBox}>
                <Ionicons name="time-outline" size={18} color={accentColor} />
              </View>
              <View style={styles.guestFeatureTextCol}>
                <Text style={styles.guestFeatureCardTitle}>Easy Rescheduling</Text>
                <Text style={styles.guestFeatureCardSub}>Modify your slot with one tap</Text>
              </View>
            </View>

            <View style={styles.guestFeatureCard}>
              <View style={styles.guestFeatureIconBox}>
                <Ionicons name="sparkles-outline" size={18} color={accentColor} />
              </View>
              <View style={styles.guestFeatureTextCol}>
                <Text style={styles.guestFeatureCardTitle}>Visit History &amp; Reviews</Text>
                <Text style={styles.guestFeatureCardSub}>Rate services &amp; rebook favorites</Text>
              </View>
            </View>
          </View>

          {/* Primary Sign In Button */}
          <TouchableOpacity
            style={styles.guestSignInBtn}
            onPress={() => navigate && navigate("Login")}
            activeOpacity={0.88}
          >
            <Ionicons name="log-in-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.guestSignInBtnText}>Sign In Now</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity
            style={styles.guestSignUpRow}
            onPress={() => navigate && navigate("Register")}
            activeOpacity={0.7}
          >
            <Text style={styles.guestSignUpMuted}>New to ST CUT? </Text>
            <Text style={styles.guestSignUpLink}>Create an account</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const upcomingCount = appointments.filter((app) => {
    const status = app.status?.toUpperCase() || "";
    return status === "PENDING" || status === "CONFIRMED" || status === "IN_PROGRESS";
  }).length;

  const filteredAppointments = appointments.filter((app) => {
    const status = app.status?.toUpperCase() || "";
    if (activeTab === "Upcoming") return status === "PENDING" || status === "CONFIRMED" || status === "IN_PROGRESS";
    if (activeTab === "Past") return status === "COMPLETED" || status === "CANCELLED" || status === "NO_SHOW";
    return true;
  });

  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const isCityEmpty = selectedCity && selectedCity.toLowerCase() !== "brahmapur";

  if (isCityEmpty) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.title}>Your Appointments</Text>
              <Text style={styles.subTitle}>Manage your upcoming and past bookings</Text>
            </View>
          </View>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}>
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={(c) => setSelectedCity(c)}
          />
        </ScrollView>
        <LocationPickerModal
          visible={locationModalVisible}
          selectedCity={selectedCity}
          onSelectCity={(city) => {
            setSelectedCity(city);
            setLocationModalVisible(false);
          }}
          onClose={() => setLocationModalVisible(false)}
        />
      </View>
    );
  }

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
          <View>
            <Text style={styles.title}>Your Appointments</Text>
            <Text style={styles.subTitle}>Manage your upcoming and past bookings</Text>
          </View>
          <View style={styles.headerIconGroup}>
            <TouchableOpacity style={styles.headerCircularBtn} activeOpacity={0.7}>
              <Ionicons name="map-outline" size={20} color="#18181B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCircularBtn} activeOpacity={0.7}>
              <Ionicons name="swap-vertical-outline" size={20} color="#18181B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.segmentedTabContainer}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            const tabText = tab === "Upcoming" ? `Upcoming (${upcomingCount})` : "Past";
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentedTabBtn, isSelected && styles.segmentedTabBtnActive]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setActiveTab(tab);
                }}
                activeOpacity={0.88}
              >
                <Text style={[styles.segmentedTabText, isSelected && styles.segmentedTabTextActive]}>
                  {tabText}
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
          <View>
            {filteredAppointments.map((appt) => {
              const apptId = appt._id || appt.id;
              const salonName =
                appt.salon?.name ||
                (typeof appt.salonId === "object" ? appt.salonId?.name : null) ||
                (typeof appt.branchId === "object" ? appt.branchId?.name : null) ||
                "Royal Cut Luxury Salon & Spa";

              const addressText =
                appt.branch?.address?.city ||
                (typeof appt.branchId === "object" ? appt.branchId?.address?.street || appt.branchId?.name : null) ||
                appt.salon?.address ||
                "Silk City Road, Near Old Bus Stand";

              const rawSvcs = Array.isArray(appt.services) && appt.services.length > 0
                ? appt.services
                : (typeof appt.serviceId === "object" && appt.serviceId ? [appt.serviceId] : []);

              const serviceName = rawSvcs.length > 0
                ? rawSvcs.map((s) => (typeof s === "object" ? s.name : s)).join(", ")
                : appt.service?.name || "Signature Haircut & Styling";
              
              const totalMins = appt.totalDurationMinutes || rawSvcs.reduce((sum, s) => sum + ((typeof s === "object" ? s.durationMinutes : null) || 30), 0) || 45;

              const coverImage =
                appt.salon?.coverImage ||
                appt.salon?.logo ||
                "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80";

              const rawDate = appt.date || (typeof appt.slotId === "object" ? appt.slotId?.date : null);
              const rawTime = appt.startTime || (typeof appt.slotId === "object" ? appt.slotId?.startTime : null);
              
              let formattedDate = rawDate;
              let timeStr = "10:00 AM";
              try {
                if (rawDate) {
                  const d = new Date(rawDate);
                  if (!isNaN(d.getTime())) {
                    formattedDate = `${d.getDate()} ${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
                  }
                }
                if (rawTime) {
                  const parts = rawTime.split(":");
                  let hours = parseInt(parts[0], 10);
                  const mins = parts[1] || "00";
                  const ampm = hours >= 12 ? "PM" : "AM";
                  hours = hours % 12 || 12;
                  timeStr = `${hours < 10 ? '0'+hours : hours}:${mins} ${ampm}`;
                }
              } catch(e) {}

              const status = (appt.status || "PENDING").toUpperCase();
              const isPending = status === "PENDING";
              const isConfirmed = status === "CONFIRMED";
              const isCompleted = status === "COMPLETED";

              return (
                <TouchableOpacity
                  key={apptId}
                  style={styles.card}
                  onPress={() => setSelectedAppt(appt)}
                  activeOpacity={0.92}
                >
                  <View style={styles.cardMain}>
                    <Image source={{ uri: coverImage }} style={styles.cardImg} resizeMode="cover" />
                    <View style={styles.cardDetails}>
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardDateTime}>
                          <Text style={styles.cardDateText}>{formattedDate || "23 September 2026"}</Text>
                          <View style={styles.timePill}>
                            <Text style={styles.timePillText}>{timeStr}</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                      </View>
                      
                      <Text style={styles.salonTitle} numberOfLines={1}>{salonName}</Text>
                      
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.locationText} numberOfLines={1}>{addressText}</Text>
                      </View>

                      <View style={styles.serviceRow}>
                        <View style={styles.serviceIconWrap}>
                          <Ionicons name="cut-outline" size={14} color="#762237" />
                        </View>
                        <View style={styles.serviceTextCol}>
                          <Text style={styles.serviceName} numberOfLines={1}>{serviceName}</Text>
                          <Text style={styles.serviceMeta}>{rawSvcs.length || 1} Service • {totalMins} mins (approx)</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardActions}>
                    {(isPending || isConfirmed) ? (
                      <>
                        <TouchableOpacity style={styles.actionBtnOutline} onPress={(e) => { e.stopPropagation(); setRescheduleAppt(appt); }}>
                          <Ionicons name="calendar-outline" size={16} color="#1F2937" style={{ marginRight: 6 }} />
                          <Text style={styles.actionBtnOutlineText}>Reschedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnDanger} onPress={(e) => { e.stopPropagation(); setCancelApptModal(appt); }}>
                          <Ionicons name="close-outline" size={18} color="#762237" style={{ marginRight: 4 }} />
                          <Text style={styles.actionBtnDangerText}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    ) : isCompleted ? (
                       <TouchableOpacity style={styles.actionBtnOutline} onPress={(e) => { e.stopPropagation(); setReviewModalAppt(appt); }} style={{ flex: 1 }}>
                         <Text style={styles.actionBtnOutlineText}>{appt.rating?.score ? "Rated ✦" : "Review"}</Text>
                       </TouchableOpacity>
                    ) : (
                       <View style={[styles.statusPillBadge, { flex: 1, alignItems: 'center', alignSelf: 'stretch' }]}>
                         <Text style={styles.statusPillBadgeText}>{status}</Text>
                       </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            

          </View>
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
  const accentColor = C.purple || "#D91C5C";

  return StyleSheet.create({
    guestScreenContainer: {
      flex: 1,
      backgroundColor: isDark ? "#0A0A0C" : "#FAFAFC",
    },
    guestHeader: {
      paddingTop: 54,
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#1C1C1E" : "#F0F0F5",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    guestHeaderTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#111827",
      letterSpacing: -0.5,
    },
    guestBadgePill: {
      backgroundColor: isDark ? "rgba(217, 28, 92, 0.15)" : "#FDF2F5",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "rgba(217, 28, 92, 0.3)" : "#FCE7EC",
    },
    guestBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: accentColor,
      letterSpacing: 0.6,
    },
    guestScrollContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 40,
    },
    guestHeroCircle: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: isDark ? "rgba(217, 28, 92, 0.12)" : "#FDF2F5",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(217, 28, 92, 0.25)" : "#FCE7EC",
    },
    guestHeroInnerCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: isDark ? "rgba(217, 28, 92, 0.2)" : "#FBE6EA",
      alignItems: "center",
      justifyContent: "center",
    },
    eyebrowContainer: {
      backgroundColor: isDark ? "rgba(217, 28, 92, 0.12)" : "#FDF2F5",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginBottom: 10,
    },
    eyebrowText: {
      fontSize: 10,
      fontWeight: "800",
      color: accentColor,
      letterSpacing: 1,
    },
    guestTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#111827",
      textAlign: "center",
      marginBottom: 8,
      letterSpacing: -0.4,
    },
    guestSub: {
      fontSize: 13.5,
      color: isDark ? "#9CA3AF" : "#6B7280",
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
      maxWidth: 320,
    },
    guestFeatureGrid: {
      width: "100%",
      gap: 10,
      marginBottom: 26,
    },
    guestFeatureCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: isDark ? "#2C2C2E" : "#F3F4F6",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.03,
      shadowRadius: 6,
      elevation: 1,
    },
    guestFeatureIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(217, 28, 92, 0.15)" : "#FDF2F5",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    guestFeatureTextCol: {
      flex: 1,
    },
    guestFeatureCardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#111827",
      marginBottom: 2,
    },
    guestFeatureCardSub: {
      fontSize: 12,
      fontWeight: "400",
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    guestSignInBtn: {
      width: "100%",
      height: 52,
      borderRadius: 26,
      backgroundColor: accentColor,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 4,
      marginBottom: 16,
    },
    guestSignInBtnText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    guestSignUpRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
    },
    guestSignUpMuted: {
      fontSize: 13.5,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    guestSignUpLink: {
      fontSize: 13.5,
      fontWeight: "700",
      color: accentColor,
    },
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
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDark ? "#1C1C1E" : "#F4F4F6",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#111827",
      letterSpacing: -0.5,
    },
    subTitle: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 2,
    },
    headerIconGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    headerCircularBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "#2C2C2E" : "#E5E7EB",
      alignItems: "center",
      justifyContent: "center",
    },
    segmentedTabContainer: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1C1C1E" : "#F3F4F6",
      borderRadius: 24,
      padding: 4,
      width: "100%",
    },
    segmentedTabBtn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
    },
    segmentedTabBtnActive: {
      backgroundColor: "#6F2A3B",
    },
    segmentedTabText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#A0A09C" : "#6B7280",
    },
    segmentedTabTextActive: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
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
    
    /* Card Styles */
    card: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? "#2C2C2E" : "#F3F4F6",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.03,
      shadowRadius: 8,
      elevation: 2,
    },
    cardMain: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    cardImg: {
      width: 80,
      height: 110,
      borderRadius: 12,
      backgroundColor: isDark ? "#2C2C2E" : "#F3F4F6",
    },
    cardDetails: {
      flex: 1,
      marginLeft: 14,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    cardDateTime: {
      flexDirection: "row",
      alignItems: "center",
    },
    cardDateText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#D1D5DB" : "#4B5563",
      marginRight: 8,
    },
    timePill: {
      backgroundColor: "#FDF3F4",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    timePillText: {
      color: "#6F2A3B",
      fontSize: 11,
      fontWeight: "700",
    },
    salonTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#111827",
      marginBottom: 4,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    locationText: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginLeft: 4,
      flex: 1,
    },
    serviceRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    serviceIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#FDF3F4",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    serviceTextCol: {
      flex: 1,
    },
    serviceName: {
      fontSize: 13,
      fontWeight: "600",
      color: "#6F2A3B",
    },
    serviceMeta: {
      fontSize: 11,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 2,
    },
    cardDivider: {
      height: 1,
      backgroundColor: isDark ? "#2C2C2E" : "#F3F4F6",
      marginVertical: 14,
      borderStyle: "dashed",
    },
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    actionBtnOutline: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#E5E7EB",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
    },
    actionBtnOutlineText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#1F2937",
    },
    actionBtnDanger: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FDF3F4",
      backgroundColor: "#FDF3F4",
    },
    actionBtnDangerText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#6F2A3B",
    },
    statusPillBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: isDark ? "#2C2C2E" : "#F3F4F6",
      justifyContent: "center",
    },
    statusPillBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "#A0A09C" : "#71717A",
      textAlign: "center",
    },
    
    /* Bottom Banner */
    bottomBanner: {
      backgroundColor: "#FDF3F4",
      borderRadius: 20,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      marginBottom: 30,
    },
    bannerIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    bannerIconHeart: {
      position: "absolute",
      bottom: 6,
      right: 6,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#6F2A3B",
      alignItems: "center",
      justifyContent: "center",
    },
    bannerTextCol: {
      flex: 1,
      paddingRight: 8,
    },
    bannerTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#111827",
      marginBottom: 4,
    },
    bannerSub: {
      fontSize: 13,
      color: "#6B7280",
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
