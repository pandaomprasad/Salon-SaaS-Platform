// src/components/SlotPicker.jsx
import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";

export default function SlotPicker({ slots, selectedSlotId, selectedSlot, onSelectSlot, selectedDate, onSelectDate }) {
  const currentSlotId = selectedSlotId || selectedSlot?._id || selectedSlot?.id || (typeof selectedSlot === "string" ? selectedSlot : null);

  // Generate next 7 dates
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return { isoStr, dayName, dayNum, monthName, isToday: i === 0 };
  });

  return (
    <View style={styles.container}>
      {/* Date Picker Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeading}>SELECT DATE</Text>
        <Text style={styles.sectionHint}>NEXT 7 DAYS</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateList}
        contentContainerStyle={styles.dateListContent}
        decelerationRate="fast"
        snapToInterval={70}
      >
        {dates.map((d) => {
          const isSelected = selectedDate === d.isoStr;
          return (
            <TouchableOpacity
              key={d.isoStr}
              style={[styles.dateCard, isSelected && styles.dateCardSelected]}
              onPress={() => onSelectDate(d.isoStr)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dateWeek,
                  isSelected && styles.dateWeekSelected,
                  d.isToday && (isSelected ? styles.todayDateWeekSelected : styles.todayDateWeek),
                ]}
              >
                {d.isToday ? "TODAY" : d.dayName}
              </Text>
              <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>{d.dayNum}</Text>
              <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>{d.monthName}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time Slot Section */}
      <View style={[styles.sectionHeader, { marginTop: S.md }]}>
        <Text style={styles.sectionHeading}>SELECT AVAILABLE TIME</Text>
        {slots && slots.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>
              {slots.filter((s) => {
                const st = (s.status || "").toUpperCase();
                return st === "AVAILABLE" || st === "" || s.isAvailable !== false;
              }).length} OPEN
            </Text>
          </View>
        )}
      </View>

      {(!slots || slots.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={20} color={C.muted} />
          <Text style={styles.emptyText}>No available slots found for this date.</Text>
        </View>
      ) : (
        <View style={styles.slotGrid}>
          {slots.map((slot) => {
            const rawStatus = (slot.status || "").toUpperCase();
            const isBooked =
              rawStatus === "BOOKED" ||
              rawStatus === "BLOCKED" ||
              rawStatus === "RESERVED" ||
              rawStatus === "UNAVAILABLE" ||
              (rawStatus !== "" && rawStatus !== "AVAILABLE") ||
              slot.isAvailable === false;

            const slotId = slot._id || slot.id;
            const isSelected =
              (currentSlotId && currentSlotId === slotId) ||
              (selectedSlot && selectedSlot.startTime && selectedSlot.startTime === slot.startTime);

            return (
              <TouchableOpacity
                key={slot._id || slot.id}
                disabled={isBooked}
                style={[
                  styles.slotChip,
                  isBooked && styles.slotChipBooked,
                  isSelected && styles.slotChipSelected,
                ]}
                onPress={() => !isBooked && onSelectSlot(slot)}
                activeOpacity={isBooked ? 1 : 0.7}
              >
                {isSelected && (
                  <View style={styles.slotCheck}>
                    <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                  </View>
                )}

                <View style={styles.slotChipBody}>
                  <Text
                    style={[
                      styles.slotStart,
                      isBooked && styles.slotStartBooked,
                      isSelected && styles.slotStartSelected,
                    ]}
                  >
                    {slot.startTime || slot.time}
                  </Text>
                  {!isBooked && slot.endTime && (
                    <Text style={[styles.slotEnd, isSelected && styles.slotEndSelected]}>
                      {slot.endTime}
                    </Text>
                  )}
                  {isBooked && (
                    <View style={styles.slotBookedRow}>
                      <Ionicons name="lock-closed" size={9} color={C.muted} />
                      <Text style={styles.slotEndBooked}>Booked</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    ...TYPO.eyebrow,
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
  dateList: {
    flexDirection: "row",
  },
  dateListContent: {
    paddingVertical: S.xxs,
    paddingHorizontal: 2,
  },
  dateCard: {
    width: 64,
    height: 80,
    borderRadius: R.lg,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCardSelected: {
    backgroundColor: C.ink,
    borderColor: C.ink,
  },
  todayPill: {
    position: "absolute",
    top: 5,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderDark,
    borderRadius: R.pill,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  todayPillSelected: {
    backgroundColor: C.ink,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  todayPillText: {
    fontSize: 6.5,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: C.muted,
  },
  todayPillTextSelected: {
    color: C.main,
  },
  dateWeek: {
    fontSize: 9,
    color: C.muted,
    fontWeight: "600",
    letterSpacing: 0.9,
  },
  dateWeekSelected: {
    color: "rgba(255, 255, 255, 0.65)",
  },
  todayDateWeek: {
    color: C.main || "#c08532",
    fontWeight: "700",
  },
  todayDateWeekSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dateNum: {
    fontSize: 20,
    fontWeight: "500",
    color: C.ink,
    marginTop: 2,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  dateNumSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dateMonth: {
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.7,
    color: C.dustTaupe,
    marginTop: 1,
  },
  dateMonthSelected: {
    color: "rgba(255, 255, 255, 0.65)",
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
    justifyContent: "space-between",
    rowGap: 8,
  },
  slotChip: {
    width: "23.5%",
    minHeight: 52,
    borderRadius: R.lg,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  slotChipSelected: {
    backgroundColor: C.ink,
    borderColor: C.ink,
  },
  slotChipBooked: {
    backgroundColor: C.lifted,
    borderColor: C.borderLight,
    opacity: 0.6,
  },
  slotCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.main,
    alignItems: "center",
    justifyContent: "center",
  },
  slotChipBody: {
    alignItems: "center",
  },
  slotStart: {
    fontSize: 14,
    fontWeight: "600",
    color: C.ink,
    letterSpacing: -0.2,
    fontVariant: ["tabular-nums"],
  },
  slotStartSelected: {
    color: "#FFFFFF",
  },
  slotStartBooked: {
    color: C.muted,
    textDecorationLine: "line-through",
  },
  slotEnd: {
    fontSize: 10,
    color: C.muted,
    marginTop: 1,
  },
  slotEndSelected: {
    color: "rgba(255, 255, 255, 0.6)",
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