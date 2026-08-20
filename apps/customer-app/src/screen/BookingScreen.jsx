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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import SlotPicker from "../components/SlotPicker";
import StaffPicker from "../components/StaffPicker";
import ErrorCardModal from "../components/ErrorCardModal";
import ConflictModal from "../components/ConflictModal";
import { browseService } from "../services/browseService";
import { appointmentService } from "../services/appointmentService";
import { paiseToINR, toLocalDateStr } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";


export default function BookingScreen({ salon, branch, service, selectedServices, goBack, navigate }) {
  const { isAuthenticated } = useAuth();
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
        setSlots(Array.from(slotMap.values()));
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

  const styles = getStyles();

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
  const minScale = useRef(new Animated.Value(1)).current;
  const plusScale = useRef(new Animated.Value(1)).current;
  const countScale = useRef(new Animated.Value(1)).current;

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

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={C.ink} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {salon?.name || "Siargao Luxury Resort"}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {branch?.address?.city || branch?.name || "Siargao Island, Philippines"}
          </Text>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Services Section */}
        {allServices.length > 0 && (
          <View style={styles.servicesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>SELECTED SERVICES</Text>
              <Text style={styles.sectionHint}>
                {allServices.length} {allServices.length === 1 ? "SERVICE" : "SERVICES"} ({totalDurationMinutes} MINS)
              </Text>
            </View>

            <View style={styles.servicesCard}>
              {allServices.map((svc, idx) => (
                <View
                  key={svc._id || svc.id || idx}
                  style={[
                    styles.serviceItemRow,
                    idx < allServices.length - 1 && styles.serviceItemDivider,
                  ]}
                >
                  <View style={styles.serviceIconCircle}>
                    <Ionicons name="cut-outline" size={16} color={C.main} />
                  </View>

                  <View style={styles.serviceItemInfo}>
                    <Text style={styles.serviceItemName} numberOfLines={1}>
                      {svc.name}
                    </Text>
                    <Text style={styles.serviceItemSub}>
                      {svc.category || "Service"} • {svc.durationMinutes || svc.duration || 30} mins
                    </Text>
                  </View>

                  <Text style={styles.serviceItemPrice}>
                    {paiseToINR(svc.price)}
                  </Text>
                </View>
              ))}
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

      <View style={styles.floatingBottomContainer}>
        <View style={styles.floatingBar}>
          <View style={styles.floatingPriceBlock}>
            <Text style={styles.floatingPriceLabel}>Total:</Text>
            <Text style={styles.floatingPriceAmount}>{paiseToINR(rawTotalPrice)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.bookBtnTouchable, (!selectedSlot || submitting) && styles.bookNowBtnDisabled]}
            onPress={handleConfirmBooking}
            disabled={!selectedSlot || submitting}
            activeOpacity={0.85}
          >
            <View style={styles.bookMainBtn}>
              {submitting ? (
                <ActivityIndicator color={C.bg} size="small" />
              ) : (
                <Text style={styles.bookMainBtnText}>Confirm booking</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function getStyles() {
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
      fontSize: FS.body,
      fontWeight: FW.semiBold,
      color: C.ink,
    },
    headerSub: {
      fontSize: FS.caption,
      color: C.muted,
    },
    contentContainer: {
      paddingHorizontal: S.md,
      paddingTop: S.md,
      paddingBottom: 110,
    },
    servicesSection: {
      marginBottom: S.sm + 2,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: S.xs,
    },
    sectionHeading: {
      ...TYPO.eyebrow,
    },
    sectionHint: {
      fontSize: 9,
      fontWeight: "600",
      letterSpacing: 0.9,
      color: C.dustTaupe,
    },
    servicesCard: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: S.md,
      paddingVertical: S.xs / 2,
    },
    serviceItemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: S.sm,
      gap: S.sm,
    },
    serviceItemDivider: {
      borderBottomWidth: 1,
      borderBottomColor: C.borderLight,
    },
    serviceIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.thinking,
      alignItems: "center",
      justifyContent: "center",
    },
    serviceItemInfo: {
      flex: 1,
    },
    serviceItemName: {
      fontSize: FS.bodySm,
      fontWeight: FW.bold,
      color: C.ink,
      marginBottom: 2,
    },
    serviceItemSub: {
      fontSize: 11,
      color: C.muted,
    },
    serviceItemPrice: {
      fontSize: FS.bodySm,
      fontWeight: FW.bold,
      color: C.ink,
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
      backgroundColor: C.surface,
      borderRadius: R.md,
      paddingHorizontal: S.md,
      paddingVertical: S.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: S.md,
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
      fontWeight: FW.semiBold,
      color: C.ink,
    },
    stepperContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.surface,
      borderRadius: R.pill,
      padding: 2,
      borderWidth: 1,
      borderColor: C.border,
      gap: 1,
    },
    stepperBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperBtnAdd: {
      backgroundColor: C.ink,
    },
    stepperValueWrap: {
      minWidth: 28,
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
      color: C.main,
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
      bottom: 20,
      left: S.md,
      right: S.md,
      zIndex: 999,
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
