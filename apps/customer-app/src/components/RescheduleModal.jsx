// src/components/RescheduleModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SlotPicker from "./SlotPicker";
import { browseService } from "../services/browseService";
import { C, S } from "../theme";

export default function RescheduleModal({ visible, onClose, onConfirm, booking }) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const branchId =
    booking?.branch?._id ||
    booking?.branch?.id ||
    (typeof booking?.branchId === "object" ? booking?.branchId?._id : booking?.branchId);

  const serviceId =
    booking?.service?._id ||
    booking?.service?.id ||
    (typeof booking?.serviceId === "object" ? booking?.serviceId?._id : booking?.serviceId);

  const staffId =
    booking?.staff?._id ||
    booking?.staff?.id ||
    (typeof booking?.staffId === "object" ? booking?.staffId?._id : booking?.staffId);

  useEffect(() => {
    if (!visible || !branchId) return;

    let cancelled = false;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setErrorMessage(null);
      try {
        const res = await browseService.getBranchSlots(
          branchId,
          selectedDate,
          staffId,
          serviceId
        );
        if (cancelled) return;

        const raw =
          res.data?.availability ||
          res.data?.slots ||
          (Array.isArray(res.data) ? res.data : []);

        const flatSlots = Array.isArray(raw)
          ? raw.reduce((acc, item) => {
              if (item.slots && Array.isArray(item.slots)) {
                item.slots.forEach((s) => {
                  acc.push({
                    _id: s.slotId,
                    id: s.slotId,
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
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      cancelled = true;
    };
  }, [visible, branchId, selectedDate, staffId, serviceId]);

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const apptId = booking._id || booking.id;
      const newSlotId = selectedSlot._id || selectedSlot.id || selectedSlot.slotId;
      if (onConfirm) {
        await onConfirm(apptId, newSlotId);
      }
      onClose();
    } catch (e) {
      setErrorMessage(e.message || "Failed to reschedule appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>RESCHEDULE APPOINTMENT</Text>
              <Text style={styles.subtitle}>
                {booking?.service?.name || booking?.serviceName || "Salon Visit"} •{" "}
                {booking?.salon?.name || booking?.salonName || "Salon"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#1A1714" />
            </TouchableOpacity>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {loadingSlots ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator color="#1A1714" size="small" />
              <Text style={styles.loaderText}>Loading available slots...</Text>
            </View>
          ) : (
            <SlotPicker
              slots={slots}
              selectedSlotId={selectedSlot?._id || selectedSlot?.id}
              onSelectSlot={setSelectedSlot}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (!selectedSlot || submitting || loadingSlots) && styles.disabledBtn,
            ]}
            onPress={handleReschedule}
            disabled={!selectedSlot || submitting || loadingSlots}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm New Time Slot</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: S.lg,
    paddingBottom: 36,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: S.sm,
  },
  title: {
    fontSize: 11,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1.1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1714",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderBox: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loaderText: {
    fontSize: 12,
    color: "#8E8880",
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  confirmBtn: {
    backgroundColor: "#1A1714",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: S.md,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
