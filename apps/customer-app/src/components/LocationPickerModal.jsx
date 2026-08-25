// src/components/LocationPickerModal.jsx
import React, { useState, useEffect, useCallback } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S } from "../theme";
import { getCurrentLocation, searchLocations, cleanCityName } from "../services/locationService";
import { storage } from "../services/storage";
import AppleBottomSheet from "./AppleBottomSheet";
import AppleTouchable from "./AppleTouchable";

const RECENT_KEY = "@recent_locations_v2";

const POPULAR_CITIES = [
  { id: "Mumbai", name: "Mumbai", area: "Bandra, Juhu, South Mumbai", lat: 19.076, lng: 72.8777 },
  { id: "Delhi", name: "Delhi NCR", area: "Connaught Place, Saket, Gurgaon", lat: 28.6139, lng: 77.209 },
  { id: "Bangalore", name: "Bangalore", area: "Indiranagar, Koramangala", lat: 12.9716, lng: 77.5946 },
  { id: "Hyderabad", name: "Hyderabad", area: "Banjara Hills, Jubilee Hills", lat: 17.385, lng: 78.4867 },
  { id: "Pune", name: "Pune", area: "Koregaon Park, Viman Nagar", lat: 18.5204, lng: 73.8567 },
  { id: "Kolkata", name: "Kolkata", area: "Park Street, Salt Lake", lat: 22.5726, lng: 88.3639 },
  { id: "Chennai", name: "Chennai", area: "Nungambakkam, Anna Nagar", lat: 13.0827, lng: 80.2707 },
];

