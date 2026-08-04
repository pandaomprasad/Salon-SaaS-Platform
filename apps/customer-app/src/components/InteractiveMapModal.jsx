// src/components/InteractiveMapModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCurrentLocation, calculateDistance } from "../services/locationService";
import { paiseToINR } from "../services/apiClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function InteractiveMapModal({ visible, onClose, salons = [], onSelectSalon }) {
  const [userCoords, setUserCoords] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState("all");
  const [selectedStudio, setSelectedStudio] = useState(null);

  // Fetch current GPS Location on modal open
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    const fetchGps = async () => {
      setLoadingLocation(true);
      try {
        const loc = await getCurrentLocation();
        if (cancelled) return;
        if (loc && loc.latitude && loc.longitude) {
          setUserCoords({ lat: loc.latitude, lng: loc.longitude, city: loc.city });
        } else {
          setUserCoords({ lat: 19.060, lng: 72.836, city: "Mumbai" });
        }
      } catch (err) {
        console.log("📍 [MAP MODAL] Location error, using default coords:", err.message);
        if (!cancelled) {
          setUserCoords({ lat: 19.060, lng: 72.836, city: "Mumbai" });
        }
      } finally {
        if (!cancelled) setLoadingLocation(false);
      }
    };

    fetchGps();
    return () => { cancelled = true; };
  }, [visible]);

  const studioBranches = useMemo(() => {
    const list = [];
    salons.forEach((salon) => {
      const branches = salon.branches || [
        {
          _id: salon._id || salon.id,
          name: salon.name,
          address: {
            street: "Main Street",
            city: salon.city || "Mumbai",
            coordinates: { lat: 19.060, lng: 72.836 },
          },
        },
      ];

      branches.forEach((b) => {
        const bLat = b.address?.coordinates?.lat || 19.060;
        const bLng = b.address?.coordinates?.lng || 72.836;

        let distanceKm = null;
        if (userCoords && userCoords.lat && userCoords.lng && bLat && bLng) {
          distanceKm = calculateDistance(userCoords.lat, userCoords.lng, bLat, bLng);
        }

        list.push({
          id: b._id || b.id,
          branchName: b.name || salon.name,
          salonName: salon.name,
          salon: salon,
          branch: b,
          addressStr: b.address?.street ? `${b.address.street}, ${b.address.city}` : (b.address?.city || "Mumbai"),
          city: b.address?.city || salon.city || "Mumbai",
          lat: bLat,
          lng: bLng,
          distanceKm: distanceKm !== null ? distanceKm : 2.5,
          rating: (salon.rating || 4.8).toFixed(1),
          coverImage: salon.coverImage || salon.image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop",
        });
      });
    });

    list.sort((a, b) => a.distanceKm - b.distanceKm);
    return list;
  }, [salons, userCoords]);

  useEffect(() => {
    if (studioBranches.length > 0 && !selectedStudio) {
      setSelectedStudio(studioBranches[0]);
    }
  }, [studioBranches, selectedStudio]);

  const filteredBranches = useMemo(() => {
    if (selectedRadius === "5km") {
      return studioBranches.filter((b) => b.distanceKm <= 5);
    }
    if (selectedRadius === "10km") {
      return studioBranches.filter((b) => b.distanceKm <= 10);
    }
    return studioBranches;
  }, [studioBranches, selectedRadius]);

  const handleOpenDirections = (lat, lng, name) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch((err) => console.log("Failed to open maps:", err));
  };

  const handleBookStudio = (item) => {
    onClose();
    if (onSelectSalon) {
      onSelectSalon(item.salon);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerSub}>INTERACTIVE GPS MAP</Text>
            <Text style={styles.headerTitle}>Nearby Studios ({filteredBranches.length})</Text>
          </View>
          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={() => {
              setUserCoords({ lat: 19.060, lng: 72.836, city: "Mumbai" });
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="locate-sharp" size={18} color="#D4AF37" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[styles.filterChip, selectedRadius === "all" && styles.filterChipActive]}
            onPress={() => setSelectedRadius("all")}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterText, selectedRadius === "all" && styles.filterTextActive]}>
              ✨ All ({studioBranches.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedRadius === "5km" && styles.filterChipActive]}
            onPress={() => setSelectedRadius("5km")}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterText, selectedRadius === "5km" && styles.filterTextActive]}>
              📍 &lt; 5 km
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedRadius === "10km" && styles.filterChipActive]}
            onPress={() => setSelectedRadius("10km")}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterText, selectedRadius === "10km" && styles.filterTextActive]}>
              🚗 &lt; 10 km
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapCanvas}>
          {loadingLocation ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.loadingText}>Acquiring GPS location...</Text>
            </View>
          ) : (
            <View style={styles.mapGraphicContainer}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop" }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <View style={styles.mapDarkMask} />

              <View style={styles.userGpsPulse}>
                <View style={styles.userGpsDot} />
              </View>

              {filteredBranches.map((item, idx) => {
                const isSelected = selectedStudio?.id === item.id;
                const topPos = 80 + (idx * 55) % 160;
                const leftPos = 40 + (idx * 90) % (SCREEN_WIDTH - 120);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.mapPinContainer,
                      { top: topPos, left: leftPos },
                      isSelected && styles.mapPinContainerSelected,
                    ]}
                    onPress={() => setSelectedStudio(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="location-sharp"
                      size={isSelected ? 26 : 20}
                      color={isSelected ? "#E6CA65" : "#FFFFFF"}
                    />
                    <View style={[styles.pinBadge, isSelected && styles.pinBadgeSelected]}>
                      <Text style={[styles.pinBadgeText, isSelected && styles.pinBadgeTextSelected]}>
                        {item.distanceKm} km
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {selectedStudio ? (
          <View style={styles.studioCardPopup}>
            <View style={styles.popupTopRow}>
              <View style={styles.popupInfo}>
                <View style={styles.distTag}>
                  <Ionicons name="navigate-sharp" size={11} color="#D4AF37" />
                  <Text style={styles.distTagText}>{selectedStudio.distanceKm} km away</Text>
                </View>
                <Text style={styles.popupTitle} numberOfLines={1}>{selectedStudio.branchName}</Text>
                <Text style={styles.popupAddr} numberOfLines={1}>📍 {selectedStudio.addressStr}</Text>
              </View>

              <View style={styles.ratingBox}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingVal}>{selectedStudio.rating}</Text>
              </View>
            </View>

            <View style={styles.popupActionRow}>
              <TouchableOpacity
                style={styles.dirBtn}
                onPress={() => handleOpenDirections(selectedStudio.lat, selectedStudio.lng, selectedStudio.branchName)}
                activeOpacity={0.85}
              >
                <Ionicons name="compass-outline" size={16} color="#1A1A1A" />
                <Text style={styles.dirBtnText}>Get Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => handleBookStudio(selectedStudio)}
                activeOpacity={0.88}
              >
                <Text style={styles.bookBtnText}>Book Studio →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FAF9F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerSub: {
    fontSize: 9,
    fontWeight: "800",
    color: "#8E8880",
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    marginTop: 2,
  },
  gpsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#FAF9F6",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  filterChipActive: {
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
  },
  filterText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  mapCanvas: {
    flex: 1,
    position: "relative",
    backgroundColor: "#1A1A1A",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  mapGraphicContainer: {
    ...StyleSheet.absoluteFillObject,
    position: "relative",
  },
  mapDarkMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 18, 30, 0.65)",
  },
  userGpsPulse: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(212, 175, 55, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  userGpsDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D4AF37",
  },
  mapPinContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 26, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    gap: 4,
  },
  mapPinContainerSelected: {
    backgroundColor: "#1A1A1A",
    borderColor: "#E6CA65",
  },
  pinBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pinBadgeSelected: {
    backgroundColor: "#E6CA65",
  },
  pinBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  pinBadgeTextSelected: {
    color: "#1A1A1A",
  },
  studioCardPopup: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  popupTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  popupInfo: {
    flex: 1,
    paddingRight: 10,
  },
  distTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  distTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D4AF37",
    letterSpacing: 0.8,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  popupAddr: {
    fontSize: 12,
    color: "#77726A",
    marginTop: 2,
    fontWeight: "500",
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  ratingStar: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "900",
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  popupActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  dirBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF9F6",
    paddingVertical: 12,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  dirBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  bookBtn: {
    flex: 1.2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    paddingVertical: 12,
    borderRadius: 18,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E6CA65",
  },
});
