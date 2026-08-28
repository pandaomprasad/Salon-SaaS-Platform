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
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const MALE_AVATAR_ASSET = require("../../assets/male-avatar.png");
const FEMALE_AVATAR_ASSET = require("../../assets/female-avatar.png");

const TOP_INSET = Platform.OS === "ios" ? 52 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36);

export default function EditProfileScreen({ goBack }) {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();

  const [name, setName] = useState(user?.name || "Robert Fox");
  const [email, setEmail] = useState(user?.email || "robert_fox@gmail.com");
  const [gender, setGender] = useState(user?.gender || "Male");
  const [birthDate, setBirthDate] = useState(user?.birthDate || "08/15/2012");
  const [address, setAddress] = useState(user?.address || "6391 Elgin St. Celina, Delaware 10299");
  const [phone, setPhone] = useState(user?.phone || "365248667");
  const [countryCode, setCountryCode] = useState("+91");

  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl || null);
  const [saving, setSaving] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Needed", "Permission to access photo gallery is required.");
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setAvatarUri(pickerResult.assets[0].uri);
      }
    } catch (err) {
      console.log("Error picking image:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (updateUser) {
        await updateUser({
          name: name.trim(),
          email: email.trim(),
          gender,
          birthDate,
          address: address.trim(),
          phone: phone.trim(),
          avatarUrl: avatarUri,
        });
      }
      Alert.alert("Success", "Profile updated successfully!");
      if (goBack) goBack();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const getAvatarSource = () => {
    if (avatarUri) return { uri: avatarUri };
    if (gender.toLowerCase() === "female") return FEMALE_AVATAR_ASSET;
    return MALE_AVATAR_ASSET;
  };

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Row with Close Button */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={goBack} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#18181B"} />
          </TouchableOpacity>
        </View>

        {/* Avatar Area with "Change Avatar" */}
        <View style={styles.avatarRow}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar} activeOpacity={0.85}>
            <Image source={getAvatarSource()} style={styles.avatarImg} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7} style={styles.changeAvatarBtn}>
            <Text style={styles.changeAvatarText}>Change Avatar</Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs */}
        {/* 1. Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full name</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
              placeholderTextColor="#A0A0AB"
            />
          </View>
        </View>

        {/* 2. Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="Enter email address"
              placeholderTextColor="#A0A0AB"
            />
          </View>
        </View>

        {/* 3. Gender & Birth of Date (Side by side) */}
        <View style={styles.twoColumnRow}>
          <View style={styles.columnField}>
            <Text style={styles.label}>Gender</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowGenderModal(true)} activeOpacity={0.8}>
              <Text style={styles.selectText}>{gender}</Text>
              <Ionicons name="chevron-down" size={16} color="#66666E" />
            </TouchableOpacity>
          </View>

          <View style={styles.columnField}>
            <Text style={styles.label}>Birth of date</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#A0A0AB"
              />
            </View>
          </View>
        </View>

        {/* 4. Address */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Address</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address"
              placeholderTextColor="#A0A0AB"
            />
          </View>
        </View>

        {/* 5. Phone Number */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone number</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.flagText}>🇮🇳</Text>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Ionicons name="chevron-down" size={14} color="#66666E" style={{ marginLeft: 3 }} />
            </View>

            <View style={[styles.inputBox, { flex: 1, marginLeft: 10 }]}>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Phone number"
                placeholderTextColor="#A0A0AB"
              />
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.88}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Gender Picker Modal */}
      <Modal visible={showGenderModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGenderModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {["Male", "Female", "Other"].map((g) => (
              <TouchableOpacity
                key={g}
                style={styles.genderOption}
                onPress={() => {
                  setGender(g);
                  setShowGenderModal(false);
                }}
              >
                <Text style={[styles.genderOptionText, gender === g && { color: "#6C5CE7", fontWeight: "700" }]}>{g}</Text>
                {gender === g && <Ionicons name="checkmark" size={18} color="#6C5CE7" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function getStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121216" : "#FFFFFF",
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: TOP_INSET,
      paddingBottom: 60,
    },
    topHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    closeBtn: {
      padding: 6,
    },
    avatarRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 28,
    },
    avatarContainer: {
      width: 72,
      height: 72,
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: isDark ? "#2A2A34" : "#F0F0F5",
      marginRight: 16,
    },
    avatarImg: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    changeAvatarBtn: {
      paddingVertical: 6,
    },
    changeAvatarText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#6C5CE7",
    },
    fieldGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#9999A0" : "#8E8E93",
      marginBottom: 8,
    },
    inputBox: {
      height: 52,
      borderRadius: 14,
      backgroundColor: isDark ? "#1E1E26" : "#F7F7FA",
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    textInput: {
      flex: 1,
      fontSize: 14.5,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    selectText: {
      fontSize: 14.5,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    twoColumnRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    columnField: {
      flex: 1,
      marginRight: 10,
    },
    phoneInputRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    countryCodeBox: {
      height: 52,
      borderRadius: 14,
      backgroundColor: isDark ? "#1E1E26" : "#F7F7FA",
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
    },
    flagText: {
      fontSize: 16,
      marginRight: 6,
    },
    countryCodeText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    saveBtn: {
      height: 54,
      borderRadius: 18,
      backgroundColor: "#6C5CE7",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#6C5CE7",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    saveBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    modalContent: {
      width: "100%",
      backgroundColor: isDark ? "#1E1E26" : "#FFFFFF",
      borderRadius: 20,
      padding: 20,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      marginBottom: 16,
    },
    genderOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#2E2E38" : "#EFEFF4",
    },
    genderOptionText: {
      fontSize: 15,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
  });
}
