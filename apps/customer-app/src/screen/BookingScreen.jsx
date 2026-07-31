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
    fontWeight: "700",
    color: "#991B1B",
    lineHeight: 16,
  },
  errorCloseBtn: {
    padding: 4,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#D4AF37",
    letterSpacing: 1.2,
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1A1A1A",
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  summarySub: {
    fontSize: 12,
    color: "#77726A",
    marginTop: 4,
    fontWeight: "500",
  },

  // Loading
  loadingBox: {
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#8E8880",
    fontSize: 12,
    fontWeight: "500",
  },

  // Notes
  notesSection: {
    marginTop: 14,
  },
  notesHeading: {
    fontSize: 9,
    fontWeight: "800",
    color: "#8E8880",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    fontSize: 13,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    textAlignVertical: "top",
    minHeight: 80,
  },

  // Floating Action Capsule
  floatingActionCapsule: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  barInfo: {
    flex: 1,
    marginRight: 12,
  },
  barTotalLabel: {
    color: "#8E8880",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  barPrice: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 1,
  },
  confirmBtn: {
    backgroundColor: "#E6CA65",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 20,
  },
  confirmBtnDisabled: {
    backgroundColor: "rgba(230, 202, 101, 0.4)",
  },
  confirmBtnText: {
    color: "#1A1A1A",
    fontSize: 13,
    fontWeight: "900",
  },

  // Success Screen
  successContainer: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  successIconBox: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  successSub: {
    fontSize: 13,
    color: "#77726A",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: "#1A1A1A",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#77726A",
    fontSize: 13,
    fontWeight: "700",
  },
});
