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
import { C, S } from "../theme";
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
          <Ionicons name="arrow-back" size={20} color="#1A1714" />
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
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Enter email"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.inputLabel}>PHONE NUMBER</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Enter phone number"
            placeholderTextColor="#9CA3AF"
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
    backgroundColor: "#F7F5F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: S.lg,
    paddingTop: 54,
    paddingBottom: S.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1714",
  },
  content: {
    padding: S.lg,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: S.md,
  },
  avatarBox: {
    position: "relative",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#E5E7EB",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1A1714",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarHint: {
    fontSize: 11,
    color: "#8E8880",
    marginTop: 8,
  },
  formGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: S.lg,
    marginVertical: S.md,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1.1,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1A1714",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 6,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  genderChipSelected: {
    backgroundColor: "#1A1714",
  },
  genderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  genderTextSelected: {
    color: "#FFFFFF",
  },
  saveBtn: {
    backgroundColor: "#1A1714",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: S.md,
  },
  successBtn: {
    backgroundColor: "#10B981",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
