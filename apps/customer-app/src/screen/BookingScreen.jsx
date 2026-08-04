// src/screen/BookingScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import SlotPicker from "../components/SlotPicker";
import StaffPicker from "../components/StaffPicker";
import ErrorCardModal from "../components/ErrorCardModal";
import ConflictModal from "../components/ConflictModal";
import { browseService } from "../services/browseService";
import { appointmentService } from "../services/appointmentService";
import { paiseToINR } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import SlideToConfirm from "../components/SlideToConfirm";

export default function BookingScreen({ salon, branch, service, goBack, navigate }) {
  const { isAuthenticated } = useAuth();
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
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
        const flatSlots = Array.isArray(raw)
          ? raw.reduce((acc, item) => {
              if (item.slots && Array.isArray(item.slots)) {
                item.slots.forEach((s) => {
                  acc.push({
                    _id: s.slotId,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    staffName: item.staffName,
                    status: s.status || "AVAILABLE",
                  });
                });
              } else {
                acc.push(item);
              }
              return acc;
            }, [])
          : [];
        setSlots(flatSlots);
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
          redirectData: { salon, branch, service },
        });
      }
      return;
    }

    setSubmitting(true);
    try {
      const slotId = selectedSlot._id || selectedSlot.id;
      const serviceId = service._id || service.id;

      await appointmentService.bookAppointment({
        slotId,
        serviceId,
        customerNotes,
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

  if (bookingSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconBox}>
            <Ionicons name="checkmark-circle-sharp" size={54} color="#D4AF37" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSub}>
            Your appointment at {salon?.name || "the studio"} for {service?.name} has been successfully scheduled.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigate && navigate("Bookings")}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>View My Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigate && navigate("Home")} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Minimal Header */}
        <View style={styles.headerBlock}>
          <TouchableOpacity style={styles.backPill} onPress={goBack} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={16} color="#1A1A1A" />
            <Text style={styles.backPillText}>Change Service</Text>
          </TouchableOpacity>

          <Text style={styles.headerSubLabel}>APPOINTMENT SCHEDULE</Text>
          <Text style={styles.headerTitle}>Select Date & Time</Text>
        </View>

        {/* Popup Error Card */}
        <ErrorCardModal
          visible={!!errorMessage}
          title="Booking Error"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />

        {/* Minimal Service Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryLabel}>SELECTED SERVICE</Text>
            <Text style={styles.summaryPrice}>{paiseToINR(service?.price)}</Text>
          </View>
          <Text style={styles.summaryTitle}>{service?.name}</Text>
          <Text style={styles.summarySub}>
            📍 {branch?.name || salon?.name}  •  ⏱ {service?.duration || 30} mins
          </Text>
        </View>

        {/* Staff / Specialist Selector Component */}
        <StaffPicker
          staffList={staffList}
          selectedStaffId={selectedStaff?.id || selectedStaff?._id}
          onSelectStaff={(staff) => setSelectedStaff(staff)}
        />

        {/* Slot Picker Component */}
        {loadingSlots ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1A1A1A" />
            <Text style={styles.loadingText}>Fetching available time slots...</Text>
          </View>
        ) : (
          <SlotPicker
            slots={slots}
            selectedSlotId={selectedSlot?._id || selectedSlot?.id}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
          />
        )}

        {/* Notes Input */}
        <View style={styles.notesSection}>
          <Text style={styles.notesHeading}>SPECIAL INSTRUCTIONS (OPTIONAL)</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={3}
            placeholder="e.g. Sensitive scalp, preferred hair washing product..."
            placeholderTextColor="#8E8880"
            value={customerNotes}
            onChangeText={setCustomerNotes}
          />
        </View>
      </ScrollView>

      {/* Floating Bottom Slide to Confirm Slider */}
      <SlideToConfirm
        onConfirm={handleConfirmBooking}
        disabled={!selectedSlot}
        submitting={submitting}
        priceText={paiseToINR(service?.price)}
        label={isAuthenticated ? "Slide to Confirm" : "Slide to Sign In"}
        disabledLabel="Select Slot to Book"
      />

      {/* Time Slot Conflict Modal */}
      <ConflictModal
        visible={conflictModalVisible}
        conflictData={conflictData}
        onClose={() => setConflictModalVisible(false)}
        onViewAppointments={() => navigate && navigate("Bookings")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 130,
  },

  // Minimal Header Block
  headerBlock: {
    marginBottom: 20,
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    gap: 6,
    marginBottom: 16,
  },
  backPillText: {
    color: "#1A1A1A",
    fontSize: 12,
    fontWeight: "700",
  },
  headerSubLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#8E8880",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },

  // Error Banner UI
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.2)",
    gap: 10,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorHeader: {
    fontSize: 9,
    fontWeight: "900",
    color: "#DC2626",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  errorMessageText: {
    fontSize: 12,
    paddingBottom: 110,
    paddingHorizontal: S.md,
    paddingTop: 16,
  },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: S.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: R.md,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: S.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  screenTitle: {
    fontSize: FS.title,
    fontWeight: "400",
    color: C.ink,
    letterSpacing: -0.32,
  },
  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    padding: S.md,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: S.xs,
  },
  summaryCategory: {
    ...TYPO.eyebrow,
    color: C.main,
  },
  summaryPrice: {
    fontSize: FS.titleSm,
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  summaryTitle: {
    fontSize: FS.titleSm,
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  summarySub: {
    fontSize: FS.bodySm,
    color: C.body,
    marginTop: 2,
  },
  loadingBox: {
    padding: S.xl,
    alignItems: "center",
    gap: S.xs,
  },
  loadingText: {
    color: C.muted,
    fontSize: FS.bodySm,
  },
  notesSection: {
    marginTop: S.sm,
  },
  notesHeading: {
    ...TYPO.eyebrow,
    marginBottom: S.xs,
  },
  notesInput: {
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: S.sm + 2,
    fontSize: FS.bodySm,
    color: C.ink,
    borderWidth: 1,
    borderColor: C.border,
    textAlignVertical: "top",
    minHeight: 80,
  },
  floatingActionCapsule: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: C.ink,
    paddingHorizontal: S.md,
    paddingVertical: S.sm + 2,
    borderRadius: R.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: C.borderDark,
  },
  barInfo: {
    flex: 1,
    marginRight: S.sm,
  },
  barTotalLabel: {
    color: C.dustTaupe,
    fontSize: 10,
    fontWeight: FW.semiBold,
    letterSpacing: 0.88,
  },
  barPrice: {
    color: "#FFFFFF",
    fontSize: FS.title,
    fontWeight: FW.semiBold,
    marginTop: 1,
  },
  confirmBtn: {
    backgroundColor: C.main,
    paddingHorizontal: S.md,
    paddingVertical: 9,
    borderRadius: R.md,
  },
  confirmBtnDisabled: {
    backgroundColor: "rgba(245, 78, 0, 0.4)",
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
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
    color: "#FFFFFF",
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
