// src/screen/SavedAddressesScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S } from "../theme";

const INITIAL_ADDRESSES = [
  {
    id: "a1",
    tag: "Home",
    icon: "home-outline",
    address: "742 Evergreen Terrace, Sector 4, Downtown",
    city: "New York, NY 10001",
    isDefault: true,
  },
  {
    id: "a2",
    tag: "Work",
    icon: "briefcase-outline",
    address: "Suite 1400, Financial District Tower",
    city: "New York, NY 10005",
    isDefault: false,
  },
];

export default function SavedAddressesScreen({ goBack }) {
  const [addresses, setAddresses] = useState(INITIAL_ADDRESSES);
  const [showAddForm, setShowAddForm] = useState(false);
  const [tag, setTag] = useState("Other");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");

  const handleAddAddress = () => {
    if (!street.trim()) return;
    const newAddr = {
      id: `a_${Date.now()}`,
      tag: tag || "Other",
      icon: tag === "Home" ? "home-outline" : tag === "Work" ? "briefcase-outline" : "location-outline",
      address: street.trim(),
      city: city.trim() || "New York, NY",
      isDefault: addresses.length === 0,
    };
    setAddresses([...addresses, newAddr]);
    setStreet("");
    setCity("");
    setShowAddForm(false);
  };

  const handleDelete = (id) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#1A1714" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Locations</Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(!showAddForm)}
          style={styles.addHeaderBtn}
        >
          <Ionicons name={showAddForm ? "close" : "add"} size={22} color="#1A1714" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showAddForm && (
          <View style={styles.addFormCard}>
            <Text style={styles.formTitle}>ADD NEW ADDRESS</Text>
            <View style={styles.tagRow}>
              {["Home", "Work", "Other"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagChip, tag === t && styles.tagChipActive]}
                  onPress={() => setTag(t)}
                >
                  <Text style={[styles.tagText, tag === t && styles.tagTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Street address / Building name"
              placeholderTextColor="#9CA3AF"
              value={street}
              onChangeText={setStreet}
            />
            <TextInput
              style={styles.input}
              placeholder="City, State & Zip Code"
              placeholderTextColor="#9CA3AF"
              value={city}
              onChangeText={setCity}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save Location</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Address Cards */}
        {addresses.map((item) => (
          <View key={item.id} style={styles.addressCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name={item.icon} size={18} color="#1A1714" />
              </View>
              <Text style={styles.tagLabel}>{item.tag}</Text>
              {item.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>DEFAULT</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.streetText}>{item.address}</Text>
            <Text style={styles.cityText}>{item.city}</Text>
          </View>
        ))}
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
  addHeaderBtn: {
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
  addFormCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: S.lg,
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  formTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1.1,
    marginBottom: S.sm,
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: S.md,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  tagChipActive: {
    backgroundColor: "#1A1714",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  tagTextActive: {
    color: "#FFFFFF",
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
    marginBottom: S.sm,
  },
  saveBtn: {
    backgroundColor: "#1A1714",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: S.xs,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  addressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A1714",
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  defaultText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#B45309",
  },
  deleteBtn: {
    padding: 4,
  },
  streetText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  cityText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
});
