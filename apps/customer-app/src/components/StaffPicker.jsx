// src/components/StaffPicker.jsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, R } from "../theme";
import { useTheme } from "../context/ThemeContext";

const ANY_STAFF = {
  id: "any",
  _id: "any",
  name: "Any Specialist",
  title: "First Available",
  isAny: true,
};

const DEFAULT_STAFF = [
  {
    id: "st_1",
    name: "Lily",
    title: "Manager",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "st_2",
    name: "Lee",
    title: "Sr. Barber",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "st_3",
    name: "Connor",
    title: "Makeup Artist",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "st_4",
    name: "Sophia",
    title: "Hair Specialist",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  },
];

export default function StaffPicker({ staffList = [], selectedStaffId, selectedStaff, onSelectStaff }) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  const rawList = staffList.length > 0 ? staffList : DEFAULT_STAFF;
  const list = [ANY_STAFF, ...rawList];

  const currentStaffId =
    selectedStaffId ||
    selectedStaff?._id ||
    selectedStaff?.id ||
    (typeof selectedStaff === "string" ? selectedStaff : null);

  // Helper to format clean subtext role/title instead of raw MongoDB object IDs
  const getCleanTitle = (staff) => {
    if (staff.isAny) return "First Available";
    const raw = staff.title || staff.role || staff.specialty || staff.designation;
    if (!raw || /^[0-9a-fA-F]{24}$/.test(raw) || raw.length > 20) {
      return "Specialist";
    }
    return raw;
  };

  // Helper to determine gender for icon badge
  const getGender = (staff) => {
    if (staff.isAny) return null;
    const g = (staff.gender || staff.sex || staff.genderType || "").toLowerCase();
    if (g.includes("female") || g === "f") return "female";
    if (g.includes("male") || g === "m") return "male";

    // Heuristic fallback for default or unassigned staff names
    const name = (staff.name || "").toLowerCase();
    const title = (staff.title || staff.role || "").toLowerCase();
    if (
      title.includes("barber") ||
      name.includes("lee") ||
      name.includes("alexander") ||
      name.includes("marcus") ||
      name.includes("sunil") ||
      name.includes("amit") ||
      name.includes("connor")
    ) {
      return "male";
    }
    if (
      title.includes("manager") ||
      name.includes("lily") ||
      name.includes("elena") ||
      name.includes("sophia") ||
      name.includes("priya")
    ) {
      return "female";
    }
    return "male";
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Select specialist</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {list.map((staff) => {
          const staffId = staff.id || staff._id;
          const isAny = staff.isAny;
          const isSelected = isAny ? !currentStaffId || currentStaffId === "any" : currentStaffId === staffId;
          const gender = getGender(staff);

          return (
            <TouchableOpacity
              key={staffId}
              style={[styles.staffCard, isSelected && styles.staffCardSelected]}
              onPress={() => onSelectStaff(isAny ? null : staff)}
              activeOpacity={0.8}
            >
              <View style={styles.avatarWrapper}>
                {isAny ? (
                  <View style={[styles.avatar, styles.anyAvatar, isSelected && styles.anyAvatarSelected]}>
                    <Ionicons
                      name="sparkles"
                      size={28}
                      color={isSelected ? "#6C5CE7" : isDark ? "#94A3B8" : "#64748B"}
                    />
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

                {/* Male/Female Gender Logo Badge */}
                {gender && (
                  <View
                    style={[
                      styles.genderBadge,
                      gender === "male" ? styles.maleBadge : styles.femaleBadge,
                    ]}
                  >
                    <Ionicons
                      name={gender === "male" ? "male" : "female"}
                      size={10}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </View>

              <Text
                style={[styles.name, isSelected && styles.nameSelected]}
                numberOfLines={1}
              >
                {staff.name}
              </Text>

              <Text style={styles.title} numberOfLines={1}>
                {getCleanTitle(staff)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function getStyles(theme, isDark) {
  const accentColor = C.purple || "#6C5CE7";

  return StyleSheet.create({
    container: {
      marginVertical: 14,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      letterSpacing: -0.3,
    },
    scrollContent: {
      paddingRight: 16,
      gap: 12,
    },
    staffCard: {
      width: 104,
      backgroundColor: isDark ? "#1C1C1E" : (C.bg || "#FAFAFC"),
      borderRadius: 22,
      padding: 10,
      alignItems: "center",
      borderWidth: 2,
      borderColor: isDark ? "#1C1C1E" : (C.bg || "#FAFAFC"),
    },
    staffCardSelected: {
      borderColor: accentColor,
      backgroundColor: isDark ? "rgba(108, 92, 231, 0.15)" : "#F4F2FF",
    },
    avatarWrapper: {
      position: "relative",
      marginBottom: 8,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 18,
      backgroundColor: isDark ? "#2A2A2C" : "#E2E8F0",
    },
    genderBadge: {
      position: "absolute",
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: isDark ? "#1C1C1E" : "#FFFFFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    maleBadge: {
      backgroundColor: "#3B82F6", // Bright male blue
    },
    femaleBadge: {
      backgroundColor: "#EC4899", // Bright female pink
    },
    anyAvatar: {
      backgroundColor: isDark ? "#2A2A2C" : "#EDEBF9",
      alignItems: "center",
      justifyContent: "center",
    },
    anyAvatarSelected: {
      backgroundColor: isDark ? "rgba(108, 92, 231, 0.25)" : "#E4E0FF",
    },
    name: {
      fontSize: 13,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#1A1A24",
      textAlign: "center",
    },
    nameSelected: {
      color: accentColor,
    },
    title: {
      fontSize: 11,
      fontWeight: "500",
      color: isDark ? "#94A3B8" : "#8A8A9E",
      textAlign: "center",
      marginTop: 2,
    },
  });
}
