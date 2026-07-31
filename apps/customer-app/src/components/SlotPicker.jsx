// src/components/SlotPicker.jsx
import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
              {isSelected ? <View style={styles.activeDot} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time Slot Section */}
      <Text style={[styles.sectionHeading, { marginTop: 22 }]}>SELECT AVAILABLE TIME</Text>

      {(!slots || slots.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={24} color="#8E8880" />
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
    marginVertical: 12,
  },
  sectionHeading: {
    fontSize: 9,
    fontWeight: "800",
    color: "#8E8880",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  dateList: {
    flexDirection: "row",
  },
  dateCard: {
    width: 62,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  dateCardSelected: {
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
    shadowColor: "#1A1A1A",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  dayName: {
    fontSize: 9,
    color: "#8E8880",
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  dayNameSelected: {
    color: "rgba(255, 255, 255, 0.65)",
  },
  dayNum: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A1A1A",
    marginTop: 3,
  },
  dayNumSelected: {
    color: "#FFFFFF",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E6CA65",
    marginTop: 4,
  },
  emptyContainer: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
    gap: 6,
  },
  emptyText: {
    color: "#8E8880",
    fontSize: 12,
    fontWeight: "500",
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    minWidth: 80,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  slotBooked: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    opacity: 0.85,
    elevation: 0,
    shadowOpacity: 0,
  },
  slotSelected: {
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
    shadowColor: "#1A1A1A",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  slotTimeBooked: {
    color: "#DC2626",
    textDecorationLine: "line-through",
    fontWeight: "700",
  },
  slotTimeSelected: {
    color: "#E6CA65",
    fontWeight: "900",
  },
  bookedBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#EF4444",
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
