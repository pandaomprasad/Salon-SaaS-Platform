// src/components/SlotPicker.jsx
import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";

export default function SlotPicker({ slots, selectedSlotId, onSelectSlot, selectedDate, onSelectDate }) {
  // Generate next 7 dates
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return { isoStr, dayName, dayNum, monthName };
  });

  return (
    <View style={styles.container}>
      {/* Date Picker Section */}
      <Text style={styles.sectionHeading}>SELECT DATE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
        {dates.map((d) => {
          const isSelected = selectedDate === d.isoStr;
          return (
            <TouchableOpacity
              key={d.isoStr}
              style={[styles.dateCard, isSelected && styles.dateCardSelected]}
              onPress={() => onSelectDate(d.isoStr)}
              activeOpacity={0.85}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>{d.dayName}</Text>
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>{d.dayNum}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time Slot Section */}
      <Text style={[styles.sectionHeading, { marginTop: S.md }]}>SELECT AVAILABLE TIME</Text>

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

            const isSelected = selectedSlotId === (slot._id || slot.id);

            return (
              <TouchableOpacity
                key={slot._id || slot.id}
                disabled={isBooked}
                style={[
                  styles.slotChip,
                  isBooked && styles.slotBooked,
                  isSelected && styles.slotSelected,
                ]}
                onPress={() => !isBooked && onSelectSlot(slot)}
                activeOpacity={isBooked ? 1 : 0.85}
              >
                <Text
                  style={[
                    styles.slotTime,
                    isBooked && styles.slotTimeBooked,
                    isSelected && styles.slotTimeSelected,
                  ]}
                >
                  {slot.startTime || slot.time}
                </Text>
                {isBooked && <Text style={styles.bookedBadgeText}>Booked</Text>}
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
  sectionHeading: {
    ...TYPO.eyebrow,
    marginBottom: S.xs,
  },
  dateList: {
    flexDirection: "row",
  },
  dateCard: {
    width: 58,
    height: 64,
    borderRadius: R.md, // 8px radius per cursor/DESIGN.md
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: S.xs,
  },
  dateCardSelected: {
    backgroundColor: C.main, // Cursor Orange
    borderColor: C.main,
  },
  dayName: {
    fontSize: 9,
    color: C.muted,
    fontWeight: FW.semiBold,
    letterSpacing: 0.88,
  },
  dayNameSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  dayNum: {
    fontSize: FS.bodyLg,
    fontWeight: FW.semiBold,
    color: C.ink,
    marginTop: 2,
  },
  dayNumSelected: {
    color: "#FFFFFF",
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
    gap: S.xs,
  },
  slotChip: {
    paddingHorizontal: S.md,
    paddingVertical: 10,
    borderRadius: R.md, // 8px radius per cursor/DESIGN.md
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 76,
    alignItems: "center",
  },
  slotBooked: {
    backgroundColor: C.errorBg,
    borderColor: "rgba(207, 45, 86, 0.2)",
    opacity: 0.85,
  },
  slotSelected: {
    backgroundColor: C.main, // Cursor Orange
    borderColor: C.main,
  },
  slotTime: {
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
    color: C.ink,
  },
  slotTimeBooked: {
    color: C.error,
    textDecorationLine: "line-through",
  },
  slotTimeSelected: {
    color: "#FFFFFF",
  },
  bookedBadgeText: {
    fontSize: 9,
    fontWeight: FW.semiBold,
    color: C.error,
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
