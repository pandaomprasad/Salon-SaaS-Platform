// src/components/StaffPicker.jsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S } from "../theme";

const DEFAULT_STAFF = [
  {
    id: "any",
    name: "Any Specialist",
    title: "Maximum Flexibility",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    rating: "5.0",
    isAny: true,
  },
  {
    id: "st_1",
    name: "Alexander Wright",
    title: "Master Stylist & Director",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    rating: "4.95",
    specialty: "Precision Cuts & Color",
  },
  {
    id: "st_2",
    name: "Elena Rostova",
    title: "Senior Colorist",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    rating: "4.92",
    specialty: "Balayage & Highlights",
  },
  {
    id: "st_3",
    name: "Marcus Vance",
    title: "Barber Specialist",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    rating: "4.88",
    specialty: "Beard Sculpting & Fades",
  },
];

export default function StaffPicker({ staffList = [], selectedStaffId, onSelectStaff }) {
  const list = staffList.length > 0 ? [DEFAULT_STAFF[0], ...staffList] : DEFAULT_STAFF;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>SELECT SPECIALIST</Text>
        <Text style={styles.optionalBadge}>Optional</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {list.map((staff) => {
          const staffId = staff.id || staff._id;
          const isSelected = selectedStaffId === staffId || (!selectedStaffId && staff.isAny);

          return (
            <TouchableOpacity
              key={staffId}
              style={[styles.staffCard, isSelected && styles.staffCardSelected]}
              onPress={() => onSelectStaff(staff.isAny ? null : staff)}
              activeOpacity={0.82}
            >
              <View style={styles.avatarWrapper}>
                {staff.isAny ? (
                  <View style={[styles.avatar, styles.anyAvatar]}>
                    <Ionicons name="sparkles" size={22} color="#D97706" />
                  </View>
                ) : (
                  <Image source={{ uri: staff.avatar || staff.photoUrl }} style={styles.avatar} />
                )}
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>

              <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>
                {staff.name}
              </Text>
              <Text style={styles.title} numberOfLines={1}>
                {staff.title || staff.role || "Stylist"}
              </Text>

              {!staff.isAny && (
                <View style={styles.ratingBox}>
                  <Ionicons name="star" size={11} color="#D97706" />
                  <Text style={styles.ratingText}>{staff.rating || "4.9"}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: S.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: S.sm,
    paddingHorizontal: S.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1.1,
  },
  optionalBadge: {
    fontSize: 11,
    color: "#8E8880",
    fontWeight: "600",
  },
  scrollContent: {
    paddingRight: S.md,
  },
  staffCard: {
    width: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  staffCardSelected: {
    borderColor: "#1A1714",
    backgroundColor: "#FAF8F5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3F4F6",
  },
  anyAvatar: {
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#1A1714",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  name: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1714",
    textAlign: "center",
  },
  nameSelected: {
    fontWeight: "800",
  },
  title: {
    fontSize: 10,
    color: "#8E8880",
    textAlign: "center",
    marginTop: 2,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B45309",
    marginLeft: 3,
  },
});
