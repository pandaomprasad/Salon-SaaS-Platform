// src/screen/EditProfileScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useAuth } from "../context/AuthContext";

export default function EditProfileScreen({ goBack }) {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "+1 (555) 234-5678");
  const [gender, setGender] = useState("Female");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        if (goBack) goBack();
      }, 1200);
    }, 800);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color={C.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Personal Info</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Editor */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarBox}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editBadge} activeOpacity={0.8}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap camera to update profile photo</Text>
        </View>

        {/* Inputs Form */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
            placeholderTextColor={C.dustTaupe}
          />

          <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Enter email"
            placeholderTextColor={C.dustTaupe}
          />

          <Text style={styles.inputLabel}>PHONE NUMBER</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Enter phone number"
            placeholderTextColor={C.dustTaupe}
          />

          <Text style={styles.inputLabel}>GENDER PREFERENCE</Text>
          <View style={styles.genderRow}>
            {["Female", "Male", "Non-Binary"].map((g) => {
              const isSelected = gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, isSelected && styles.genderChipSelected]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderText, isSelected && styles.genderTextSelected]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, savedSuccess && styles.successBtn]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : savedSuccess ? (
            <Text style={styles.saveBtnText}>✓ Saved Changes!</Text>
          ) : (
            <Text style={styles.saveBtnText}>Save Profile Updates</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg, // Canvas warm cream #f7f7f4
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: S.md,
    paddingTop: 52,
    paddingBottom: S.md,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: R.md,
    backgroundColor: C.lifted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  headerTitle: {
    fontSize: FS.titleSm,
    fontWeight: "400", // Display 400
    color: C.ink,
    letterSpacing: -0.32,
  },
  content: {
    padding: S.md,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: S.md,
  },
  avatarBox: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.bone,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: C.main, // Cursor Orange
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarHint: {
    fontSize: FS.caption,
    color: C.muted,
    marginTop: S.xs,
  },

  // feature-card per cursor/DESIGN.md: 12px radius, white surface, hairline border
  formGroup: {
    backgroundColor: C.surface,
    borderRadius: R.lg, // 12px card radius
    padding: S.md,
    marginVertical: S.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  inputLabel: {
    ...TYPO.eyebrow,
    color: C.main,
    marginBottom: S.xxs,
    marginTop: S.xs,
  },
  // text-input per cursor/DESIGN.md: 8px radius, height 44px
  input: {
    backgroundColor: C.surface,
    borderRadius: R.md, // 8px radius
    paddingHorizontal: S.sm,
    height: 44,
    fontSize: FS.bodySm,
    color: C.ink,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: S.xs,
  },
  genderRow: {
    flexDirection: "row",
    gap: S.xs,
    marginTop: S.xxs,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: R.md,
    backgroundColor: C.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  genderChipSelected: {
    backgroundColor: C.ink,
    borderColor: C.ink,
  },
  genderText: {
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
    color: C.ink,
  },
  genderTextSelected: {
    color: "#FFFFFF",
  },
  // button-primary per cursor/DESIGN.md: Cursor Orange #f54e00, 8px radius
  saveBtn: {
    backgroundColor: C.main, // Cursor Orange
    paddingVertical: 12,
    borderRadius: R.md, // 8px radius
    alignItems: "center",
    marginTop: S.md,
  },
  successBtn: {
    backgroundColor: C.success,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },
});
