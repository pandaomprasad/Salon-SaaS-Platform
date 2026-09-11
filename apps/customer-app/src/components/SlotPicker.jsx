import React, { useMemo } from "react";
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

  // Deduplicate slots by unique start time so time slots do not repeat
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

  // Calculate slot availability & consecutive slot coverage for multi-hour services
  const slotAvailabilityMap = useMemo(() => {
    const map = new Map();
    const duration = serviceDurationMinutes > 0 ? serviceDurationMinutes : 30;

    uniqueSlots.forEach((slot) => {
      const slotId = slot._id || slot.id;
      const startMins = timeToMinutes(slot.startTime || slot.time);
      const targetEndMins = startMins + duration;
      const targetEndTimeStr = minutesToTime(targetEndMins);

      // Check single slot status first
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

      // Find all slots required to cover full service duration
      const rangeSlots = uniqueSlots.filter((other) => {
        const otherMins = timeToMinutes(other.startTime || other.time);
        return otherMins >= startMins && otherMins < targetEndMins;
      });

      // Are all slots in the duration range available?
      const allAvailable = rangeSlots.every((other) => {
        const st = (other.status || "").toUpperCase();
        return st === "AVAILABLE" || st === "" || other.isAvailable !== false;
      });

      // Check if slots cover up to targetEndMins
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

  // Generate next 7 dates
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoStr = toLocalDateStr(d);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" }); // e.g. "Thu", "Tue", "Mon"
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    return { isoStr, dayName, dayNum, monthName, isToday: i === 0 };
  });

  return (
    <View style={styles.container}>
      {/* Date Picker Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeading}>Select Date</Text>
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
              <Text
                style={[
                  styles.dateWeek,
                  isSelected && styles.dateWeekSelected,
                ]}
              >
                {d.dayName}
              </Text>
              <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>{d.dayNum}</Text>
            </AppleTouchable>
          );
        })}
      </ScrollView>

      {/* Time Slot Section */}
      <View style={[styles.sectionHeader, { marginTop: S.md }]}>
        <Text style={styles.sectionHeading}>SELECT AVAILABLE TIME</Text>
        {uniqueSlots && uniqueSlots.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>
              {uniqueSlots.filter((s) => {
                const st = (s.status || "").toUpperCase();
                return st === "AVAILABLE" || st === "" || s.isAvailable !== false;
              }).length} OPEN
            </Text>
          </View>
        )}
      </View>

      {(!uniqueSlots || uniqueSlots.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={20} color={C.muted} />
          <Text style={styles.emptyText}>No available slots found for this date.</Text>
        </View>
      ) : (
        <View style={styles.slotGrid}>
          {uniqueSlots.map((slot) => {
            const slotId = slot._id || slot.id;
            const availability = slotAvailabilityMap.get(slotId);
            const isBooked = availability ? availability.isBooked : false;
            const displayEndTime = availability?.calculatedEndTime || slot.endTime;

            const isSelected =
              (currentSlotId && currentSlotId === slotId) ||
              (selectedSlot && selectedSlot.startTime && selectedSlot.startTime === slot.startTime);

            const handlePress = () => {
              if (isBooked) return;
              const slotToSelect = {
                ...slot,
                endTime: displayEndTime,
              };
              onSelectSlot(slotToSelect);
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
                <View style={styles.slotChipBody}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.slotStart,
                      isBooked && styles.slotStartBooked,
                      isSelected && styles.slotStartSelected,
                    ]}
                  >
                    {slot.startTime || slot.time}
                  </Text>
                  {!isBooked && displayEndTime && (
                    <Text
                      numberOfLines={1}
                      style={[styles.slotEnd, isSelected && styles.slotEndSelected]}
                    >
                      {displayEndTime}
                    </Text>
                  )}
                  {isBooked && (
                    <View style={styles.slotBookedRow}>
                      <Ionicons name="lock-closed" size={9} color={C.muted} />
                      <Text style={styles.slotEndBooked}>Unavailable</Text>
                    </View>
                  )}
                </View>
              </AppleTouchable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    container: {
      marginVertical: S.xs,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: S.xs,
    },
    sectionHeading: {
      fontSize: 16,
      fontWeight: "800",
      color: "#1A1A24",
      letterSpacing: -0.3,
    },
    monthSelectorBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    monthSelectorText: {
      fontSize: 13,
      fontWeight: "600",
      color: C.purple || "#6C5CE7",
    },
    sectionHint: {
      fontSize: 9,
      fontWeight: "600",
      letterSpacing: 0.9,
      color: C.dustTaupe,
    },
    countPill: {
      backgroundColor: C.bone,
      borderRadius: R.pill,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    countPillText: {
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 0.7,
      color: C.ink,
    },

    // --- Date picker row: cards spread evenly across the full width
    // (space-between), no border in the resting state, only the
    // selected card gets a tall rounded outline. Matches the reference.
    dateList: {
      flexDirection: "row",
      flexGrow: 0,
    },
    dateListContent: {
      paddingVertical: 6,
      paddingHorizontal: 2,
      justifyContent: "space-between",
      flexGrow: 1,
    },
    dateCard: {
      width: 44,
      height: 60,
      borderRadius: 20,
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    },
    dateCardSelected: {
      backgroundColor: "transparent",
      borderColor: C.purple || "#6C5CE7",
    },
    dateWeek: {
      fontSize: 12,
      color: "#8E8E93",
      fontWeight: "600",
    },
    dateWeekSelected: {
      color: C.purple || "#6C5CE7",
      fontWeight: "700",
    },
    dateNum: {
      fontSize: 17,
      fontWeight: "700",
      color: "#1C1C1E",
    },
    dateNumSelected: {
      color: C.purple || "#6C5CE7",
      fontWeight: "800",
    },
    dateMonth: {
      fontSize: 8,
      fontWeight: "600",
      letterSpacing: 0.7,
      color: C.dustTaupe,
      marginTop: 1,
    },
    dateMonthSelected: {
      color: C.bg,
    },

    emptyContainer: {
      padding: S.lg,
      backgroundColor: C.surface,
      borderRadius: R.lg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
      gap: 4,
    },
    emptyText: {
      color: C.body,
      fontSize: FS.bodySm,
    },
    slotGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 4,
    },
    slotChip: {
      width: "31%",
      height: 54,
      borderRadius: 16,
      backgroundColor: "#F6F7FA",
      borderWidth: 1.5,
      borderColor: "#EBECEF",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    slotChipSelected: {
      backgroundColor: "#F4F2FF",
      borderColor: C.purple || "#6C5CE7",
    },
    slotChipBooked: {
      backgroundColor: "#F4F5F8",
      borderColor: "#E2E8F0",
      opacity: 0.5,
    },
    slotChipBody: {
      alignItems: "center",
      justifyContent: "center",
    },
    slotStart: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1A1A24",
      letterSpacing: -0.2,
    },
    slotStartSelected: {
      color: C.purple || "#6C5CE7",
    },
    slotStartBooked: {
      color: "#8A8A9E",
      textDecorationLine: "line-through",
    },
    slotEnd: {
      fontSize: 11,
      color: "#8A8A9E",
      marginTop: 1,
      fontWeight: "500",
    },
    slotEndSelected: {
      color: C.purple || "#6C5CE7",
      fontWeight: "600",
    },
    slotBookedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: 1,
    },
    slotEndBooked: {
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.3,
      color: C.muted,
    },
  });
}