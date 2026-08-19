// src/components/StaffPicker.jsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";

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
    title: "Master Stylist",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    rating: "4.95",
  },
  {
    id: "st_2",
    name: "Elena Rostova",
    title: "Senior Colorist",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    rating: "4.92",
  },
  {
    id: "st_3",
    name: "Marcus Vance",
    title: "Barber Specialist",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    rating: "4.88",
  },
];

export default function StaffPicker({ staffList = [], selectedStaffId, selectedStaff, onSelectStaff }) {
  const styles = getStyles();
  const list = staffList.length > 0 ? [DEFAULT_STAFF[0], ...staffList] : DEFAULT_STAFF;
  const currentStaffId = selectedStaffId || selectedStaff?._id || selectedStaff?.id || (typeof selectedStaff === "string" ? selectedStaff : null);

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
          const isSelected = currentStaffId === staffId || (!currentStaffId && staff.isAny);

          return (
            <TouchableOpacity
              key={staffId}
              style={[styles.staffCard, isSelected && styles.staffCardSelected]}
              onPress={() => onSelectStaff(staff.isAny ? null : staff)}
              activeOpacity={0.85}
            >
              <View style={styles.avatarWrapper}>
                {staff.isAny ? (
                  <View style={[styles.avatar, styles.anyAvatar]}>
                    <Ionicons name="sparkles" size={20} color={C.main} />
                  </View>
                ) : (
                  <Image
                    source={{
                      uri:
                        staff.avatar ||
                        staff.photoUrl ||
                        staff.image ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
                    }}
                    style={styles.avatar}
                  />
                )}
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={10} color={C.bg} />
                  </View>
                )}
              </View>

              <Text style={styles.name} numberOfLines={1}>
                {staff.name}
              </Text>

              {!staff.isAny && (
                <View style={styles.ratingBox}>
                  <Ionicons name="star" size={10} color={C.main} />
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

function getStyles() {
  return StyleSheet.create({
  container: {
    marginVertical: S.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: S.xs,
  },
  sectionTitle: {
    ...TYPO.eyebrow,
  },
  optionalBadge: {
    fontSize: FS.caption,
    color: C.muted,
  },
  scrollContent: {
    paddingRight: S.sm,
  },
  // feature-card per cursor/DESIGN.md: 12px radius, white surface, hairline border
  staffCard: {
    width: 114,
    backgroundColor: C.surface,
    borderRadius: R.lg, // 12px card radius
    padding: S.sm,
    alignItems: "center",
    marginRight: S.xs,
    borderWidth: 1,
    borderColor: C.border,
  },
  staffCardSelected: {
    borderColor: C.main,
    backgroundColor: C.surface,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.bone,
  },
  anyAvatar: {
    backgroundColor: C.mainLight,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: C.main,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.surface,
  },
  name: {
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
    color: C.ink,
    textAlign: "center",
  },
  title: {
    fontSize: FS.caption,
    color: C.body,
    textAlign: "center",
    marginTop: 2,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.lifted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: R.pill,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: FW.semiBold,
    color: C.ink,
    marginLeft: 2,
  },
  });
}
