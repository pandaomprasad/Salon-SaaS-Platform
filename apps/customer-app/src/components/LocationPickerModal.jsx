// src/components/LocationPickerModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { getCurrentLocation, searchLocations, cleanCityName } from "../services/locationService";
import { storage } from "../services/storage";
import { useLocationStore } from "../store/useLocationStore";
import AppleBottomSheet from "./AppleBottomSheet";

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
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const [search, setSearch] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [detectedGps, setDetectedGps] = useState(null);
  const [activeLocation, setActiveLocation] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

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

        setIsDetecting(true);
        getCurrentLocation()
          .then((geoResult) => {
            const city = cleanCityName(geoResult.city || "Delhi");
            const state = geoResult.state || "Odisha";
            const displayLabel =
              state && state.toLowerCase() !== city.toLowerCase()
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

  const handleLocationSelect = useCallback(
    (placeObj) => {
      const cityName = cleanCityName(
        placeObj.name || placeObj.city || placeObj.id || "Mumbai"
      );
      const areaName = placeObj.area || placeObj.name || cityName;
      const stateName =
        placeObj.state ||
        (areaName.includes(",")
          ? areaName.split(",").slice(-2)[0].trim()
          : "");

      const newLoc = {
        id: placeObj.id || cityName,
        city: cityName,
        name: cityName,
        area: areaName,
        state: stateName,
      };

      setSearch("");
      setSearchResults([]);
      setActiveLocation(newLoc);

      setRecentSearches((prev) => {
        const filtered = prev.filter(
          (item) => item.name.toLowerCase() !== cityName.toLowerCase()
        );
        const updated = [newLoc, ...filtered].slice(0, 3);
        storage.setItem(RECENT_KEY, JSON.stringify(updated));
        return updated;
      });

      useLocationStore.getState().setSelectedCity(cityName);
      if (onSelectCity) onSelectCity(cityName);
      onClose();
    },
    [onSelectCity, onClose]
  );

  const filteredPopular = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.area.toLowerCase().includes(search.toLowerCase())
  );

  const handleGpsClick = async () => {
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
    setDetectStatus("Accessing GPS & Maps...");

    try {
      const geoResult = await getCurrentLocation();
      const city = cleanCityName(geoResult.city || "Delhi");
      const state = geoResult.state || "Odisha";
      const displayLabel =
        state && state.toLowerCase() !== city.toLowerCase()
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
      setDetectStatus("GPS location set to Delhi");
      setTimeout(() => {
        setIsDetecting(false);
        setDetectStatus("");
        handleLocationSelect({
          id: "Delhi",
          name: "Delhi",
          city: "Delhi",
          area: "Delhi, India",
        });
      }, 400);
    }
  };

  const currentCardData =
    activeLocation ||
    detectedGps || {
      city: selectedCity || "Bhubaneswar",
      state: "Odisha",
      area: "Odisha, India",
    };

  return (
    <AppleBottomSheet
      visible={visible}
      onClose={onClose}
      height={isFocused || search.length > 0 ? "88%" : "78%"}
    >
      <View style={styles.sheetInner}>
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Select Location</Text>
            <Text style={styles.subtitle}>Discover top salons near your city</Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={isDark ? "#FFFFFF" : "#18181B"} />
          </TouchableOpacity>
        </View>

        {/* GPS Auto Detect Banner Card */}
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={handleGpsClick}
          disabled={isDetecting}
          activeOpacity={0.82}
        >
          <View style={styles.gpsIconBox}>
            {isDetecting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="navigate" size={18} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.gpsTextInfo}>
            <Text style={styles.gpsTitle}>Use Current GPS Location</Text>
            <Text style={styles.gpsSub} numberOfLines={1}>
              {detectStatus ||
                (detectedGps
                  ? detectedGps.label
                  : isDetecting
                  ? "Detecting location..."
                  : "Auto-detect nearest area")}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isDark ? "#8E8E9A" : "#8E8E93"}
          />
        </TouchableOpacity>

        {/* Search Input Box */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={18}
            color={isDark ? "#8E8E9A" : "#8E8E93"}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city, area or pincode..."
            placeholderTextColor={isDark ? "#71717A" : "#A0A0AB"}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              if (!search) setIsFocused(false);
            }}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color="#6C5CE7" />
          ) : search ? (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                setIsFocused(false);
              }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={isDark ? "#8E8E9A" : "#8E8E93"}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollBody}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Current Location Card */}
          {!search ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>CURRENT LOCATION</Text>
              <TouchableOpacity
                style={styles.currentLocCard}
                onPress={() => handleLocationSelect(currentCardData)}
                activeOpacity={0.82}
              >
                <View style={styles.currentLocIconBox}>
                  <Ionicons name="location" size={20} color="#6C5CE7" />
                </View>
                <View style={styles.currentLocTextWrap}>
                  <Text style={styles.currentLocCity}>
                    {currentCardData.city || currentCardData.name}
                  </Text>
                  <Text style={styles.currentLocSub} numberOfLines={1}>
                    {currentCardData.area || currentCardData.state || "Odisha, India"}
                  </Text>
                </View>

                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Recent Searches Section */}
          {!search && recentSearches.length > 0 ? (
            <View style={styles.sectionContainer}>
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
                const isSelected =
                  selectedCity === item.name || selectedCity === item.city;
                return (
                  <TouchableOpacity
                    key={`recent_${item.id || item.name}`}
                    style={[
                      styles.cityRow,
                      isSelected && styles.cityRowSelected,
                    ]}
                    onPress={() => handleLocationSelect(item)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.cityIconWrap}>
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={isSelected ? "#6C5CE7" : isDark ? "#8E8E9A" : "#8E8E93"}
                      />
                    </View>
                    <View style={styles.cityInfo}>
                      <Text
                        style={[
                          styles.cityName,
                          isSelected && styles.cityNameSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.cityArea} numberOfLines={1}>
                        {item.area || item.name}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
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
                  activeOpacity={0.75}
                >
                  <View style={styles.cityIconWrap}>
                    <Ionicons name="location-outline" size={18} color="#6C5CE7" />
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
                    style={[
                      styles.cityRow,
                      isSelected && styles.cityRowSelected,
                    ]}
                    onPress={() => handleLocationSelect(city)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.cityIconWrap}>
                      <Ionicons
                        name="location"
                        size={18}
                        color={isSelected ? "#6C5CE7" : isDark ? "#8E8E9A" : "#8E8E93"}
                      />
                    </View>

                    <View style={styles.cityInfo}>
                      <Text
                        style={[
                          styles.cityName,
                          isSelected && styles.cityNameSelected,
                        ]}
                      >
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
    </AppleBottomSheet>
  );
}

function getStyles(isDark) {
  return StyleSheet.create({
    sheetInner: {
      flex: 1,
      backgroundColor: isDark ? "#181820" : "#FFFFFF",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === "ios" ? 34 : 20,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    headerTextWrap: {
      flex: 1,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#18181B",
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 12.5,
      fontWeight: "500",
      color: isDark ? "#8E8E9A" : "#8E8E93",
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? "#282834" : "#F4F4F6",
      alignItems: "center",
      justifyContent: "center",
    },
    gpsBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#22222D" : "#F4F4F6",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: isDark ? "#323242" : "#E5E5EA",
    },
    gpsIconBox: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "#6C5CE7",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    gpsTextInfo: {
      flex: 1,
    },
    gpsTitle: {
      fontSize: 14.5,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    gpsSub: {
      fontSize: 12,
      fontWeight: "500",
      color: isDark ? "#8E8E9A" : "#8E8E93",
      marginTop: 2,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#22222D" : "#F4F4F6",
      borderRadius: 16,
      paddingHorizontal: 14,
      height: 46,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? "#323242" : "#E5E5EA",
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 13.5,
      color: isDark ? "#FFFFFF" : "#18181B",
      fontWeight: "500",
    },
    scrollBody: {
      flex: 1,
    },
    sectionContainer: {
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: isDark ? "#8E8E9A" : "#8E8E93",
      letterSpacing: 1,
      marginBottom: 8,
    },
    currentLocCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#22222D" : "#F7F7FA",
      padding: 14,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: "#6C5CE7",
    },
    currentLocIconBox: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(108, 92, 231, 0.15)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    currentLocTextWrap: {
      flex: 1,
    },
    currentLocCity: {
      fontSize: 15,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    currentLocSub: {
      fontSize: 12,
      color: isDark ? "#8E8E9A" : "#8E8E93",
      marginTop: 2,
      fontWeight: "500",
    },
    checkBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#6C5CE7",
      alignItems: "center",
      justifyContent: "center",
    },
    recentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    clearText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#6C5CE7",
    },
    cityRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      marginBottom: 4,
    },
    cityRowSelected: {
      backgroundColor: isDark ? "#22222D" : "#F4F4F6",
    },
    cityIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    cityInfo: {
      flex: 1,
    },
    cityName: {
      fontSize: 14.5,
      fontWeight: "600",
      color: isDark ? "#E0E0E6" : "#2C2C34",
    },
    cityNameSelected: {
      fontSize: 14.5,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    cityArea: {
      fontSize: 12,
      color: isDark ? "#8E8E9A" : "#8E8E93",
      marginTop: 2,
    },
  });
}
