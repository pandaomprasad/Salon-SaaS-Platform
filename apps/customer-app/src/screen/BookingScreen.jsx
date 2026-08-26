import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Animated,
  StatusBar,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, S, FS, FW, R, TYPO } from "../theme";
import SlotPicker from "../components/SlotPicker";
import StaffPicker from "../components/StaffPicker";
import ErrorCardModal from "../components/ErrorCardModal";
import ConflictModal from "../components/ConflictModal";
import { browseService } from "../services/browseService";
import { appointmentService } from "../services/appointmentService";
import { paiseToINR, toLocalDateStr } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import VerifyEmailModal from "../components/VerifyEmailModal";
import SpringTouchable from "../components/SpringTouchable";

export default function BookingScreen({ salon, branch, service, selectedServices, goBack, navigate }) {
  const { isAuthenticated, user } = useAuth();
  const { isDark } = useTheme();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const topInset = Math.max(insets.top, isAndroid ? (StatusBar.currentHeight || 24) : 12) + 8;
  const bottomInset = isAndroid ? Math.max(insets.bottom, 36) + 12 : Math.max(insets.bottom, 16) + 8;
  const todayObj = new Date();
  const todayStr = toLocalDateStr(todayObj);

  const allServices = selectedServices && selectedServices.length > 0 ? selectedServices : (service ? [service] : []);
  const rawTotalPrice = allServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const totalDurationMinutes = allServices.reduce((sum, s) => sum + (s.durationMinutes || s.duration || 30), 0);
  const servicesSummaryText = allServices.map((s) => s.name).join(" + ");

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calendarMonth, setCalendarMonth] = useState(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1));
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [guestCount, setGuestCount] = useState(1);
  const [customerNotes, setCustomerNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [conflictData, setConflictData] = useState(null);

  const minScale = useRef(new Animated.Value(1)).current;
  const plusScale = useRef(new Animated.Value(1)).current;
  const countScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!branch) return;
    const fetchStaff = async () => {
      try {
        const branchId = branch._id || branch.id || branch;
        const res = await browseService.getBranchStaff(branchId);
        const data = res.data?.staff || (Array.isArray(res.data) ? res.data : []);
        setStaffList(data);
      } catch (err) {
        console.log("Error loading staff:", err.message);
      }
    };
    fetchStaff();
  }, [branch]);

  useEffect(() => {
    if (!branch) return;
    let cancelled = false;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setErrorMessage(null);
      try {
        const branchId = branch._id || branch.id || branch;
        const staffId = selectedStaff ? (selectedStaff.id || selectedStaff._id) : undefined;
        const sId = service ? (service._id || service.id) : undefined;
        const res = await browseService.getBranchSlots(branchId, selectedDate, staffId, sId);
        if (cancelled) return;
        const raw = res.data?.availability || res.data?.slots || (Array.isArray(res.data) ? res.data : []);
        const slotMap = new Map();
        if (Array.isArray(raw)) {
          raw.forEach((item) => {
            if (item.slots && Array.isArray(item.slots)) {
              item.slots.forEach((s) => {
                const timeKey = s.startTime;
                if (!timeKey) return;
                const newSlot = {
                  _id: s.slotId,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  staffName: item.staffName,
                  status: s.status || "AVAILABLE",
                };
                if (!slotMap.has(timeKey)) {
                  slotMap.set(timeKey, newSlot);
                } else {
                  const existing = slotMap.get(timeKey);
                  const existingAvailable = (existing.status || "").toUpperCase() === "AVAILABLE";
                  const newAvailable = (newSlot.status || "").toUpperCase() === "AVAILABLE";
                  if (!existingAvailable && newAvailable) {
                    slotMap.set(timeKey, newSlot);
                  }
                }
              });
            } else {
              const timeKey = item.startTime || item.time;
              if (timeKey && !slotMap.has(timeKey)) {
                slotMap.set(timeKey, item);
              }
            }
          });
        }

        // Filter out past & current hour slots if selectedDate is today
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const isToday = selectedDate === todayStr;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const filteredSlots = Array.from(slotMap.values()).filter((slot) => {
          if (!isToday) return true;
          const [h, m] = (slot.startTime || "").split(":").map(Number);
          if (isNaN(h)) return true;
          const slotMinutes = h * 60 + (m || 0);
          return slotMinutes > currentMinutes;
        });

        setSlots(filteredSlots);
      } catch (err) {
        console.log("Error loading slots:", err.message);
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };
    fetchSlots();
    return () => { cancelled = true; };
  }, [branch, selectedDate, selectedStaff]);

  const handleConfirmBooking = async () => {
    setErrorMessage(null);

    if (!selectedSlot) {
      setErrorMessage("Please select an available time slot before proceeding.");
      return;
    }

    if (!isAuthenticated) {
      if (navigate) {
        navigate("Login", {
          redirectTo: "Booking",
          redirectData: { salon, branch, service, selectedServices: allServices },
        });
      }
      return;
    }

    const isVerified = Boolean(user?.isEmailVerified || user?.email_verified);
    if (user && !isVerified) {
      setShowVerifyModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const slotId = selectedSlot._id || selectedSlot.id;
      const serviceId = service ? (service._id || service.id) : (allServices[0]?._id || allServices[0]?.id);
      const serviceIds = allServices.map((s) => s._id || s.id).filter(Boolean);

      await appointmentService.bookAppointment({
        slotId,
        serviceId,
        serviceIds,
        customerNotes,
        guests: guestCount,
      });

      setBookingSuccess(true);
    } catch (err) {
      if (
        err.conflictAppointment ||
        (err.message && err.message.toLowerCase().includes("already have an appointment"))
      ) {
        setConflictData(
          err.conflictAppointment || {
            salonName: salon?.name || "Salon Luxe",
            serviceName: service?.name || "Service",
            staffName: selectedStaff?.name || "Specialist",
            date: selectedDate,
            startTime: selectedSlot?.startTime || "Selected Time",
          }
        );
        setConflictModalVisible(true);
      } else {
        const msg = err.message || err.toString() || "Failed to book appointment";
        setErrorMessage(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const styles = getStyles(isDark);

  if (bookingSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconBox}>
            <Ionicons name="checkmark-circle" size={54} color={C.success} />
          </View>

          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSub}>
            Your appointment for {service?.name || "Service"} at {salon?.name || "Salon"} has been scheduled.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigate && navigate("Bookings")}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>View My Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigate && navigate("Home")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  const totalPrice = paiseToINR(service?.price || 49900);

  const maxGuests = 10;
  const isMin = guestCount <= 1;
  const isMax = guestCount >= maxGuests;

  const animatePress = (scaleVal) => {
    Animated.sequence([
      Animated.spring(scaleVal, { toValue: 0.85, tension: 300, friction: 10, useNativeDriver: true }),
      Animated.spring(scaleVal, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
  };

  const animateCount = () => {
    Animated.sequence([
      Animated.spring(countScale, { toValue: 1.3, tension: 300, friction: 8, useNativeDriver: true }),
      Animated.spring(countScale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
  };

  const handleMinus = () => {
    if (isMin) return;
    animatePress(minScale);
    animateCount();
    setGuestCount(Math.max(1, guestCount - 1));
  };

  const handlePlus = () => {
    if (isMax) return;
    animatePress(plusScale);
    animateCount();
    setGuestCount(Math.min(maxGuests, guestCount + 1));
  };

  return (
    <View style={styles.container}>
      <ErrorCardModal
        visible={!!errorMessage}
        title="Booking Notice"
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />

      <ConflictModal
        visible={conflictModalVisible}
        conflictData={conflictData}
        onClose={() => setConflictModalVisible(false)}
        onSelectSlot={(slot) => {
          setSelectedSlot(slot);
          setConflictModalVisible(false);
        }}
      />

      <View style={[styles.header, { paddingTop: topInset }]}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#1A1A24" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Book Appointment</Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomInset + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Salon Info Header Card matching reference screenshot */}
        <View style={styles.salonInfoCard}>
          <Image
            source={{
              uri:
                salon?.coverImage ||
                salon?.image ||
                branch?.coverImage ||
                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=300&auto=format&fit=crop",
            }}
            style={styles.salonCardImage}
          />

          <View style={styles.salonCardContent}>
            <Text style={styles.salonCardTitle} numberOfLines={1}>
              {salon?.name || branch?.name || "Bella Rinova Salon"}
            </Text>

            <Text style={styles.salonCardAddress} numberOfLines={1}>
              {branch?.address?.formattedAddress ||
                branch?.address?.street ||
                branch?.address?.city ||
                salon?.address ||
                "8502 Preston Rd. Inglewood"}
            </Text>

            <View style={styles.salonCardMetaRow}>
              <View style={styles.salonRatingBox}>
                {[1, 2, 3, 4].map((star) => (
                  <Ionicons key={star} name="star" size={13} color="#FFC107" />
                ))}
                <Ionicons name="star-half" size={13} color="#FFC107" />
              </View>

              <View style={styles.salonDistanceBox}>
                <Ionicons name="location-sharp" size={12} color="#8A8A9E" />
                <Text style={styles.salonDistanceText}>2.5 km</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Selected Services Section */}
        {allServices.length > 0 && (
          <View style={styles.servicesSection}>
            <Text style={styles.sectionHeadingTitle}>Services</Text>

            <View style={styles.servicesCard}>
              {allServices.map((svc, idx) => (
                <View
                  key={svc._id || svc.id || idx}
                  style={[
                    styles.serviceItemRow,
                    idx < allServices.length - 1 && styles.serviceItemDivider,
                  ]}
                >
                  <Image
                    source={{
                      uri:
                        svc.image ||
                        svc.photoUrl ||
                        (idx % 2 === 0
                          ? "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=150&auto=format&fit=crop"
                          : "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=150&auto=format&fit=crop"),
                    }}
                    style={styles.serviceItemThumb}
                  />

                  <View style={styles.serviceItemInfo}>
                    <Text style={styles.serviceItemName} numberOfLines={1}>
                      {svc.name}
                    </Text>
                    <Text style={styles.serviceItemSub}>
                      {svc.durationMinutes || svc.duration || 30} mins
                    </Text>
                  </View>

                  <Text style={styles.serviceItemPrice}>
                    {paiseToINR(svc.price)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Total Row under Services */}
            <View style={styles.servicesTotalRow}>
              <Text style={styles.servicesTotalLabel}>Total</Text>
              <Text style={styles.servicesTotalPrice}>{paiseToINR(rawTotalPrice)}</Text>
            </View>
          </View>
        )}

        <View style={styles.guestsCard}>
          <View style={styles.guestsInfo}>
            <Ionicons name="people-outline" size={16} color={C.muted} />
            <Text style={styles.guestsLabel}>Guests</Text>
          </View>

          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={[
                styles.stepperBtn,
                isMin && { backgroundColor: C.surface },
              ]}
              onPress={handleMinus}
              activeOpacity={0.7}
              disabled={isMin}
            >
              <Animated.View style={{ transform: [{ scale: minScale }] }}>
                <Ionicons
                  name="remove"
                  size={14}
                  color={isMin ? C.muted : C.ink}
                />
              </Animated.View>
            </TouchableOpacity>

            <Animated.View style={[styles.stepperValueWrap, { transform: [{ scale: countScale }] }]}>
              <Text style={styles.stepperValue}>{guestCount}</Text>
            </Animated.View>

            <TouchableOpacity
              style={[
                styles.stepperBtn,
                styles.stepperBtnAdd,
                isMax && { backgroundColor: C.border },
              ]}
              onPress={handlePlus}
              activeOpacity={0.7}
              disabled={isMax}
            >
              <Animated.View style={{ transform: [{ scale: plusScale }] }}>
                <Ionicons
                  name="add"
                  size={14}
                  color={isMax ? C.muted : C.bg}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        <StaffPicker
          staffList={staffList}
          selectedStaff={selectedStaff}
          onSelectStaff={setSelectedStaff}
        />

        {loadingSlots ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={C.main} />
            <Text style={styles.loadingText}>Fetching available time slots…</Text>
          </View>
        ) : (
          <SlotPicker
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}

        <View style={styles.notesSection}>
          <Text style={styles.notesHeading}>SPECIAL INSTRUCTIONS</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add preferences, allergies, or specific requests…"
            placeholderTextColor={C.dustTaupe}
            value={customerNotes}
            onChangeText={setCustomerNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <View style={[styles.floatingBottomContainer, { bottom: bottomInset }]}>
        <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={styles.backTextBtn}>
          <Text style={styles.backTextBtnText}>Back</Text>
        </TouchableOpacity>

        <SpringTouchable
          style={[styles.continueBtn, (!selectedSlot || submitting) && styles.continueBtnDisabled]}
          onPress={handleConfirmBooking}
          disabled={!selectedSlot || submitting}
          scaleTo={0.95}
          hapticType="medium"
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </View>
          )}
        </SpringTouchable>
      </View>

      <VerifyEmailModal
        visible={showVerifyModal}
        email={user?.email}
        onClose={() => setShowVerifyModal(false)}
        onVerified={() => setShowVerifyModal(false)}
      />
    </View>
  );
}

function getStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: Platform.OS === "android" ? 44 : 52,
      paddingHorizontal: S.md,
      paddingBottom: S.md,
      backgroundColor: C.bg,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: C.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    headerCenter: {
      alignItems: "center",
      flex: 1,
      paddingHorizontal: S.xs,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: "#1A1A24",
      letterSpacing: -0.3,
    },
    headerSub: {
      fontSize: FS.caption,
      color: C.muted,
    },
    contentContainer: {
      paddingHorizontal: S.md,
      paddingTop: S.md,
      paddingBottom: 160,
    },
    salonInfoCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      padding: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: "#EBECEF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    salonCardImage: {
      width: 76,
      height: 76,
      borderRadius: 16,
      backgroundColor: "#E2E8F0",
      marginRight: 14,
    },
    salonCardContent: {
      flex: 1,
      justifyContent: "center",
    },
    salonCardTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: "#1A1A24",
      letterSpacing: -0.3,
    },
    salonCardAddress: {
      fontSize: 12,
      color: "#8A8A9E",
      marginTop: 4,
      marginBottom: 6,
    },
    salonCardMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    salonRatingBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    salonDistanceBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    salonDistanceText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#8A8A9E",
    },
    servicesSection: {
      marginBottom: 20,
    },
    sectionHeadingTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#1A1A24",
      letterSpacing: -0.3,
      marginBottom: 12,
    },
    servicesCard: {
      // backgroundColor: "#ffffffff",
      borderRadius: 20,
      borderWidth: 0,
      borderColor: "#EBECEF",
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    serviceItemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    serviceItemDivider: {
      borderBottomWidth: 1,
      borderBottomColor: "#F4F5F8",
    },
    serviceItemThumb: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: "#E2E8F0",
      marginRight: 12,
    },
    serviceItemInfo: {
      flex: 1,
    },
    serviceItemName: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1A1A24",
    },
    serviceItemSub: {
      fontSize: 12,
      color: "#8A8A9E",
      marginTop: 2,
    },
    serviceItemPrice: {
      fontSize: 15,
      fontWeight: "700",
      color: C.purple || "#6C5CE7",
    },
    servicesTotalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 12,
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: "#EBECEF",
    },
    servicesTotalLabel: {
      fontSize: 16,
      fontWeight: "800",
      color: "#1A1A24",
    },
    servicesTotalPrice: {
      fontSize: 17,
      fontWeight: "800",
      color: C.purple || "#6C5CE7",
    },
    calendarCard: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.md,
      marginBottom: S.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    calendarHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: S.md,
    },
    monthTitle: {
      fontSize: FS.body,
      fontWeight: FW.semiBold,
      color: C.ink,
    },
    monthNavBtns: {
      flexDirection: "row",
      gap: S.xs,
    },
    monthNavArrow: {
      width: 32,
      height: 32,
      borderRadius: R.md,
      backgroundColor: C.bg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    daysOfWeekRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: S.xs,
    },
    dayOfWeekText: {
      width: "14.28%",
      textAlign: "center",
      fontSize: FS.caption,
      fontWeight: FW.medium,
      color: C.muted,
    },
    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCellEmpty: {
      width: "14.28%",
      height: 40,
    },
    dayCell: {
      width: "14.28%",
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
    },
    dayCellSelected: {
      backgroundColor: C.ink,
    },
    dayCellText: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
      color: C.ink,
    },
    dayCellTextPast: {
      color: C.borderDark,
      opacity: 0.4,
    },
    dayCellTextSelected: {
      color: C.bg,
      fontWeight: FW.bold,
    },
    guestsCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: C.surface,
      borderRadius: R.md,
      paddingHorizontal: S.md,
      paddingVertical: S.sm,
      marginBottom: S.sm,
      borderWidth: 1,
      borderColor: C.border,
    },
    guestsInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: S.xs,
    },
    guestsLabel: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
      color: C.ink,
    },
    stepperContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    stepperBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.heart,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    stepperBtnAdd: {
      backgroundColor: C.green,
      borderColor: C.green,
    },
    stepperValueWrap: {
      minWidth: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperValue: {
      fontSize: FS.bodySm,
      fontWeight: FW.bold,
      color: C.ink,
      fontVariant: ["tabular-nums"],
    },
    loadingBox: {
      padding: S.lg,
      alignItems: "center",
    },
    loadingText: {
      marginTop: S.xs,
      fontSize: FS.bodySm,
      color: C.muted,
    },
    notesSection: {
      marginTop: S.sm,
    },
    notesHeading: {
      ...TYPO.eyebrow,
      color: "#1A1A24",
      marginBottom: S.xxs,
    },
    notesInput: {
      backgroundColor: C.surface,
      borderRadius: R.md,
      padding: S.sm,
      fontSize: FS.bodySm,
      color: C.ink,
      borderWidth: 1,
      borderColor: C.border,
      minHeight: 70,
      textAlignVertical: "top",
    },
    floatingBottomContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: Platform.OS === "ios" ? 20 : 20,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#2A2A2C" : "#F0F1F5",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 10,
    },
    backTextBtn: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    backTextBtnText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#8A8A9E",
    },
    continueBtn: {
      height: 52,
      paddingHorizontal: 32,
      borderRadius: 26,
      backgroundColor: C.purple || "#6C5CE7",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: C.purple || "#6C5CE7",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    continueBtnDisabled: {
      opacity: 0.5,
    },
    continueBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    floatingBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: C.surface,
      borderRadius: 20,
      paddingLeft: S.md + 2,
      paddingRight: 8,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    floatingPriceBlock: {
      justifyContent: "center",
    },
    floatingPriceLabel: {
      fontSize: 11,
      color: C.muted,
      marginBottom: 1,
    },
    floatingPriceAmount: {
      fontSize: 17,
      fontWeight: "700",
      color: C.ink,
      letterSpacing: -0.3,
    },
    bookBtnTouchable: {
      borderRadius: 15,
      overflow: "hidden",
    },
    bookNowBtnDisabled: {
      opacity: 0.5,
    },
    bookMainBtn: {
      borderRadius: 15,
      paddingVertical: 14,
      paddingHorizontal: 26,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: C.ink,
      borderWidth: 1,
      borderColor: C.border,
    },
    bookMainBtnText: {
      color: C.bg,
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    successContainer: {
      flex: 1,
      backgroundColor: C.bg,
      justifyContent: "center",
      alignItems: "center",
      padding: S.xl,
    },
    successCard: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.xl,
      alignItems: "center",
      width: "100%",
      borderWidth: 1,
      borderColor: C.border,
    },
    successIconBox: {
      marginBottom: S.md,
    },
    successTitle: {
      fontSize: FS.titleLg,
      fontWeight: "400",
      color: C.ink,
      marginBottom: S.xs,
      letterSpacing: -0.32,
    },
    successSub: {
      fontSize: FS.bodySm,
      color: C.body,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: S.xl,
    },
    primaryBtn: {
      backgroundColor: C.main,
      width: "100%",
      paddingVertical: 12,
      borderRadius: R.md,
      alignItems: "center",
      marginBottom: S.xs,
    },
    primaryBtnText: {
      color: C.bg,
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
    secondaryBtn: {
      width: "100%",
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: R.md,
    },
    secondaryBtnText: {
      color: C.ink,
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
  });
}
