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

import { Alert } from "react-native";

export default function EditProfileScreen({ goBack }) {
  const { user, updateUser, changePassword, deleteAccount } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState(null);

  // Delete Account state
  const [deleting, setDeleting] = useState(false);

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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPassError("Please enter both your current and new password.");
      return;
    }
    if (newPassword.length < 8) {
      setPassError("New password must be at least 8 characters.");
      return;
    }
    setChangingPass(true);
    setPassError(null);

    const res = await changePassword(currentPassword, newPassword);
    setChangingPass(false);

    if (res.success) {
      setPassSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPassSuccess(false), 2000);
    } else {
      setPassError(res.error || "Failed to change password.");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanent",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const res = await deleteAccount();
            setDeleting(false);
            if (!res.success) {
              Alert.alert("Error", res.error || "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  const styles = getStyles();
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const topInset = Math.max(insets.top, isAndroid ? (StatusBar.currentHeight || 24) : 0);
  const bottomInset = isAndroid ? Math.max(insets.bottom, 36) + 20 : Math.max(insets.bottom, 20) + 20;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color={C.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]} showsVerticalScrollIndicator={false}>
        {/* Avatar Editor */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarBox}>
            <Image
              source={{ uri: user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* Inputs Form */}
        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>

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

          <TouchableOpacity
            style={[styles.saveBtn, savedSuccess && styles.successBtn]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving ? (
              <ActivityIndicator color={C.bg} size="small" />
            ) : savedSuccess ? (
              <Text style={styles.saveBtnText}>✓ Details Saved</Text>
            ) : (
              <Text style={styles.saveBtnText}>Save Profile Details</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Change Password Form */}
        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>SECURITY & PASSWORD</Text>

          <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor={C.dustTaupe}
          />

          <Text style={styles.inputLabel}>NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="At least 8 characters"
            placeholderTextColor={C.dustTaupe}
          />

          {passError ? <Text style={styles.errorText}>{passError}</Text> : null}
          {passSuccess ? <Text style={styles.successText}>✓ Password updated successfully</Text> : null}

          <TouchableOpacity
            style={[styles.secondaryBtn, passSuccess && styles.successBtn]}
            onPress={handleChangePassword}
            disabled={changingPass}
            activeOpacity={0.88}
          >
            {changingPass ? (
              <ActivityIndicator color={C.ink} size="small" />
            ) : (
              <Text style={styles.secondaryBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Delete Account Form */}
        <View style={styles.dangerGroup}>
          <Text style={styles.dangerTitle}>PRIVACY & DATA DELETION</Text>
          <Text style={styles.dangerText}>
            Permanently delete your account and remove all personal booking data.
          </Text>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteAccount}
            disabled={deleting}
            activeOpacity={0.88}
          >
            {deleting ? (
              <ActivityIndicator color="#DC2626" size="small" />
            ) : (
              <Text style={styles.deleteBtnText}>Delete My Account</Text>
            )}
          </TouchableOpacity>
        </View>
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
    sectionTitle: {
      fontSize: 11,
      fontWeight: FW.bold,
      color: C.ink,
      letterSpacing: 0.8,
      marginBottom: S.xs,
    },
    secondaryBtn: {
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      paddingVertical: 12,
      borderRadius: R.md,
      alignItems: "center",
      marginTop: S.sm,
    },
    secondaryBtnText: {
      color: C.ink,
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
    successText: {
      color: "#065F46",
      fontSize: FS.caption,
      fontWeight: FW.medium,
      marginTop: S.xs,
    },
    dangerGroup: {
      backgroundColor: "#FEF2F2",
      borderRadius: R.lg,
      padding: S.md,
      marginVertical: S.sm,
      borderWidth: 1,
      borderColor: "#FCA5A5",
      gap: 6,
    },
    dangerTitle: {
      fontSize: 11,
      fontWeight: FW.bold,
      color: "#991B1B",
      letterSpacing: 0.8,
    },
    dangerText: {
      fontSize: FS.caption,
      color: "#7F1D1D",
      lineHeight: 18,
    },
    deleteBtn: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#FCA5A5",
      paddingVertical: 10,
      borderRadius: R.md,
      alignItems: "center",
      marginTop: S.xs,
    },
    deleteBtnText: {
      color: "#DC2626",
      fontSize: FS.bodySm,
      fontWeight: FW.semiBold,
    },
  });
}
