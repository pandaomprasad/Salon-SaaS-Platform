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

export default function LocationPickerModal({
  visible,
  selectedCity: propSelectedCity,
  onSelectCity,
  onClose,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(isDark);
  const storeCity = useLocationStore((state) => state.selectedCity);
  const selectedCity = propSelectedCity || storeCity || "Brahmapur";

  const [search, setSearch] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [detectedGps, setDetectedGps] = useState(null);
  const [activeLocation, setActiveLocation] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    if (visible) {
      setSearch("");
      setSearchResults([]);
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
        setDetectStatus("Detecting location...");
        getCurrentLocation()
          .then((geoResult) => {
            const city = cleanCityName(geoResult.city || "Brahmapur");
            const state = geoResult.state || "Odisha";
            const area = geoResult.area || (state && state.toLowerCase() !== city.toLowerCase() ? `${state}, India` : "India");

            const locObj = {
              id: city,
              name: city,
              city,
              state,
              area,
              label: `${city}, ${area}`,
            };

            setDetectedGps(locObj);
            if (!activeLocation) setActiveLocation(locObj);
            storage.setItem("@cached_gps_loc", JSON.stringify(locObj));
            setIsDetecting(false);
            setDetectStatus("");
          })
          .catch((err) => {
            console.warn("Auto-detect GPS error:", err);
            setIsDetecting(false);
            setDetectStatus("");
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
        placeObj.name || placeObj.city || placeObj.id || "Brahmapur"
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
      useLocationStore.getState().setLocationDetails(newLoc);
      if (onSelectCity) onSelectCity(cityName);
      onClose();
    },
    [onSelectCity, onClose]
  );

  const handleGpsClick = async () => {
    if (detectedGps) {
      handleLocationSelect(detectedGps);
      return;
    }

    setIsDetecting(true);
    setDetectStatus("Detecting location...");

    try {
      const geoResult = await getCurrentLocation();
      const city = cleanCityName(geoResult.city || "Brahmapur");
      const state = geoResult.state || "Odisha";
      const area = geoResult.area || (state && state.toLowerCase() !== city.toLowerCase() ? `${state}, India` : "India");

      const locObj = {
        id: city,
        name: city,
        city,
        state,
        area,
        label: `${city}, ${area}`,
      };

      setDetectedGps(locObj);
      setActiveLocation(locObj);
      storage.setItem("@cached_gps_loc", JSON.stringify(locObj));
      setDetectStatus(`Detected: ${city}`);

      setTimeout(() => {
        setIsDetecting(false);
        setDetectStatus("");
        handleLocationSelect(locObj);
      }, 300);
    } catch (err) {
      setDetectStatus("Using Brahmapur");
      const fallbackObj = {
        id: "Brahmapur",
        name: "Brahmapur",
        city: "Brahmapur",
        state: "Odisha",
        area: "Odisha, India",
        label: "Brahmapur, Odisha, India",
      };
      setDetectedGps(fallbackObj);
      setActiveLocation(fallbackObj);
      setTimeout(() => {
        setIsDetecting(false);
        setDetectStatus("");
        handleLocationSelect(fallbackObj);
      }, 300);
    }
  };

  const currentCardData =
    activeLocation ||
    detectedGps || {
      city: selectedCity || "Brahmapur",
      state: "Odisha",
      area: "Odisha, India",
    };

  return (
    <AppleBottomSheet
      visible={visible}
      onClose={onClose}
      height="85%"
    >
      <View style={styles.sheetInner}>
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Select Location</Text>
            <Text style={styles.subtitle}>Find top salons near you</Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={isDark ? "#FFFFFF" : "#18181B"} />
          </TouchableOpacity>
        </View>

        {/* GPS Use Current Location Card */}
        <TouchableOpacity
          style={styles.gpsCard}
          onPress={handleGpsClick}
          disabled={isDetecting}
          activeOpacity={0.8}
        >
          <View style={styles.gpsIconCircle}>
            {isDetecting ? (
              <ActivityIndicator size="small" color="#C05278" />
            ) : (
              <Ionicons name="disc-outline" size={20} color="#C05278" />
            )}
          </View>
          <View style={styles.gpsTextInfo}>
            <Text style={styles.gpsTitle}>Use Current Location</Text>
            <Text style={styles.gpsSub} numberOfLines={1}>
              {isDetecting
                ? detectStatus || "Detecting location..."
                : detectedGps
                ? `${detectedGps.city}${detectedGps.area ? `, ${detectedGps.area}` : ""}`
                : "Tap to detect your current location"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#A1A1AA" />
        </TouchableOpacity>

        {/* Search Bar Input Box */}
        <View style={styles.searchPill}>
          <Ionicons name="search-outline" size={18} color="#9999A0" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Indian city, area or pincode..."
            placeholderTextColor="#9999A0"
            value={search}
            onChangeText={setSearch}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color="#C05278" />
          ) : search ? (
            <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#9999A0" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Scrollable Content Body */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollBody}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Current Location Section */}
          {!search ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.eyebrow}>CURRENT LOCATION</Text>
              <TouchableOpacity
                style={styles.currentLocCard}
                onPress={() => handleLocationSelect(currentCardData)}
                activeOpacity={0.85}
              >
                <View style={styles.currentLocIconCircle}>
                  <Ionicons name="location-sharp" size={20} color="#7A0026" />
                </View>
                <View style={styles.currentLocTextWrap}>
                  <Text style={styles.currentLocCity}>
                    {currentCardData.city || currentCardData.name}
                  </Text>
                  <Text style={styles.currentLocSub} numberOfLines={1}>
                    {currentCardData.area || "Odisha, India"}
                  </Text>
                </View>

                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>

                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Recent Searches Section */}
          {!search && recentSearches.length > 0 ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.eyebrow}>RECENT SEARCHES</Text>
              {recentSearches.map((place) => (
                <TouchableOpacity
                  key={place.id || place.name}
                  style={styles.cityCard}
                  onPress={() => handleLocationSelect(place)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cityIconWrap}>
                    <Ionicons name="time-outline" size={20} color="#C05278" />
                  </View>
                  <View style={styles.cityInfo}>
                    <Text style={styles.cityName}>{place.name}</Text>
                    <Text style={styles.cityArea} numberOfLines={1}>{place.area}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {/* Search Results Section */}
          {search.length >= 2 ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.eyebrow}>SEARCH RESULTS</Text>
              {searchResults.length > 0 ? (
                searchResults.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.cityCard}
                    onPress={() => handleLocationSelect(place)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cityIconWrap}>
                      <Ionicons name="location-outline" size={20} color="#C05278" />
                    </View>
                    <View style={styles.cityInfo}>
                      <Text style={styles.cityName}>{place.name}</Text>
                      <Text style={styles.cityArea} numberOfLines={1}>{place.area}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
                  </TouchableOpacity>
                ))
              ) : !isSearching ? (
                <Text style={styles.noResultsText}>No matching locations found</Text>
              ) : null}
            </View>
          ) : null}
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
      paddingTop: 10,
      paddingBottom: Platform.OS === "ios" ? 28 : 16,
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
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: "400",
      color: isDark ? "#A1A1AA" : "#71717A",
      marginTop: 2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "#282834" : "#F4F4F6",
      alignItems: "center",
      justifyContent: "center",
    },
    gpsCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#22222D" : "#FAFAFB",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? "#27272A" : "#F4F4F6",
    },
    gpsIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FDF0F2",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    gpsTextInfo: {
      flex: 1,
    },
    gpsTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    gpsSub: {
      fontSize: 12,
      color: isDark ? "#A1A1AA" : "#71717A",
      marginTop: 2,
    },
    searchPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#22222D" : "#F4F4F6",
      borderRadius: 20,
      paddingHorizontal: 14,
      height: 46,
      marginBottom: 20,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: isDark ? "#FFFFFF" : "#18181B",
      paddingVertical: 0,
    },
    scrollBody: {
      flex: 1,
    },
    sectionContainer: {
      marginBottom: 20,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: "700",
      color: isDark ? "#A1A1AA" : "#71717A",
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    currentLocCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FDF0F2",
      padding: 14,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: "#C05278",
    },
    currentLocIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FDF0F2",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    currentLocTextWrap: {
      flex: 1,
    },
    currentLocCity: {
      fontSize: 15,
      fontWeight: "700",
      color: "#18181B",
    },
    currentLocSub: {
      fontSize: 12,
      color: "#71717A",
      marginTop: 2,
    },
    currentBadge: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 10,
    },
    currentBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#7A0026",
    },
    checkCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#C05278",
      alignItems: "center",
      justifyContent: "center",
    },
    popularHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    seeAllText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#C05278",
    },
    cityCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1E1E24" : "#FFFFFF",
      padding: 12,
      borderRadius: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDark ? "#27272A" : "#F4F4F6",
    },
    cityCardSelected: {
      borderColor: "#C05278",
      backgroundColor: "#FDF0F2",
    },
    cityIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: "#FDF0F2",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    cityInfo: {
      flex: 1,
    },
    cityName: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    cityArea: {
      fontSize: 12,
      color: isDark ? "#A1A1AA" : "#71717A",
      marginTop: 2,
    },
    noResultsText: {
      fontSize: 13,
      color: isDark ? "#A1A1AA" : "#71717A",
      fontStyle: "italic",
      paddingVertical: 10,
    },
  });
}
