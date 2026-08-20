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
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authService } from "../services/authService";

export default function EditProfileScreen({ goBack }) {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError("Please enter your full name.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await authService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
      });
      const updated = res?.data?.user;
      if (updated) {
        updateUser({ name: updated.name, phone: updated.phone });
      } else {
        updateUser({ name: name.trim(), phone: phone.trim() });
      }
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        if (goBack) goBack();
      }, 1200);
    } catch (err) {
      setSaveError(err.message || "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const styles = getStyles();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
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
              <Ionicons name="camera" size={14} color={C.bg} />
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
            style={[styles.input, styles.inputDisabled]}
            value={email}
            editable={false}
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

          {saveError ? (
            <Text style={styles.errorText}>{saveError}</Text>
          ) : null}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, savedSuccess && styles.successBtn]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.88}
        >
          {saving ? (
            <ActivityIndicator color={C.bg} size="small" />
          ) : savedSuccess ? (
            <Text style={styles.saveBtnText}>✓ Saved</Text>
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 54,
      paddingHorizontal: S.md,
      paddingBottom: S.md,
      borderBottomWidth: 1,
      borderBottomColor: C.borderLight,
      backgroundColor: C.bg,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: C.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    headerTitle: {
      fontSize: FS.titleSm,
      fontWeight: FW.semiBold,
      color: C.ink,
    },
    content: {
      paddingHorizontal: S.md,
      paddingBottom: 40,
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
      backgroundColor: C.main,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: C.surface,
    },
    avatarHint: {
      fontSize: FS.caption,
      color: C.muted,
      marginTop: S.xs,
    },
    formGroup: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
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
    input: {
      backgroundColor: C.surface,
      borderRadius: R.md,
      paddingHorizontal: S.sm,
      height: 44,
      fontSize: FS.bodySm,
      color: C.ink,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: S.xs,
    },
    inputDisabled: {
      color: C.muted,
      backgroundColor: C.lifted,
    },
    errorText: {
      color: C.error,
      fontSize: FS.caption,
      fontWeight: FW.medium,
      marginTop: S.xs,
    },
    saveBtn: {
      backgroundColor: C.main,
      paddingVertical: 12,
      borderRadius: R.md,
      alignItems: "center",
      marginTop: S.md,
    },
    successBtn: {
      backgroundColor: C.success,
    },
    saveBtnText: {
      color: C.bg,
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
  });
}
