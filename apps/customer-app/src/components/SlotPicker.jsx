import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { toLocalDateStr } from "../services/apiClient";
import AppleTouchable from "./AppleTouchable";

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).trim().split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(totalMins) {
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function SlotPicker({
  slots,
  selectedSlotId,
  selectedSlot,
  serviceDurationMinutes = 30,
  onSelectSlot,
  selectedDate,
  onSelectDate,
}) {
  const styles = getStyles();
  const currentSlotId = selectedSlotId || selectedSlot?._id || selectedSlot?.id || (typeof selectedSlot === "string" ? selectedSlot : null);

  const [timeTab, setTimeTab] = useState("Morning");

  const uniqueSlots = useMemo(() => {
    if (!slots || !Array.isArray(slots)) return [];
    const map = new Map();
    slots.forEach((s) => {
      const timeKey = s.startTime || s.time;
      if (!timeKey) return;
      if (!map.has(timeKey)) {
        map.set(timeKey, s);
      } else {
        const existing = map.get(timeKey);
        const existingStatus = (existing.status || "").toUpperCase();
        const newStatus = (s.status || "").toUpperCase();
        const existingAvailable = existingStatus === "AVAILABLE" || existingStatus === "" || existing.isAvailable !== false;
        const newAvailable = newStatus === "AVAILABLE" || newStatus === "" || s.isAvailable !== false;
        if (!existingAvailable && newAvailable) {
          map.set(timeKey, s);
        }
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => timeToMinutes(a.startTime || a.time) - timeToMinutes(b.startTime || b.time));
    return list;
  }, [slots]);

  const slotAvailabilityMap = useMemo(() => {
    const map = new Map();
    const duration = serviceDurationMinutes > 0 ? serviceDurationMinutes : 30;

    uniqueSlots.forEach((slot) => {
      const slotId = slot._id || slot.id;
      const startMins = timeToMinutes(slot.startTime || slot.time);
      const targetEndMins = startMins + duration;
      const targetEndTimeStr = minutesToTime(targetEndMins);

      const rawStatus = (slot.status || "").toUpperCase();
      const singleIsBooked =
        rawStatus === "BOOKED" ||
        rawStatus === "BLOCKED" ||
        rawStatus === "RESERVED" ||
        rawStatus === "UNAVAILABLE" ||
        (rawStatus !== "" && rawStatus !== "AVAILABLE") ||
        slot.isAvailable === false;

      if (singleIsBooked) {
        map.set(slotId, { isBooked: true, calculatedEndTime: slot.endTime });
        return;
      }

      const rangeSlots = uniqueSlots.filter((other) => {
        const otherMins = timeToMinutes(other.startTime || other.time);
        return otherMins >= startMins && otherMins < targetEndMins;
      });

      const allAvailable = rangeSlots.every((other) => {
        const st = (other.status || "").toUpperCase();
        return st === "AVAILABLE" || st === "" || other.isAvailable !== false;
      });

      let maxEndMins = 0;
      rangeSlots.forEach((other) => {
        const endStr = other.endTime;
        if (endStr) {
          const endMins = timeToMinutes(endStr);
          if (endMins > maxEndMins) maxEndMins = endMins;
        }
      });

      const coversDuration = rangeSlots.length > 0 && (
        maxEndMins >= targetEndMins ||
        (rangeSlots.length * 30 >= duration)
      );

      const isValid = allAvailable && coversDuration;

      map.set(slotId, {
        isBooked: !isValid,
        calculatedEndTime: targetEndTimeStr,
        consecutiveSlots: rangeSlots,
      });
    });

    return map;
  }, [uniqueSlots, serviceDurationMinutes]);

  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoStr = toLocalDateStr(d);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();
    return { isoStr, dayName, dayNum, dateObj: d };
  });

  const selectedDateObj = useMemo(() => {
    const d = new Date(selectedDate);
    return isNaN(d.valueOf()) ? new Date() : d;
  }, [selectedDate]);

  const currentMonthYear = selectedDateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const filteredSlots = uniqueSlots.filter(slot => {
    const slotMins = timeToMinutes(slot.startTime || slot.time);
    if (timeTab === "Morning") return slotMins < 12 * 60;
    if (timeTab === "Afternoon") return slotMins >= 12 * 60 && slotMins < 17 * 60;
    if (timeTab === "Evening") return slotMins >= 17 * 60;
    return false;
  });

  return (
    <View style={styles.container}>
      <View style={styles.dateHeaderRow}>
        <Text style={styles.sectionHeading}>Select Date</Text>
        <Text style={styles.monthYearText}>{currentMonthYear} &gt;</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateList}
        contentContainerStyle={styles.dateListContent}
      >
        {dates.map((d) => {
          const isSelected = selectedDate === d.isoStr;
          return (
            <AppleTouchable
              key={d.isoStr}
              style={[styles.dateCard, isSelected && styles.dateCardSelected]}
              onPress={() => onSelectDate(d.isoStr)}
              scaleTo={0.94}
              hapticType="selection"
            >
              <Text style={[styles.dateWeek, isSelected && styles.dateWeekSelected]}>
                {d.dayName}
              </Text>
              <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>
                {d.dayNum}
              </Text>
            </AppleTouchable>
          );
        })}
      </ScrollView>

      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionHeading}>Select Time</Text>
      </View>

      <View style={styles.timeTabs}>
        {["Morning", "Afternoon", "Evening"].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.timeTabBtn, timeTab === tab && styles.timeTabBtnActive]}
            onPress={() => setTimeTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.timeTabTxt, timeTab === tab && styles.timeTabTxtActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {(!filteredSlots || filteredSlots.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No available slots for {timeTab.toLowerCase()}.</Text>
        </View>
      ) : (
        <View style={styles.slotGrid}>
          {filteredSlots.map((slot) => {
            const slotId = slot._id || slot.id;
            const availability = slotAvailabilityMap.get(slotId);
            const isBooked = availability ? availability.isBooked : false;
            const displayEndTime = availability?.calculatedEndTime || slot.endTime;

            const isSelected =
              (currentSlotId && currentSlotId === slotId) ||
              (selectedSlot && selectedSlot.startTime && selectedSlot.startTime === slot.startTime);

            const handlePress = () => {
              if (isBooked) return;
              onSelectSlot({ ...slot, endTime: displayEndTime });
            };

            return (
              <AppleTouchable
                key={slotId}
                disabled={isBooked}
                style={[
                  styles.slotChip,
                  isBooked && styles.slotChipBooked,
                  isSelected && styles.slotChipSelected,
                ]}
                onPress={handlePress}
                scaleTo={isBooked ? 1 : 0.94}
                hapticType={isBooked ? "none" : "selection"}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.slotStart,
                    isBooked && styles.slotStartBooked,
                    isSelected && styles.slotStartSelected,
                  ]}
                >
                  {formatAMPM(slot.startTime || slot.time)}
                </Text>
              </AppleTouchable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function formatAMPM(timeStr) {
  if (!timeStr) return "";
  let [h, m] = String(timeStr).trim().split(":").map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; 
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getStyles() {
  return StyleSheet.create({
    container: {
      paddingBottom: 20,
    },
    dateHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionHeading: {
      fontSize: 16,
      fontWeight: "700",
      color: "#1A1A24",
    },
    monthYearText: {
      fontSize: 14,
      fontWeight: "500",
      color: "#666666",
    },
    dateList: {
      flexDirection: "row",
      flexGrow: 0,
    },
    dateListContent: {
      gap: 12,
      paddingVertical: 4,
    },
    dateCard: {
      width: 58,
      height: 70,
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#EBECEF",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    dateCardSelected: {
      backgroundColor: "#6F2A3B",
      borderColor: "#6F2A3B",
    },
    dateWeek: {
      fontSize: 13,
      color: "#8E8E93",
      fontWeight: "500",
    },
    dateWeekSelected: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    dateNum: {
      fontSize: 16,
      fontWeight: "600",
      color: "#1C1C1E",
    },
    dateNumSelected: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    timeTabs: {
      flexDirection: "row",
      backgroundColor: "#F6F7FA",
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
      marginTop: 12,
    },
    timeTabBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 8,
    },
    timeTabBtnActive: {
      backgroundColor: "#6F2A3B",
    },
    timeTabTxt: {
      fontSize: 14,
      fontWeight: "500",
      color: "#8A8A9E",
    },
    timeTabTxtActive: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    slotGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    slotChip: {
      width: "31.3%",
      height: 48,
      borderRadius: 8,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#EBECEF",
      alignItems: "center",
      justifyContent: "center",
    },
    slotChipSelected: {
      backgroundColor: "#FDF9FA",
      borderColor: "#6F2A3B",
    },
    slotChipBooked: {
      backgroundColor: "#F4F5F8",
      borderColor: "#E2E8F0",
      opacity: 0.5,
    },
    slotStart: {
      fontSize: 13,
      fontWeight: "600",
      color: "#1A1A24",
    },
    slotStartSelected: {
      color: "#6F2A3B",
    },
    slotStartBooked: {
      color: "#8A8A9E",
      textDecorationLine: "line-through",
    },
    emptyContainer: {
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      color: "#8A8A9E",
      fontSize: 14,
    },
  });
}