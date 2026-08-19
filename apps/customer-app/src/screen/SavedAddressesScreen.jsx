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
import { C, S, FS, FW, R, TYPO } from "../theme";

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

  const styles = getStyles();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color={C.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Locations</Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(!showAddForm)}
          style={styles.addHeaderBtn}
        >
          <Ionicons name={showAddForm ? "close" : "add"} size={20} color={C.ink} />
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
              placeholderTextColor={C.dustTaupe}
              value={street}
              onChangeText={setStreet}
            />
            <TextInput
              style={styles.input}
              placeholder="City, State & ZIP"
              placeholderTextColor={C.dustTaupe}
              value={city}
              onChangeText={setCity}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress} activeOpacity={0.88}>
              <Text style={styles.saveBtnText}>Save Address</Text>
            </TouchableOpacity>
          </View>
        )}

        {addresses.map((item) => (
          <View key={item.id} style={styles.addressCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name={item.icon} size={16} color={C.ink} />
              </View>
              <Text style={styles.tagLabel}>{item.tag}</Text>
              {item.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>DEFAULT</Text>
                </View>
              ) : null}
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={C.muted} />
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
    addHeaderBtn: {
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: C.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    content: {
      paddingHorizontal: S.md,
      paddingTop: S.md,
      paddingBottom: 40,
    },
    addFormCard: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.md,
      marginBottom: S.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    formTitle: {
      ...TYPO.eyebrow,
      color: C.main,
      marginBottom: S.xs,
    },
    tagRow: {
      flexDirection: "row",
      gap: S.xs,
      marginBottom: S.sm,
    },
    tagChip: {
      paddingHorizontal: S.md,
      paddingVertical: 7,
      borderRadius: R.md,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
    },
    tagChipActive: {
      backgroundColor: C.ink,
      borderColor: C.ink,
    },
    tagText: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
      color: C.ink,
    },
    tagTextActive: {
      color: C.bg,
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
    saveBtn: {
      backgroundColor: C.main,
      paddingVertical: 12,
      borderRadius: R.md,
      alignItems: "center",
      marginTop: S.xs,
    },
    saveBtnText: {
      color: C.bg,
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
    addressCard: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.md,
      marginBottom: S.sm,
      borderWidth: 1,
      borderColor: C.border,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: S.xs,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: R.md,
      backgroundColor: C.lifted,
      alignItems: "center",
      justifyContent: "center",
      marginRight: S.xs,
      borderWidth: 1,
      borderColor: C.borderLight,
    },
    tagLabel: {
      fontSize: FS.bodySm,
      fontWeight: FW.semiBold,
      color: C.ink,
      flex: 1,
    },
    defaultBadge: {
      backgroundColor: C.grep,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: R.pill,
      marginRight: S.xs,
    },
    defaultText: {
      fontSize: 9,
      fontWeight: FW.semiBold,
      color: C.ink,
      letterSpacing: 0.88,
    },
    deleteBtn: {
      padding: S.xxs,
    },
    streetText: {
      fontSize: FS.bodySm,
      fontWeight: FW.regular,
      color: C.ink,
    },
    cityText: {
      fontSize: FS.bodySm - 1,
      color: C.body,
      marginTop: 2,
    },
  });
}