export default function LocationPickerModal({
  visible,
  selectedCity,
  onSelectCity,
  onClose,
}) {
  const styles = getStyles();
  const [search, setSearch] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [detectedGps, setDetectedGps] = useState(null);
  const [activeLocation, setActiveLocation] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  // Load recent searches from storage when modal opens
  useEffect(() => {
    if (visible) {
      setSearch("");
      setSearchResults([]);
      setIsFocused(false);
      storage.getItem(RECENT_KEY).then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setRecentSearches(parsed.slice(0, 3));
            }
          } catch (e) {
            console.warn("Failed to parse recent locations", e);
          }
        }
      });
    }
  }, [visible]);

  // Auto-detect or restore cached location when modal opens
  useEffect(() => {
    if (visible && !detectedGps) {
      storage.getItem("@cached_gps_loc").then((rawCache) => {
        if (rawCache) {
          try {
            const cached = JSON.parse(rawCache);
            if (cached && cached.city) {
              setDetectedGps(cached);
              if (!activeLocation) setActiveLocation(cached);
              return;
            }
          } catch (e) {
            console.warn("Error reading location cache", e);
          }
        }

        // Only fetch via API if no cache exists
        setIsDetecting(true);
        getCurrentLocation()
          .then((geoResult) => {
            const city = cleanCityName(geoResult.city || "Delhi");
            const state = geoResult.state || "Odisha";
            const displayLabel = state && state.toLowerCase() !== city.toLowerCase()
              ? `${city}, ${state}`
              : city;

            const locObj = {
              city,
              state,
              area: geoResult.area || displayLabel,
              label: displayLabel,
            };

            setDetectedGps(locObj);
            if (!activeLocation) setActiveLocation(locObj);
            storage.setItem("@cached_gps_loc", JSON.stringify(locObj));
            setIsDetecting(false);
          })
          .catch((err) => {
            console.warn("Auto-detect GPS error:", err);
            setIsDetecting(false);
          });
      });
    }
  }, [visible]);

  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocations(search);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Save selected place into recent searches & update active current location card
  const handleLocationSelect = useCallback((placeObj) => {
    const cityName = cleanCityName(placeObj.name || placeObj.city || placeObj.id || "Mumbai");
    const areaName = placeObj.area || placeObj.name || cityName;
    const stateName = placeObj.state || (areaName.includes(",") ? areaName.split(",").slice(-2)[0].trim() : "");

    const newLoc = {
      id: placeObj.id || cityName,
      city: cityName,
      name: cityName,
      area: areaName,
      state: stateName,
    };

    // 1. Clear search bar input and results
    setSearch("");
    setSearchResults([]);

    // 2. Update active current location card display
    setActiveLocation(newLoc);

    // 3. Add to recent searches array (max 3 items, newest first)
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.name.toLowerCase() !== cityName.toLowerCase());
      const updated = [newLoc, ...filtered].slice(0, 3);
      storage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });

    // 4. Update Home Screen city selection
    onSelectCity(cityName);
    onClose();
  }, [onSelectCity, onClose]);

  const filteredPopular = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.area.toLowerCase().includes(search.toLowerCase())
  );

  const handleGpsClick = async () => {
    console.log("👉 [BUTTON CLICK] 'Use Current GPS Location' button pressed");
    
    if (detectedGps) {
      handleLocationSelect({
        id: detectedGps.city,
        name: detectedGps.city,
        city: detectedGps.city,
        area: detectedGps.label,
        state: detectedGps.state,
      });
      return;
    }

    setIsDetecting(true);
    setDetectStatus("Accessing GPS & Google Maps...");

    try {
      const geoResult = await getCurrentLocation();
      const city = cleanCityName(geoResult.city || "Delhi");
      const state = geoResult.state || "Odisha";
      const displayLabel = (state && state.toLowerCase() !== city.toLowerCase())
        ? `${city}, ${state}`
        : city;

      const locObj = {
        id: city,
        name: city,
        city,
        state,
        area: displayLabel,
        label: displayLabel,
      };

      setDetectedGps(locObj);
      setDetectStatus(`Detected: ${displayLabel}`);

      setTimeout(() => {
        setIsDetecting(false);
        setDetectStatus("");
        handleLocationSelect(locObj);
      }, 400);
    } catch (err) {
      console.error("❌ [BUTTON ERROR] GPS Detection Error:", err);
      setDetectStatus("GPS location set to Delhi");
      setTimeout(() => {
        setIsDetecting(false);
        setDetectStatus("");
        handleLocationSelect({ id: "Delhi", name: "Delhi", city: "Delhi", area: "Delhi, India" });
      }, 400);
    }
  };

  const currentCardData = activeLocation || detectedGps || { city: selectedCity || "Bhubaneswar", state: "Odisha" };

  return (
    <AppleBottomSheet visible={visible} onClose={onClose} height={isFocused || search.length > 0 ? "90%" : "78%"}>
      <View style={styles.sheetInner}>
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Select Location</Text>
            <Text style={styles.subtitle}>Discover top salons near your city</Text>
          </View>

          <AppleTouchable style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={C.ink} />
          </AppleTouchable>
        </View>

        {/* GPS Auto Detect Dark Card */}
        <AppleTouchable
          style={styles.gpsBtn}
          onPress={handleGpsClick}
          disabled={isDetecting}
          scaleTo={0.97}
          hapticType="medium"
        >
          <View style={styles.gpsIconBox}>
            {isDetecting ? (
              <ActivityIndicator size="small" color={C.bg} />
            ) : (
              <Ionicons name="navigate" size={18} color={C.bg} />
            )}
          </View>
          <View style={styles.gpsTextInfo}>
            <Text style={styles.gpsTitle}>Use Current GPS Location</Text>
            <Text style={styles.gpsSub} numberOfLines={1}>
              {detectStatus || (detectedGps ? detectedGps.label : isDetecting ? "Detecting location..." : "Auto-detect nearest area")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.4)" />
        </AppleTouchable>

          {/* Search Input Box */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={C.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city, area or pincode..."
              placeholderTextColor={C.muted}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                if (!search) setIsFocused(false);
              }}
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={C.muted} />
            ) : search ? (
              <TouchableOpacity onPress={() => { setSearch(""); setIsFocused(false); }}>
                <Ionicons name="close-circle" size={18} color={C.muted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={[styles.cityList, (isFocused || search.length > 0) && { maxHeight: "78%" }]}>
            {/* Current Location Card */}
            {!search ? (
              <View style={styles.currentLocSection}>
                <Text style={styles.sectionLabel}>CURRENT LOCATION</Text>
                <TouchableOpacity
                  style={[
                    styles.currentLocCard,
                    selectedCity === currentCardData.city && styles.currentLocCardSelected,
                  ]}
                  onPress={() => handleLocationSelect(currentCardData)}
                  activeOpacity={0.8}
                >
                  <View style={styles.currentLocIconBox}>
                    <Ionicons name="location" size={20} color={C.ink} />
                  </View>
                  <View style={styles.currentLocTextWrap}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.currentLocCity}>{currentCardData.city}</Text>
                    </View>
                    <Text style={styles.currentLocSub} numberOfLines={1}>
                      {currentCardData.state ? `${currentCardData.state}, India` : "India"}
                    </Text>
                  </View>
                  {selectedCity === currentCardData.city ? (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={14} color={C.bg} />
                    </View>
                  ) : (
                    <View style={styles.selectPill}>
                      <Text style={styles.selectPillText}>Select</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Recent Searches Section (Max 3) */}
            {!search && recentSearches.length > 0 ? (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Text style={styles.sectionLabel}>RECENT SEARCHES</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setRecentSearches([]);
                      storage.removeItem(RECENT_KEY);
                    }}
                  >
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((item) => {
                  const isSelected = selectedCity === item.name || selectedCity === item.city;
                  return (
                    <TouchableOpacity
                      key={`recent_${item.id || item.name}`}
                      style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                      onPress={() => handleLocationSelect(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cityIconWrap}>
                        <Ionicons name="time-outline" size={18} color={isSelected ? C.ink : C.muted} />
                      </View>
                      <View style={styles.cityInfo}>
                        <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                          {item.name}
                        </Text>
                        <Text style={styles.cityArea} numberOfLines={1}>
                          {item.area || item.name}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={14} color={C.bg} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {/* Location Results / Popular Cities */}
            <Text style={styles.sectionLabel}>
              {search.length >= 2 ? "SEARCH RESULTS" : "POPULAR CITIES"}
            </Text>

            {search.length >= 2 && searchResults.length > 0
              ? searchResults.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.cityRow}
                    onPress={() => handleLocationSelect(place)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cityIconWrap}>
                      <Ionicons name="map-outline" size={18} color={C.ink} />
                    </View>
                    <View style={styles.cityInfo}>
                      <Text style={styles.cityNameSelected}>{place.name}</Text>
                      <Text style={styles.cityArea} numberOfLines={1}>
                        {place.area}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              : filteredPopular.map((city) => {
                  const isSelected =
                    selectedCity &&
                    selectedCity.toLowerCase().includes(city.id.toLowerCase());
                  return (
                    <TouchableOpacity
                      key={city.id}
                      style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                      onPress={() => handleLocationSelect(city)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cityIconWrap}>
                        <Ionicons
                          name="location"
                          size={18}
                          color={isSelected ? C.ink : C.muted}
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
                          <Ionicons name="checkmark" size={14} color={C.bg} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
          </ScrollView>
        </View>
    </AppleBottomSheet>
  );
}

function getStyles() {
  return StyleSheet.create({
  sheetInner: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheetContainer: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    maxHeight: "82%",
  },
  sheetContainerFullScreen: {
    maxHeight: "100%",
    height: "100%",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
  },
  bottomFill: {
    position: "absolute",
    bottom: -100,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: C.surface,
  },
  handleBar: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.borderLight,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: C.muted,
    marginTop: 3,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.lifted,
    alignItems: "center",
    justifyContent: "center",
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.ink,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginBottom: 16,
  },
  gpsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  gpsTextInfo: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.bg,
    letterSpacing: -0.2,
  },
  gpsSub: {
    fontSize: 12,
    fontWeight: "400",
    color: C.muted,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.lifted,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: C.ink,
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: C.muted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  currentLocSection: {
    marginBottom: 16,
  },
  currentLocCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.lifted,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.borderLight,
  },
  currentLocCardSelected: {
    backgroundColor: C.surface,
    borderColor: C.ink,
  },
  currentLocIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.lifted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  currentLocTextWrap: {
    flex: 1,
  },
  currentLocCity: {
    fontSize: 16,
    fontWeight: "800",
    color: C.ink,
  },
  gpsBadge: {
    backgroundColor: C.ink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gpsBadgeText: {
    color: C.main,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  currentLocSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  selectPill: {
    backgroundColor: C.lifted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  selectPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textSecondary,
  },
  recentSection: {
    marginBottom: 16,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  clearText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
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
    backgroundColor: C.lifted,
  },
  cityRowSelected: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.ink,
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
    color: C.textSecondary,
  },
  cityNameSelected: {
    fontWeight: "900",
    color: C.ink,
  },
  cityArea: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  });
}


