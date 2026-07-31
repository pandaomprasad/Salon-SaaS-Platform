// src/components/LocationPickerModal.jsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { S } from "../theme";

const POPULAR_CITIES = [
  { id: "Mumbai", name: "Mumbai", area: "Bandra, Juhu, South Mumbai" },
  { id: "Delhi", name: "Delhi NCR", area: "Connaught Place, Saket, Gurgaon" },
  { id: "Bangalore", name: "Bangalore", area: "Indiranagar, Koramangala" },
  { id: "Hyderabad", name: "Hyderabad", area: "Banjara Hills, Jubilee Hills" },
  { id: "Pune", name: "Pune", area: "Koregaon Park, Viman Nagar" },
  { id: "Kolkata", name: "Kolkata", area: "Park Street, Salt Lake" },
  { id: "Chennai", name: "Chennai", area: "Nungambakkam, Anna Nagar" },
];

export default function LocationPickerModal({
  visible,
  selectedCity,
  onSelectCity,
  onClose,
}) {
  const [search, setSearch] = useState("");

  const filteredCities = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheetContainer}>
          {/* Bottom Solid Extension to prevent Android navigation bar gap */}
          <View style={styles.bottomFill} />
          {/* Drag Handle Bar */}
          <View style={styles.handleBar} />

          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select Location</Text>
              <Text style={styles.subtitle}>Discover top salons near your city</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#1D1B20" />
            </TouchableOpacity>
          </View>

          {/* GPS Auto Detect Luxury Dark Card */}
          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={() => {
              onSelectCity("Mumbai");
              onClose();
            }}
            activeOpacity={0.85}
          >
            <View style={styles.gpsIconBox}>
              <Ionicons name="navigate" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.gpsTextInfo}>
              <Text style={styles.gpsTitle}>Use Current GPS Location</Text>
              <Text style={styles.gpsSub}>Auto-detect nearest area</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          {/* Search Input Box */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or neighborhood..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Popular Cities Section */}
          <Text style={styles.sectionLabel}>POPULAR CITIES</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.cityList}>
            {filteredCities.map((city) => {
              const isSelected = selectedCity === city.id;
              return (
                <TouchableOpacity
                  key={city.id}
                  style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                  onPress={() => {
                    onSelectCity(city.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cityIconWrap}>
                    <Ionicons
                      name="location"
                      size={18}
                      color={isSelected ? "#1D1B20" : "#9CA3AF"}
                    />
                  </View>

                  <View style={styles.cityInfo}>
                    <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                      {city.name}
                    </Text>
                    <Text style={styles.cityArea}>{city.area}</Text>
                  </View>

                  {isSelected ? (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 44 : 32,
    maxHeight: "82%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  bottomFill: {
    position: "absolute",
    bottom: -100,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "#FFFFFF",
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: S.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: S.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1D1B20",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1D1B20",
    padding: 16,
    borderRadius: 20,
    marginBottom: S.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  gpsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  gpsTextInfo: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  gpsSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#1D1B20",
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9CA3AF",
    letterSpacing: 1,
    marginBottom: 10,
  },
  cityList: {
    maxHeight: 280,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 6,
    backgroundColor: "#F9FAFB",
  },
  cityRowSelected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#1D1B20",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cityIconWrap: {
    marginRight: 12,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
  },
  cityNameSelected: {
    fontWeight: "900",
    color: "#1D1B20",
  },
  cityArea: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "500",
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1D1B20",
    alignItems: "center",
    justifyContent: "center",
  },
});
